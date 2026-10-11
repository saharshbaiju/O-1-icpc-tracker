from flask import Blueprint, jsonify, request

from routes.auth import login_required
from services.codeforces import CodeforcesError, all_tags, search_problems

codeforces = Blueprint("codeforces", __name__)


@codeforces.route("/codeforces/problems", methods=["GET"])
@login_required
def search():
    """Search all Codeforces problems: ?q=&tag=&min_rating=&max_rating="""
    try:
        results = search_problems(
            text=request.args.get("q", ""),
            tag=request.args.get("tag", ""),
            min_rating=request.args.get("min_rating", type=int),
            max_rating=request.args.get("max_rating", type=int),
        )
    except CodeforcesError as error:
        return jsonify({"error": str(error)}), 502
    return jsonify(results)


@codeforces.route("/codeforces/tags", methods=["GET"])
@login_required
def tags():
    try:
        return jsonify(all_tags())
    except CodeforcesError as error:
        return jsonify({"error": str(error)}), 502
