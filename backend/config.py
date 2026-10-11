import os

# Database connection. Change these to match your PostgreSQL setup,
# or set the environment variables instead of editing the file.
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "5432")),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "postgres"),
    "dbname": os.environ.get("DB_NAME", "o1"),
}

# Signs the login cookie. Use a long random string in production.
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
