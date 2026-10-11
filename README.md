<div align="center">

# O(1)

**An ICPC practice tracker for college teams.**

Import your Codeforces history, practise shared problem sheets with your team,
and compare each other side by side.

<sub>PostgreSQL · Flask · React 19 · TypeScript · Vite · Tailwind CSS</sub>

<sub>23CSE202 Database Management Systems project · Amrita School of Computing, Amritapuri</sub>

</div>

---

## What it is

ICPC teams usually track who solved what in a shared spreadsheet. The spreadsheet
repeats the same student and problem details on every row, so it is slow to update
and easy to get wrong. O(1) replaces it with a normalised PostgreSQL database and a
web app on top of it.

- **Sync from Codeforces:** one click imports all your submissions, problems and topics.
  Syncing again only adds what is new.
- **Teams:** up to three students per team (the database enforces this with a trigger).
- **Team sheets:** search any Codeforces problem and build a practice list the whole
  team sees. Ticks show who has solved each problem.
- **Team analytics:** rating, problems solved, solved this month, active days,
  streaks, acceptance, hardest problem and topic coverage for every member, side by side.
- **Leaderboard:** every student ranked by problems solved, filterable by college.
- **College "did you mean":** sign-up suggests a college that is already in the
  database, even with typos.
- **Database page:** shows every table and view live, with keys and DDL (useful for the viva).

Every number on screen comes from a SQL query over stored data, and each page has an
**SQL** button that shows the query behind it.

## Team

| Roll No | Name |
| --- | --- |
| AM.SC.U4CSE25245 | Saharsh Baiju |
| AM.SC.U4CSE25244 | Rishik Raj P |
| AM.SC.U4CSE25212 | Dev Narayan U |
| AM.SC.U4CSE25227 | Kashyap S |

## Quick start

You need PostgreSQL (14 or newer), Python 3.10+ and Node.js 20+.

```bash
# 1. Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py                 # creates database "o1" and the 9 tables
python app.py                     # API on http://127.0.0.1:5000

# 2. Frontend (new terminal, project root)
npm install
npm run dev                       # open http://localhost:5173
```

The database user and password are in `backend/config.py`, or you can set them with
`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` and `DB_NAME`. Vite forwards every
`/api/...` request to Flask.

The database starts empty. Sign up, add your Codeforces handle, and press
**Sync from Codeforces**.

| Command | What it does |
| --- | --- |
| `python init_db.py` | Create the tables, or update an older database without losing data |
| `python init_db.py --reset` | Delete everything and start empty |
| `npm run build` | Type-check and build the frontend to `dist/` |
| `npm run lint` | Run [oxlint](https://oxc.rs) |

## The database

Nine tables, all in BCNF:

```
university    (univ_id PK, univ_name UNIQUE, city)
team          (team_id PK, team_name UNIQUE)
app_user      (user_id PK, name, email UNIQUE, password_hash, cf_handle UNIQUE,
               cf_rating, cf_max_rating, univ_id FK, team_id FK NULL)
topic         (topic_id PK, topic_name UNIQUE)
problem       (problem_code PK, title, rating CHECK 800-3500)
problem_topic (problem_code FK, topic_id FK)                      PK = both
submission    (user_id FK, problem_code FK, submitted_at, verdict, language)
                                                                  PK = first three
sheet         (sheet_id PK, title, team_id FK, deadline)
sheet_problem (sheet_id FK, problem_code FK, position)
                     PK = (sheet_id, problem_code), UNIQUE (sheet_id, position)
```

- **Constraints:** primary and foreign keys, UNIQUE, CHECK and NOT NULL. Deleting a user
  or sheet also deletes their rows (CASCADE); deleting a team keeps its members (SET NULL).
- **Trigger:** `team_size_check` stops a fourth member from joining a team.
- **Views:** `v_problem_difficulty`, `v_leaderboard` and `v_sheet_progress` calculate
  values that are never stored, so they are always correct.
- **Index:** a GIN trigram index (`pg_trgm`) for the fuzzy college search.
- **Transactions:** each API request is one transaction. It is committed if the request
  works and rolled back if anything fails.
- **Queries:** joins, GROUP BY / HAVING, NOT EXISTS, CTEs, window functions,
  `INSERT ... ON CONFLICT` and INTERSECT.

The full design (FDs, closure, minimal cover, 1NF to BCNF, lossless join and
dependency preservation) is in `docs/lite/DB-Design-Lite.pdf`.

## Documents

| File | What it is |
| --- | --- |
| `docs/report/O1-Project-Report.pdf` | Project report (also `.docx`) |
| `docs/report/O1-SQL-Queries.pdf` | Every SQL query in the project, with output |
| `docs/lite/DB-Design-Lite.pdf` | Database design and normalisation |
| `docs/lite/Explanation-Guide.pdf` | Simple explanation of the design, with viva questions |
| `docs/lite/schema-lite.sql` | The schema (tables, trigger, views, index) |
| `docs/DB-Design.pdf` | The earlier 20-table design, kept for reference |

## Project structure

```
backend/                Flask API, plain SQL (see backend/README.md)
├── app.py              app setup, routes, database errors as JSON
├── db.py               connection, one transaction per request
├── init_db.py          create / update / reset the database
├── routes/             one file per feature (auth, problems, sheets, teams, ...)
└── services/           Codeforces API calls and sync

src/                    React frontend
├── pages/              Dashboard, Leaderboard, Problems, Submissions, Sheets,
│                       Team, Profile, Database, Landing, Login, Signup
├── components/         shared pieces (team analytics, college input, sync button, ui/)
└── lib/                API client, auth, formatting helpers

docs/                   design documents, report and SQL reference
archive/removed-ui/     pages removed from the earlier version
```

## Notes

- Codeforces cannot be shown inside another website (it blocks framing), so problems
  open in a new tab or a window beside the app.
- The Codeforces API is called only when syncing, with a 2 second gap between calls.
  The full problem list is cached for 6 hours for the sheet search.
- Passwords are stored as scrypt hashes, and all SQL values are passed as parameters,
  so SQL injection is not possible.
