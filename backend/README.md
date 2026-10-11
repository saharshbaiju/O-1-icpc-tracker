# O(1) backend (Flask + PostgreSQL)

A small Flask API over the nine tables in `docs/lite/schema-lite.sql`.
Every route is plain SQL, so each screen in the app can be traced to a query.

```
backend/
├── app.py              creates the Flask app, registers the routes, turns DB errors into JSON
├── config.py           database connection settings
├── db.py               get_db(), query(), query_one(), execute()
├── init_db.py          creates the database and the tables
├── requirements.txt
├── routes/
│   ├── auth.py         signup, login, profile, college search  /api/signup, /api/me, /api/universities/search …
│   ├── codeforces.py   search every Codeforces problem         /api/codeforces/problems, /api/codeforces/tags
│   ├── dashboard.py    numbers for the dashboard               /api/dashboard
│   ├── problems.py     problem list, add a problem             /api/problems, /api/topics
│   ├── submissions.py  submission list, log one, Codeforces    /api/submissions, /api/sync
│   ├── sheets.py       team practice sheets                    /api/sheets
│   ├── teams.py        teams, team analytics, sync whole team  /api/teams, /api/teams/mine/analytics …
│   ├── leaderboard.py  ranking from the v_leaderboard view     /api/leaderboard
│   └── database.py     raw rows for the Database page          /api/database
└── services/
    └── codeforces.py   Codeforces API: submissions, ratings, problem search
```

## Setup

1. **PostgreSQL** must be running. Put your user and password in `config.py`
   (or set `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`).

2. **Install and create the tables**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate          # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python init_db.py                 # creates database "o1" and the 9 tables
   ```

   `python init_db.py --reset` deletes everything and starts empty again.
   Run `python init_db.py` again after pulling changes: it adds any new
   columns or indexes to an existing database without losing data.

3. **Run**

   ```bash
   python app.py                     # API on http://127.0.0.1:5000
   ```

   In another terminal, from the project root: `npm run dev`. Vite forwards
   every `/api/...` request to Flask, so open the app at http://localhost:5173.
   (Backend on another port? `API_URL=http://127.0.0.1:5001 npm run dev`.)

## How it works

- **One transaction per request.** `db.close_db()` commits when the request
  succeeds and rolls back when it fails, so "create a team and join it" is
  all-or-nothing.
- **The database enforces the rules.** Unique e-mail, the rating CHECK, foreign
  keys and the three-member trigger all live in the schema. When one fires,
  `app.py` returns PostgreSQL's message as `{"error": "..."}`.
- **Derived values come from views.** Difficulty, the leaderboard and sheet
  progress are read from `v_problem_difficulty`, `v_leaderboard` and
  `v_sheet_progress`; nothing computed is stored.
- **Passwords** are hashed with werkzeug (`generate_password_hash`), and the
  signed-in user is kept in Flask's signed session cookie.
- **Codeforces can't be embedded** in another site (it sends
  `X-Frame-Options: SAMEORIGIN`), so "open beside" puts it in a window next to the app.
- **Problem search** downloads the full Codeforces problemset once and keeps it
  in memory for 6 hours. Adding one to a sheet copies it into `problem` first,
  because `sheet_problem` has a foreign key to it.
- **Codeforces sync** (`POST /api/sync`) calls `user.status` for the user's
  handle, adds any new problems with their tags as topics, and inserts the
  submissions. `ON CONFLICT DO NOTHING` makes it safe to run again.

The database starts empty: sign up, set your Codeforces handle in Profile,
and press **Sync from Codeforces** to fill it with your real submissions.
