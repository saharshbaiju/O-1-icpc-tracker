-- O(1) Lite — ICPC practice tracker, relational schema (PostgreSQL).
-- 9 tables, every one in 3NF (and in fact BCNF). See DB-Design-Lite.pdf §3.4.
-- Derived values (difficulty, solved count, leaderboard, sheet progress) are
-- NOT stored; the views at the bottom compute them from the base tables.

BEGIN;

-- pg_trgm gives similarity() for "did you mean" college search on sign-up.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. University ------------------------------------------------------------
CREATE TABLE university (
  univ_id    SERIAL       PRIMARY KEY,
  univ_name  VARCHAR(120) NOT NULL UNIQUE,
  city       VARCHAR(60)  NOT NULL
);

-- Trigram index: makes "names similar to what the user typed" fast.
CREATE INDEX university_name_trgm ON university USING gin (univ_name gin_trgm_ops);

-- 2. Team ------------------------------------------------------------------
CREATE TABLE team (
  team_id    SERIAL      PRIMARY KEY,
  team_name  VARCHAR(60) NOT NULL UNIQUE
);

-- 3. User ------------------------------------------------------------------
CREATE TABLE app_user (
  user_id        SERIAL       PRIMARY KEY,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(254) NOT NULL UNIQUE,          -- alternate (candidate) key
  password_hash  VARCHAR(255) NOT NULL,                 -- werkzeug scrypt hash, never the password
  cf_handle      VARCHAR(40)  UNIQUE,                   -- Codeforces handle, optional
  cf_rating      INT,                                   -- current Codeforces rating, refreshed on sync
  cf_max_rating  INT,                                   -- best Codeforces rating
  univ_id        INT          NOT NULL REFERENCES university(univ_id),
  team_id        INT          REFERENCES team(team_id) ON DELETE SET NULL   -- NULL = no team
);

-- 4. Topic -----------------------------------------------------------------
CREATE TABLE topic (
  topic_id    SERIAL      PRIMARY KEY,
  topic_name  VARCHAR(40) NOT NULL UNIQUE
);

-- 5. Problem (problem_code is the Codeforces code, e.g. '1520C';
--    the URL is derived from it, so it is not stored)
CREATE TABLE problem (
  problem_code  VARCHAR(12)  PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  rating        INT          CHECK (rating BETWEEN 800 AND 3500)
);

-- 6. Problem ↔ Topic (M:N) -------------------------------------------------
CREATE TABLE problem_topic (
  problem_code  VARCHAR(12) REFERENCES problem(problem_code) ON DELETE CASCADE,
  topic_id      INT         REFERENCES topic(topic_id),
  PRIMARY KEY (problem_code, topic_id)
);

-- 7. Submission: one attempt by one user at one problem at one instant -----
CREATE TABLE submission (
  user_id       INT         REFERENCES app_user(user_id) ON DELETE CASCADE,
  problem_code  VARCHAR(12) REFERENCES problem(problem_code),
  submitted_at  TIMESTAMP   NOT NULL,
  verdict       VARCHAR(25) NOT NULL CHECK (verdict IN
                  ('OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR',
                   'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR')),
  language      VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, problem_code, submitted_at)
);

-- 8. Practice sheet: an ordered problem list for one team -----------------
CREATE TABLE sheet (
  sheet_id    SERIAL       PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  team_id     INT          NOT NULL REFERENCES team(team_id) ON DELETE CASCADE,
  deadline    DATE
);

-- 9. Sheet ↔ Problem (M:N) with an order -----------------------------------
CREATE TABLE sheet_problem (
  sheet_id      INT         REFERENCES sheet(sheet_id) ON DELETE CASCADE,
  problem_code  VARCHAR(12) REFERENCES problem(problem_code),
  position      SMALLINT    NOT NULL CHECK (position > 0),
  PRIMARY KEY (sheet_id, problem_code),
  UNIQUE (sheet_id, position)                           -- second candidate key
);

-- Trigger: ICPC teams have at most three members --------------------------
CREATE FUNCTION check_team_size() RETURNS trigger AS $$
BEGIN
  IF NEW.team_id IS NOT NULL AND
     (SELECT count(*) FROM app_user
       WHERE team_id = NEW.team_id AND user_id <> NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'team % already has 3 members', NEW.team_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER team_size_check
  BEFORE INSERT OR UPDATE OF team_id ON app_user
  FOR EACH ROW EXECUTE FUNCTION check_team_size();

-- ===================================================================== views
-- Difficulty band is a function of rating → derived, not stored.
CREATE VIEW v_problem_difficulty AS
SELECT problem_code, title, rating,
       CASE WHEN rating IS NULL THEN NULL          -- unrated (new) problem
            WHEN rating < 1400 THEN 'Easy'
            WHEN rating < 2000 THEN 'Medium'
            ELSE 'Hard' END AS difficulty
FROM problem;

-- Leaderboard: distinct problems solved per user.
CREATE VIEW v_leaderboard AS
SELECT u.user_id, u.name, un.univ_name,
       count(DISTINCT s.problem_code) AS solved
FROM app_user u
JOIN university un ON un.univ_id = u.univ_id
LEFT JOIN submission s ON s.user_id = u.user_id AND s.verdict = 'OK'
GROUP BY u.user_id, u.name, un.univ_name;

-- Sheet progress: for every member of the sheet's team, how many sheet problems are solved.
CREATE VIEW v_sheet_progress AS
SELECT sh.sheet_id, u.user_id, u.name,
       count(sp.problem_code) AS total,
       count(sp.problem_code) FILTER (WHERE EXISTS (
         SELECT 1 FROM submission s
         WHERE s.user_id = u.user_id AND s.problem_code = sp.problem_code
           AND s.verdict = 'OK')) AS solved
FROM sheet sh
JOIN app_user u       ON u.team_id = sh.team_id
JOIN sheet_problem sp ON sp.sheet_id = sh.sheet_id
GROUP BY sh.sheet_id, u.user_id, u.name;

COMMIT;
