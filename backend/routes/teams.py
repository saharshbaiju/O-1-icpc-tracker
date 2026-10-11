from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from db import execute, query, query_one
from routes.auth import current_team_id, current_user_id, login_required
from services.codeforces import CodeforcesError, sync_user

teams = Blueprint("teams", __name__)


@teams.route("/teams", methods=["GET"])
@login_required
def list_teams():
    """Every team, including empty ones (LEFT JOIN), with how much it has solved together."""
    rows = query(
        """
        SELECT t.team_id, t.team_name,
               count(DISTINCT u.user_id)                       AS members,
               COALESCE(string_agg(DISTINCT u.name, ', '), '') AS member_names,
               count(DISTINCT s.problem_code)                  AS solved
        FROM team t
        LEFT JOIN app_user u   ON u.team_id = t.team_id
        LEFT JOIN submission s ON s.user_id = u.user_id AND s.verdict = 'OK'
        GROUP BY t.team_id, t.team_name
        ORDER BY solved DESC, t.team_name
        """
    )
    return jsonify(rows)


@teams.route("/teams/mine", methods=["GET"])
@login_required
def my_team():
    team_id = current_team_id()
    if team_id is None:
        return jsonify(None)

    team = query_one("SELECT team_id, team_name FROM team WHERE team_id = %s", (team_id,))
    team["members"] = query(
        """
        SELECT u.user_id, u.name, u.cf_handle, un.univ_name, lb.solved
        FROM app_user u
        JOIN university un    ON un.univ_id = u.univ_id
        JOIN v_leaderboard lb ON lb.user_id = u.user_id
        WHERE u.team_id = %s
        ORDER BY u.name
        """,
        (team_id,),
    )
    team["solved"] = query_one(
        """
        SELECT count(DISTINCT s.problem_code) AS n
        FROM submission s JOIN app_user u ON u.user_id = s.user_id
        WHERE u.team_id = %s AND s.verdict = 'OK'
        """,
        (team_id,),
    )["n"]
    team["sheets"] = query_one("SELECT count(*) AS n FROM sheet WHERE team_id = %s", (team_id,))["n"]
    return jsonify(team)


@teams.route("/teams", methods=["POST"])
@login_required
def create_team():
    """Create a team and join it. Both statements run in one transaction."""
    team_name = (request.json.get("team_name") or "").strip()
    if not team_name:
        return jsonify({"error": "Team name is required"}), 400
    if current_team_id() is not None:
        return jsonify({"error": "Leave your current team first"}), 400

    team = execute("INSERT INTO team (team_name) VALUES (%s) RETURNING team_id", (team_name,))
    execute("UPDATE app_user SET team_id = %s WHERE user_id = %s", (team["team_id"], current_user_id()))
    return jsonify({"msg": "Team created", "team_id": team["team_id"]}), 201


@teams.route("/teams/<int:team_id>/join", methods=["POST"])
@login_required
def join_team(team_id):
    if current_team_id() is not None:
        return jsonify({"error": "Leave your current team first"}), 400

    # If the team already has 3 members, the team_size_check trigger raises
    # an error and app.py turns it into a JSON message.
    execute("UPDATE app_user SET team_id = %s WHERE user_id = %s", (team_id, current_user_id()))
    return jsonify({"msg": "Joined"})


@teams.route("/teams/leave", methods=["POST"])
@login_required
def leave_team():
    execute("UPDATE app_user SET team_id = NULL WHERE user_id = %s", (current_user_id(),))
    return jsonify({"msg": "Left the team"})


# ---------------------------------------------------------------- analytics

# Each member's accepted problems, with the moment they were FIRST solved.
# Re-solving a problem later does not count twice.
FIRST_SOLVES = """
    first_solves AS (
        SELECT s.user_id, s.problem_code, min(s.submitted_at) AS solved_at
        FROM submission s
        JOIN app_user u ON u.user_id = s.user_id
        WHERE u.team_id = %(team)s AND s.verdict = 'OK'
        GROUP BY s.user_id, s.problem_code
    )
"""


