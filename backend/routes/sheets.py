from flask import Blueprint, jsonify, request

from db import execute, query, query_one
from routes.auth import current_team_id, current_user_id, login_required
from services.codeforces import CodeforcesError, ensure_problem

sheets = Blueprint("sheets", __name__)


def find_my_sheet(sheet_id):
    """A sheet is only visible to members of the team it belongs to."""
    return query_one(
        "SELECT sheet_id, title, team_id, deadline FROM sheet WHERE sheet_id = %s AND team_id = %s",
        (sheet_id, current_team_id()),
    )


@sheets.route("/sheets", methods=["GET"])
@login_required
def list_sheets():
    """My team's sheets with my progress, read from the v_sheet_progress view."""
    rows = query(
        """
        SELECT sh.sheet_id, sh.title, sh.deadline,
               COALESCE(vp.total, 0) AS total, COALESCE(vp.solved, 0) AS solved
        FROM sheet sh
        LEFT JOIN v_sheet_progress vp ON vp.sheet_id = sh.sheet_id AND vp.user_id = %s
        WHERE sh.team_id = %s
        ORDER BY sh.deadline NULLS LAST, sh.sheet_id
        """,
        (current_user_id(), current_team_id()),
    )
    return jsonify(rows)


@sheets.route("/sheets/<int:sheet_id>", methods=["GET"])
@login_required
def sheet_detail(sheet_id):
    """The sheet's problems in order, the team members, and who has solved what."""
    sheet = find_my_sheet(sheet_id)
    if sheet is None:
        return jsonify({"error": "Sheet not found"}), 404

    sheet["problems"] = query(
        """
        SELECT sp.position, p.problem_code, p.title, p.rating, d.difficulty
        FROM sheet_problem sp
        JOIN problem p              ON p.problem_code = sp.problem_code
        JOIN v_problem_difficulty d ON d.problem_code = sp.problem_code
        WHERE sp.sheet_id = %s
        ORDER BY sp.position
        """,
        (sheet_id,),
    )
    sheet["members"] = query(
        """
        SELECT u.user_id, u.name, COALESCE(vp.solved, 0) AS solved, COALESCE(vp.total, 0) AS total
        FROM app_user u
        LEFT JOIN v_sheet_progress vp ON vp.user_id = u.user_id AND vp.sheet_id = %s
        WHERE u.team_id = %s
        ORDER BY u.name
        """,
        (sheet_id, sheet["team_id"]),
    )
    sheet["attempts"] = query(
        """
        SELECT s.user_id, s.problem_code,
               CASE WHEN bool_or(s.verdict = 'OK') THEN 'solved' ELSE 'attempted' END AS status
        FROM submission s
        JOIN sheet_problem sp ON sp.problem_code = s.problem_code AND sp.sheet_id = %s
        JOIN app_user u       ON u.user_id = s.user_id AND u.team_id = %s
        GROUP BY s.user_id, s.problem_code
        """,
        (sheet_id, sheet["team_id"]),
    )
    return jsonify(sheet)


@sheets.route("/sheets", methods=["POST"])
@login_required
def create_sheet():
    data = request.json
    title = (data.get("title") or "").strip()
    deadline = data.get("deadline") or None
    problem_codes = data.get("problem_codes", [])
    team_id = current_team_id()

    if team_id is None:
        return jsonify({"error": "Join a team first"}), 400
    if not title or not problem_codes:
        return jsonify({"error": "A sheet needs a title and at least one problem"}), 400

    # Problems picked from the Codeforces search may not be in our table yet.
    for problem_code in problem_codes:
        if query_one("SELECT 1 FROM problem WHERE problem_code = %s", (problem_code,)) is None:
            try:
                if not ensure_problem(problem_code):
                    return jsonify({"error": f"{problem_code} is not a Codeforces problem"}), 400
            except CodeforcesError as error:
                return jsonify({"error": str(error)}), 502

    sheet = execute(
        "INSERT INTO sheet (title, team_id, deadline) VALUES (%s, %s, %s) RETURNING sheet_id",
        (title, team_id, deadline),
    )
    for position, problem_code in enumerate(problem_codes, start=1):
        execute(
            "INSERT INTO sheet_problem (sheet_id, problem_code, position) VALUES (%s, %s, %s)",
            (sheet["sheet_id"], problem_code, position),
        )
    return jsonify({"msg": "Sheet created", "sheet_id": sheet["sheet_id"]}), 201


@sheets.route("/sheets/<int:sheet_id>", methods=["DELETE"])
@login_required
def delete_sheet(sheet_id):
    if find_my_sheet(sheet_id) is None:
        return jsonify({"error": "Sheet not found"}), 404
    # ON DELETE CASCADE removes the sheet's rows in sheet_problem.
    execute("DELETE FROM sheet WHERE sheet_id = %s", (sheet_id,))
    return jsonify({"msg": "Sheet deleted"})
