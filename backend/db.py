import psycopg2
from psycopg2.extras import RealDictCursor
from flask import g

from config import DB_CONFIG


def get_db():
    """One database connection per request, opened the first time it is needed."""
    if "db" not in g:
        g.db = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    return g.db


def close_db(error=None):
    """Runs after every request: save the request's work, or undo it if something failed.

    Because every request is one transaction, a route that runs several
    statements (e.g. create a team and then join it) either fully happens
    or does not happen at all.
    """
    db = g.pop("db", None)
    if db is None:
        return
    if error is None:
        db.commit()
    else:
        db.rollback()
    db.close()


def query(sql, params=()):
    """Run a SELECT and return every row as a dict."""
    with get_db().cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchall()


def query_one(sql, params=()):
    """Run a SELECT and return the first row, or None."""
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql, params=()):
    """Run an INSERT / UPDATE / DELETE. Returns the RETURNING row, if any."""
    with get_db().cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchone() if cursor.description else None