@teams.route("/teams/mine/analytics", methods=["GET"])
@login_required
def team_analytics():
    """Side-by-side numbers for every member of my team."""
    team_id = current_team_id()
    if team_id is None:
        return jsonify(None)

    # Submissions are stored in UTC, so "today" is the UTC date too.
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    params = {"team": team_id, "now": now, "today": now.date()}

    members = query(
        f"""
        WITH {FIRST_SOLVES},
        active_days AS (
            SELECT DISTINCT s.user_id, s.submitted_at::date AS day
            FROM submission s
            JOIN app_user u ON u.user_id = s.user_id
            WHERE u.team_id = %(team)s
        ),
        -- "Gaps and islands": for consecutive days, day - row_number() is the
        -- same value, so each group of equal values is one unbroken streak.
        islands AS (
            SELECT user_id, count(*) AS length, max(day) AS last_day
            FROM (
                SELECT user_id, day,
                       day - row_number() OVER (PARTITION BY user_id ORDER BY day)::int AS island
                FROM active_days
            ) numbered
            GROUP BY user_id, island
        )
        SELECT u.user_id, u.name, u.cf_handle, u.cf_rating, u.cf_max_rating,
               (SELECT count(*) FROM first_solves f WHERE f.user_id = u.user_id) AS solved,
               (SELECT count(*) FROM first_solves f
                 WHERE f.user_id = u.user_id AND f.solved_at > %(now)s - interval '30 days') AS solved_30d,
               (SELECT count(*) FROM active_days a
                 WHERE a.user_id = u.user_id AND a.day > %(today)s - 30) AS active_days_30,
               (SELECT COALESCE(max(length), 0) FROM islands i
                 WHERE i.user_id = u.user_id AND i.last_day >= %(today)s - 1) AS current_streak,
               (SELECT COALESCE(max(length), 0) FROM islands i WHERE i.user_id = u.user_id) AS longest_streak,
               (SELECT round(100.0 * count(*) FILTER (WHERE s.verdict = 'OK') / NULLIF(count(*), 0))::int
                  FROM submission s WHERE s.user_id = u.user_id) AS acceptance,
               (SELECT round(avg(p.rating))::int FROM first_solves f
                  JOIN problem p ON p.problem_code = f.problem_code
                 WHERE f.user_id = u.user_id) AS avg_solved_rating,
               (SELECT max(p.rating) FROM first_solves f
                  JOIN problem p ON p.problem_code = f.problem_code
                 WHERE f.user_id = u.user_id) AS hardest_solved,
               -- solved by this member and by no one else in the team
               (SELECT count(*) FROM first_solves f
                 WHERE f.user_id = u.user_id
                   AND NOT EXISTS (SELECT 1 FROM first_solves g
                                   WHERE g.problem_code = f.problem_code AND g.user_id <> f.user_id)) AS unique_solves
        FROM app_user u
        WHERE u.team_id = %(team)s
        ORDER BY u.name
        """,
        params,
    )

    # Problems first solved per member per week, for the last 12 weeks.
    this_monday = now.date() - timedelta(days=now.weekday())
    weeks = [this_monday - timedelta(weeks=i) for i in range(11, -1, -1)]
    weekly_rows = query(
        f"""
        WITH {FIRST_SOLVES}
        SELECT user_id, date_trunc('week', solved_at)::date AS week, count(*) AS solved
        FROM first_solves
        WHERE solved_at >= %(since)s
        GROUP BY user_id, week
        """,
        {**params, "since": weeks[0]},
    )
    weekly = {m["user_id"]: [0] * len(weeks) for m in members}
    for row in weekly_rows:
        weekly[row["user_id"]][weeks.index(row["week"])] = row["solved"]

    # Solved problems per member per topic.
    topics = query(
        f"""
        WITH {FIRST_SOLVES}
        SELECT f.user_id, t.topic_name, count(*) AS solved
        FROM first_solves f
        JOIN problem_topic pt ON pt.problem_code = f.problem_code
        JOIN topic t          ON t.topic_id = pt.topic_id
        GROUP BY f.user_id, t.topic_name
        """,
        params,
    )

    return jsonify({
        "members": members,
        "weeks": weeks,
        "weekly": weekly,
        "topics": topics,
    })


@teams.route("/teams/mine/sync", methods=["POST"])
@login_required
def sync_team():
    """Import Codeforces submissions for every member of my team who has a handle."""
    members = query(
        "SELECT user_id, name, cf_handle FROM app_user WHERE team_id = %s AND cf_handle IS NOT NULL",
        (current_team_id(),),
    )
    results = []
    for member in members:
        try:
            counts = sync_user(member["user_id"], member["cf_handle"])
            results.append({"name": member["name"], **counts})
        except CodeforcesError as error:
            results.append({"name": member["name"], "error": str(error)})
    return jsonify(results)
