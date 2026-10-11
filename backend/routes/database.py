from flask import Blueprint, jsonify
from psycopg2 import sql

from db import query, query_one
from routes.auth import login_required

database = Blueprint("database", __name__)

# Only these names can be read, so the URL can never pick an arbitrary table.
TABLES = [
    "university", "team", "app_user", "topic", "problem",
    "problem_topic", "submission", "sheet", "sheet_problem",
]
VIEWS = ["v_problem_difficulty", "v_leaderboard", "v_sheet_progress"]


@database.route("/database", methods=["GET"])
@login_required
def row_counts():
    counts = {}
    for name in TABLES:
        statement = sql.SQL("SELECT count(*) AS n FROM {}").format(sql.Identifier(name))
        counts[name] = query_one(statement)["n"]
    return jsonify(counts)


@database.route("/database/<name>", methods=["GET"])
@login_required
def rows(name):
    """The first 500 rows of one table or view, for the Database page."""
    if name not in TABLES + VIEWS:
        return jsonify({"error": "Unknown table"}), 404

    statement = sql.SQL("SELECT * FROM {} LIMIT 500").format(sql.Identifier(name))
    result = query(statement)
    if name == "app_user":
        for row in result:  # show only the start of each hash
            row["password_hash"] = row["password_hash"][:16] + "…"
    return jsonify(result)
