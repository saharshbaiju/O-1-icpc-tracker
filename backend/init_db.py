"""Create the database and its tables.

    python init_db.py           create the database (if needed) and the tables,
                                or bring an older database up to date
    python init_db.py --reset   delete every table and start empty again
"""
import sys
from pathlib import Path

import psycopg2

from config import DB_CONFIG

SCHEMA_FILE = Path(__file__).parent.parent / "docs" / "lite" / "schema-lite.sql"

# Changes made to the schema after the first version. Each one is safe to
# run again, so an up-to-date database is left as it is.
UPGRADES = """
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS university_name_trgm ON university USING gin (univ_name gin_trgm_ops);
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS cf_rating INT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS cf_max_rating INT;
ALTER TABLE app_user ALTER COLUMN password_hash TYPE VARCHAR(255);
ALTER TABLE submission ALTER COLUMN language TYPE VARCHAR(50);
CREATE OR REPLACE VIEW v_problem_difficulty AS
SELECT problem_code, title, rating,
       CASE WHEN rating IS NULL THEN NULL
            WHEN rating < 1400 THEN 'Easy'
            WHEN rating < 2000 THEN 'Medium'
            ELSE 'Hard' END AS difficulty
FROM problem;
"""


def create_database():
    """Connect to the default 'postgres' database and create ours if it is missing."""
    admin = psycopg2.connect(**{**DB_CONFIG, "dbname": "postgres"})
    admin.autocommit = True
    with admin.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG["dbname"],))
        if cursor.fetchone() is None:
            cursor.execute(f'CREATE DATABASE "{DB_CONFIG["dbname"]}"')
            print(f"Created database {DB_CONFIG['dbname']}")
    admin.close()


def create_tables(reset):
    db = psycopg2.connect(**DB_CONFIG)
    db.autocommit = True  # the schema file has its own BEGIN / COMMIT
    with db.cursor() as cursor:
        if reset:
            cursor.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
            print("Deleted all tables")

        cursor.execute("SELECT to_regclass('app_user') IS NOT NULL")
        if cursor.fetchone()[0]:
            cursor.execute(UPGRADES)
            print("Tables already exist; brought them up to date. Use --reset to start again.")
        else:
            cursor.execute(SCHEMA_FILE.read_text())
            print(f"Created tables from {SCHEMA_FILE.name}")
    db.close()


if __name__ == "__main__":
    create_database()
    create_tables(reset="--reset" in sys.argv)
