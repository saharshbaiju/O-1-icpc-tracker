from functools import wraps

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from db import execute, query, query_one

auth = Blueprint("auth", __name__)

# Columns of app_user that are safe to send to the browser (never password_hash).
USER_COLUMNS = "u.user_id, u.name, u.email, u.cf_handle, u.cf_rating, u.cf_max_rating, u.univ_id, u.team_id"


def login_required(view):
    """Decorator: reject the request with 401 unless someone is signed in."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Please sign in"}), 401
        return view(*args, **kwargs)

    return wrapper


def current_user_id():
    return session["user_id"]


def current_team_id():
    row = query_one("SELECT team_id FROM app_user WHERE user_id = %s", (current_user_id(),))
    return row["team_id"] if row else None


def get_user(user_id):
    return query_one(
        f"""
        SELECT {USER_COLUMNS}, un.univ_name, t.team_name
        FROM app_user u
        JOIN university un ON un.univ_id = u.univ_id
        LEFT JOIN team t   ON t.team_id = u.team_id
        WHERE u.user_id = %s
        """,
        (user_id,),
    )


@auth.route("/universities", methods=["GET"])
def list_universities():
    return jsonify(query("SELECT univ_id, univ_name, city FROM university ORDER BY univ_name"))


@auth.route("/universities/search", methods=["GET"])
def search_universities():
    """Colleges whose name is close to what the user typed, best match first.

    similarity() / word_similarity() come from the pg_trgm extension and
    compare names by shared 3-letter chunks, so typos still match
    ("amritha" finds "Amrita Vishwa Vidyapeetham").
    """
    text = request.args.get("q", "").strip()
    if not text:
        return jsonify([])
    rows = query(
        """
        SELECT univ_id, univ_name, city,
               greatest(similarity(%(q)s, univ_name), word_similarity(%(q)s, univ_name)) AS score
        FROM university
        WHERE univ_name ILIKE '%%' || %(q)s || '%%'
           OR word_similarity(%(q)s, univ_name) > 0.3
        ORDER BY univ_name ILIKE %(q)s || '%%' DESC, score DESC
        LIMIT 6
        """,
        {"q": text},
    )
    return jsonify(rows)


@auth.route("/signup", methods=["POST"])
def signup():
    data = request.json
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    university = (data.get("university") or "").strip()
    city = (data.get("city") or "").strip()
    cf_handle = (data.get("cf_handle") or "").strip() or None

    if not name or "@" not in email or not university:
        return jsonify({"error": "Name, e-mail and university are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    # Use the university if it already exists, otherwise add it.
    univ = query_one("SELECT univ_id FROM university WHERE lower(univ_name) = lower(%s)", (university,))
    if univ is None:
        if not city:
            return jsonify({"error": "This is a new college: please enter its city"}), 400
        univ = execute(
            "INSERT INTO university (univ_name, city) VALUES (%s, %s) RETURNING univ_id",
            (university, city),
        )

    if query_one("SELECT 1 FROM app_user WHERE email = %s", (email,)):
        return jsonify({"error": "That e-mail is already registered"}), 409
    if cf_handle and query_one("SELECT 1 FROM app_user WHERE lower(cf_handle) = lower(%s)", (cf_handle,)):
        return jsonify({"error": "That Codeforces handle is linked to another account"}), 409

    user = execute(
        """
        INSERT INTO app_user (name, email, password_hash, cf_handle, univ_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING user_id
        """,
        (name, email, generate_password_hash(password), cf_handle, univ["univ_id"]),
    )
    session["user_id"] = user["user_id"]
    return jsonify(get_user(user["user_id"])), 201


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    row = query_one("SELECT user_id, password_hash FROM app_user WHERE email = %s", (email,))
    if row is None:
        return jsonify({"error": "No account with that e-mail"}), 401
    if not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Wrong password"}), 401

    session["user_id"] = row["user_id"]
    return jsonify(get_user(row["user_id"])), 200


@auth.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"msg": "Signed out"}), 200


@auth.route("/me", methods=["GET"])
@login_required
def me():
    user = get_user(current_user_id())
    if user is None:  # the account was deleted while signed in
        session.clear()
        return jsonify({"error": "Please sign in"}), 401
    return jsonify(user)


@auth.route("/me", methods=["PUT"])
@login_required
def update_me():
    data = request.json
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    cf_handle = (data.get("cf_handle") or "").strip() or None

    if not name or "@" not in email:
        return jsonify({"error": "Name and a valid e-mail are required"}), 400

    # UNIQUE(email) and UNIQUE(cf_handle) are checked by the database itself.
    execute(
        "UPDATE app_user SET name = %s, email = %s, cf_handle = %s, univ_id = %s WHERE user_id = %s",
        (name, email, cf_handle, data.get("univ_id"), current_user_id()),
    )
    return jsonify(get_user(current_user_id()))


@auth.route("/me/password", methods=["PUT"])
@login_required
def change_password():
    data = request.json
    row = query_one("SELECT password_hash FROM app_user WHERE user_id = %s", (current_user_id(),))

    if not check_password_hash(row["password_hash"], data.get("current") or ""):
        return jsonify({"error": "Current password is wrong"}), 400
    if len(data.get("new") or "") < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    execute(
        "UPDATE app_user SET password_hash = %s WHERE user_id = %s",
        (generate_password_hash(data["new"]), current_user_id()),
    )
    return jsonify({"msg": "Password changed"})
