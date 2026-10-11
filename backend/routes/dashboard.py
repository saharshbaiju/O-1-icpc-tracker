from flask import Blueprint, jsonify

from db import query, query_one
from routes.auth import current_team_id, current_user_id, login_required

dashboard = Blueprint("dashboard", __name__)


@dashboard.route("/dashboard", methods=["GET"])
@login_required
def overview():
    me = current_user_id()

    stats = query_one(
        """
        SELECT count(DISTINCT problem_code) FILTER (WHERE verdict = 'OK') AS solved,
               count(*)                                                   AS submissions,
               COALESCE(round(100.0 * count(*) FILTER (WHERE verdict = 'OK')
                              / NULLIF(count(*), 0)), 0)::int             AS acceptance
        FROM submission
        WHERE user_id = %s
        """,
        (me,),
    )
    rank = query_one(
        """
        SELECT rank, players FROM (
            SELECT user_id, rank() OVER (ORDER BY solved DESC) AS rank, count(*) OVER () AS players
            FROM v_leaderboard
        ) ranked
        WHERE user_id = %s
        """,
        (me,),
    )
    stats.update(rank)
    stats["problems"] = query_one("SELECT count(*) AS n FROM problem")["n"]

    # Problems on my team's sheets that I have not solved yet.
    up_next = query(
        """
        SELECT sh.sheet_id, sh.title AS sheet_title, sp.position, p.problem_code, p.title, p.rating
        FROM sheet sh
        JOIN sheet_problem sp ON sp.sheet_id = sh.sheet_id
        JOIN problem p        ON p.problem_code = sp.problem_code
        WHERE sh.team_id = %s
          AND NOT EXISTS (SELECT 1 FROM submission s
                          WHERE s.user_id = %s AND s.problem_code = sp.problem_code
                            AND s.verdict = 'OK')
        ORDER BY sh.deadline NULLS LAST, sp.position
        LIMIT 5
        """,
        (current_team_id(), me),
    )

    recent = query(
        """
        SELECT s.submitted_at, s.problem_code, p.title, s.language, s.verdict
        FROM submission s JOIN problem p ON p.problem_code = s.problem_code
        WHERE s.user_id = %s
        ORDER BY s.submitted_at DESC
        LIMIT 6
        """,
        (me,),
    )

    by_topic = query(
        """
        SELECT t.topic_name,
               count(DISTINCT pt.problem_code) AS total,
               count(DISTINCT pt.problem_code) FILTER (WHERE s.problem_code IS NOT NULL) AS solved
        FROM topic t
        JOIN problem_topic pt  ON pt.topic_id = t.topic_id
        LEFT JOIN submission s ON s.problem_code = pt.problem_code AND s.user_id = %s AND s.verdict = 'OK'
        GROUP BY t.topic_name
        ORDER BY solved DESC, total DESC
        LIMIT 10
        """,
        (me,),
    )

    by_difficulty = query(
        """
        SELECT d.difficulty,
               count(*) AS total,
               count(*) FILTER (WHERE EXISTS (
                   SELECT 1 FROM submission s
                   WHERE s.problem_code = d.problem_code AND s.user_id = %s AND s.verdict = 'OK')) AS solved
        FROM v_problem_difficulty d
        WHERE d.difficulty IS NOT NULL
        GROUP BY d.difficulty
        ORDER BY min(d.rating)
        """,
        (me,),
    )

    sheets = query(
        """
        SELECT sh.sheet_id, sh.title, sh.deadline,
               COALESCE(vp.total, 0) AS total, COALESCE(vp.solved, 0) AS solved
        FROM sheet sh
        LEFT JOIN v_sheet_progress vp ON vp.sheet_id = sh.sheet_id AND vp.user_id = %s
        WHERE sh.team_id = %s
        ORDER BY sh.deadline NULLS LAST
        """,
        (me, current_team_id()),
    )

    return jsonify({
        "stats": stats,
        "up_next": up_next,
        "recent": recent,
        "by_topic": by_topic,
        "by_difficulty": by_difficulty,
        "sheets": sheets,
    })
