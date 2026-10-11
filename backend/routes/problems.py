import re

from flask import Blueprint, jsonify, request

from db import execute, query, query_one
from routes.auth import current_user_id, login_required

problems = Blueprint("problems", __name__)

# A Codeforces problem code: contest number + index, e.g. 1520C or 1234B1.
PROBLEM_CODE = re.compile(r"^\d+[A-Z]\d?$")


def save_problem(problem_code, title, rating, topic_names):
    """Insert a problem and its topics. Does nothing if the problem already exists.

    Returns True if a new row was added to `problem`.
    """
    added = execute(
        """
        INSERT INTO problem (problem_code, title, rating)
        VALUES (%s, %s, %s)
        ON CONFLICT (problem_code) DO NOTHING
        RETURNING problem_code
        """,
        (problem_code, title, rating),
    )
    if added is None:
        return False

    for name in topic_names:
        # "DO UPDATE" (a no-op) instead of "DO NOTHING" so RETURNING also
        # gives back the id of a topic that already exists.
        topic = execute(
            """
            INSERT INTO topic (topic_name) VALUES (%s)
            ON CONFLICT (topic_name) DO UPDATE SET topic_name = EXCLUDED.topic_name
            RETURNING topic_id
            """,
            (name,),
        )
        execute(
            "INSERT INTO problem_topic (problem_code, topic_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (problem_code, topic["topic_id"]),
        )
    return True


@problems.route("/problems", methods=["GET"])
@login_required
def list_problems():
    """Every problem with its topics, difficulty (from the view) and my status."""
    rows = query(
        """
        SELECT p.problem_code, p.title, p.rating, d.difficulty,
               COALESCE(array_agg(DISTINCT t.topic_name)
                        FILTER (WHERE t.topic_name IS NOT NULL), '{}') AS topics,
               CASE WHEN bool_or(s.verdict = 'OK') THEN 'solved'
                    WHEN count(s.verdict) > 0     THEN 'attempted'
                    ELSE 'todo' END                AS status
        FROM problem p
        JOIN v_problem_difficulty d ON d.problem_code = p.problem_code
        LEFT JOIN problem_topic pt  ON pt.problem_code = p.problem_code
        LEFT JOIN topic t           ON t.topic_id = pt.topic_id
        LEFT JOIN submission s      ON s.problem_code = p.problem_code AND s.user_id = %s
        GROUP BY p.problem_code, p.title, p.rating, d.difficulty
        ORDER BY p.rating NULLS LAST, p.problem_code
        """,
        (current_user_id(),),
    )
    return jsonify(rows)


@problems.route("/topics", methods=["GET"])
@login_required
def list_topics():
    return jsonify(query("SELECT topic_id, topic_name FROM topic ORDER BY topic_name"))


@problems.route("/problems", methods=["POST"])
@login_required
def add_problem():
    data = request.json
    problem_code = (data.get("problem_code") or "").strip().upper()
    title = (data.get("title") or "").strip()
    rating = data.get("rating") or None
    topics = [t.strip() for t in data.get("topics", []) if t.strip()]

    if not PROBLEM_CODE.match(problem_code):
        return jsonify({"error": "Problem code must look like 1520C"}), 400
    if not title:
        return jsonify({"error": "Title is required"}), 400
    if query_one("SELECT 1 FROM problem WHERE problem_code = %s", (problem_code,)):
        return jsonify({"error": f"Problem {problem_code} already exists"}), 409

    # The CHECK (rating BETWEEN 800 AND 3500) constraint validates the rating.
    save_problem(problem_code, title, rating, topics)
    return jsonify({"msg": "Problem added"}), 201
