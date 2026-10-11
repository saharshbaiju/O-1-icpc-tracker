from flask import Blueprint, jsonify, request

from db import query
from routes.auth import login_required

leaderboard = Blueprint("leaderboard", __name__)


@leaderboard.route("/leaderboard", methods=["GET"])
@login_required
def ranking():
    """v_leaderboard ranked with a window function. Optional ?univ_id= filter."""
    univ_id = request.args.get("univ_id") or None
    rows = query(
        """
        SELECT rank() OVER (ORDER BY lb.solved DESC) AS rank,
               lb.user_id, lb.name, lb.univ_name, t.team_name, lb.solved
        FROM v_leaderboard lb
        JOIN app_user u   ON u.user_id = lb.user_id
        LEFT JOIN team t  ON t.team_id = u.team_id
        WHERE %(univ_id)s::int IS NULL OR u.univ_id = %(univ_id)s::int
        ORDER BY rank, lb.name
        """,
        {"univ_id": univ_id},
    )
    return jsonify(rows)
