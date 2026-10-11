from datetime import date, datetime

import psycopg2
from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider

from config import SECRET_KEY
from db import close_db, get_db
from routes.auth import auth
from routes.codeforces import codeforces
from routes.dashboard import dashboard
from routes.database import database
from routes.leaderboard import leaderboard
from routes.problems import problems
from routes.sheets import sheets
from routes.submissions import submissions
from routes.teams import teams


class JSONProvider(DefaultJSONProvider):
    """Send dates as ISO strings ("2026-10-05T13:00:00Z") so the browser can parse them."""

    @staticmethod
    def default(value):
        if isinstance(value, datetime):
            return value.isoformat() + ("Z" if value.tzinfo is None else "")
        if isinstance(value, date):
            return value.isoformat()
        return DefaultJSONProvider.default(value)


app = Flask(__name__)
app.secret_key = SECRET_KEY
# Browsers share cookies across every port on localhost, so a generic name like
# "session" would clash with other Flask apps you run locally.
app.config["SESSION_COOKIE_NAME"] = "o1_session"
app.json = JSONProvider(app)
app.teardown_appcontext(close_db)

for blueprint in (auth, codeforces, dashboard, database, leaderboard, problems, sheets, submissions, teams):
    app.register_blueprint(blueprint, url_prefix="/api")


@app.errorhandler(psycopg2.Error)
def database_error(error):
    """Turn a PostgreSQL error (unique key, check, foreign key, trigger) into a JSON message."""
    get_db().rollback()
    message = error.diag.message_primary or str(error)
    status = 409 if isinstance(error, psycopg2.IntegrityError) else 400
    return jsonify({"error": message}), status


if __name__ == "__main__":
    app.run(port=5000, debug=True)
