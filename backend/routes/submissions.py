from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from db import execute, query, query_one
from routes.auth import current_team_id, current_user_id, login_required
from services.codeforces import CodeforcesError, sync_user

submissions = Blueprint("submissions", __name__)


@submissions.route("/submissions", methods=["GET"])
@login_required
def list_submissions():
    """?scope=me (default) | team | all, optional ?verdict=OK"""
    scope = request.args.get("scope", "me")
    verdict = request.args.get("verdict")

    conditions, params = [], []
    if scope == "me":
        conditions.append("s.user_id = %s")
        params.append(current_user_id())
    elif scope == "team":
        conditions.append("u.team_id = %s")
        params.append(current_team_id())
    if verdict:
        conditions.append("s.verdict = %s")
        params.append(verdict)
    where = " AND ".join(conditions) or "TRUE"

    rows = query(
        f"""
        SELECT s.submitted_at, s.user_id, u.name, s.problem_code, p.title, s.language, s.verdict
        FROM submission s
        JOIN app_user u ON u.user_id = s.user_id
        JOIN problem p  ON p.problem_code = s.problem_code
        WHERE {where}
        ORDER BY s.submitted_at DESC
        LIMIT 500
        """,
        params,
    )
    return jsonify(rows)


@submissions.route("/submissions", methods=["POST"])
@login_required
def add_submission():
    """Log one attempt by hand (the Codeforces sync normally does this)."""
    data = request.json
    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    # FK, CHECK(verdict IN ...) and the primary key are enforced by the database.
    execute(
        """
        INSERT INTO submission (user_id, problem_code, submitted_at, verdict, language)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (current_user_id(), data.get("problem_code"), now, data.get("verdict"), data.get("language")),
    )
    return jsonify({"msg": "Submission saved"}), 201


@submissions.route("/sync", methods=["POST"])
@login_required
def sync_codeforces():
    """Import my submissions from Codeforces using my cf_handle."""
    user = query_one("SELECT cf_handle FROM app_user WHERE user_id = %s", (current_user_id(),))
    if not user["cf_handle"]:
        return jsonify({"error": "Add your Codeforces handle in Profile first"}), 400

    try:
        result = sync_user(current_user_id(), user["cf_handle"])
    except CodeforcesError as error:
        return jsonify({"error": str(error)}), 502
    return jsonify(result)
