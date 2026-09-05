-- O(1) ICPC preparation tracker — relational schema (PostgreSQL dialect).
-- Every relation below is in BCNF; see DB-Design.pdf §3.4 for the analysis.
-- Derived values (solve counts, streaks, sheet progress, leaderboard, contest
-- status, difficulty band) are NOT stored. They are computed by the views at
-- the end of this file so they can never drift from the base tables.

BEGIN;

-- ---------------------------------------------------------------- lookups
CREATE TABLE university (
  univ_id     SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  country     VARCHAR(60)  NOT NULL
);

CREATE TABLE topic (
  topic_id    SERIAL PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------- people
CREATE TABLE app_user (
  user_id        SERIAL PRIMARY KEY,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(254) NOT NULL UNIQUE,
  password_hash  CHAR(60)     NOT NULL,
  role           VARCHAR(10)  NOT NULL CHECK (role IN ('student', 'mentor')),
  year_of_study  SMALLINT     CHECK (year_of_study BETWEEN 1 AND 5),
  univ_id        INT          NOT NULL REFERENCES university(univ_id),
  joined_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  bio            VARCHAR(280),
  avatar_url     VARCHAR(500)
);

-- Weak entity: identified by (owner, platform). A handle is unique per platform.
CREATE TABLE judge_account (
  user_id      INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  platform     VARCHAR(20)  NOT NULL CHECK (platform IN ('codeforces', 'atcoder')),
  handle       VARCHAR(40)  NOT NULL,
  rating       INT,
  verified_at  TIMESTAMPTZ,
  PRIMARY KEY (user_id, platform),
  UNIQUE (platform, handle)
);

-- ---------------------------------------------------------------- problems
CREATE TABLE problem (
  problem_id     SERIAL PRIMARY KEY,
  platform       VARCHAR(20)  NOT NULL CHECK (platform IN ('codeforces', 'atcoder', 'manual')),
  external_code  VARCHAR(40)  NOT NULL,          -- e.g. '1234C'; for manual problems a slug
  title          VARCHAR(200) NOT NULL,
  rating         INT          CHECK (rating BETWEEN 800 AND 3500),
  url            VARCHAR(500) NOT NULL,
  has_editorial  BOOLEAN      NOT NULL DEFAULT FALSE,
  UNIQUE (platform, external_code)
);

CREATE TABLE problem_topic (
  problem_id  INT NOT NULL REFERENCES problem(problem_id) ON DELETE CASCADE,
  topic_id    INT NOT NULL REFERENCES topic(topic_id),
  PRIMARY KEY (problem_id, topic_id)
);

-- ---------------------------------------------------------------- contests
CREATE TABLE contest (
  contest_id    SERIAL PRIMARY KEY,
  platform      VARCHAR(20)  NOT NULL CHECK (platform IN ('codeforces', 'atcoder')),
  external_id   VARCHAR(20)  NOT NULL,
  name          VARCHAR(200) NOT NULL,
  kind          VARCHAR(10)  NOT NULL CHECK (kind IN ('rated', 'gym', 'practice')),
  starts_at     TIMESTAMPTZ  NOT NULL,
  duration_min  INT          NOT NULL CHECK (duration_min > 0),
  UNIQUE (platform, external_id)
);

CREATE TABLE contest_problem (
  contest_id  INT     NOT NULL REFERENCES contest(contest_id) ON DELETE CASCADE,
  problem_id  INT     NOT NULL REFERENCES problem(problem_id),
  label       CHAR(2) NOT NULL,                  -- 'A', 'B', ... 'A1'
  PRIMARY KEY (contest_id, problem_id),
  UNIQUE (contest_id, label)
);

-- One row per judge submission, pulled by the sync job.
CREATE TABLE submission (
  submission_id           BIGSERIAL PRIMARY KEY,
  user_id                 INT          NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  problem_id              INT          NOT NULL REFERENCES problem(problem_id),
  contest_id              INT          REFERENCES contest(contest_id),   -- NULL for practice
  verdict                 VARCHAR(20)  NOT NULL,   -- 'OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', ...
  language                VARCHAR(40)  NOT NULL,
  submitted_at            TIMESTAMPTZ  NOT NULL,
  platform                VARCHAR(20)  NOT NULL,
  external_submission_id  BIGINT       NOT NULL,
  UNIQUE (platform, external_submission_id)
);
CREATE INDEX submission_user_time ON submission (user_id, submitted_at DESC);
CREATE INDEX submission_problem   ON submission (problem_id);

-- Rated participation; rating history is derived from this table.
CREATE TABLE participation (
  user_id     INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  contest_id  INT NOT NULL REFERENCES contest(contest_id),
  old_rating  INT NOT NULL,
  new_rating  INT NOT NULL,
  rank        INT NOT NULL CHECK (rank > 0),
  PRIMARY KEY (user_id, contest_id)
);

-- ---------------------------------------------------------------- sheets
CREATE TABLE sheet (
  sheet_id            SERIAL PRIMARY KEY,
  title               VARCHAR(120) NOT NULL,
  description         VARCHAR(500),
  author_id           INT          NOT NULL REFERENCES app_user(user_id),
  level               VARCHAR(6)   NOT NULL CHECK (level IN ('Easy', 'Medium', 'Hard')),
  deadline            DATE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  archive_contest_id  INT          REFERENCES contest(contest_id)   -- set for past-ICPC sheets
);

CREATE TABLE sheet_problem (
  sheet_id    INT      NOT NULL REFERENCES sheet(sheet_id) ON DELETE CASCADE,
  problem_id  INT      NOT NULL REFERENCES problem(problem_id),
  position    SMALLINT NOT NULL CHECK (position > 0),
  PRIMARY KEY (sheet_id, problem_id),
  UNIQUE (sheet_id, position)
);

CREATE TABLE sheet_assignment (
  sheet_id     INT         NOT NULL REFERENCES sheet(sheet_id) ON DELETE CASCADE,
  user_id      INT         NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sheet_id, user_id)
);

-- Manual tick-off for problems the sync cannot see (non-judge links).
-- Judge-hosted problems are marked complete by the v_sheet_progress view instead.
CREATE TABLE sheet_completion (
  sheet_id      INT         NOT NULL,
  user_id       INT         NOT NULL,
  problem_id    INT         NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sheet_id, user_id, problem_id),
  FOREIGN KEY (sheet_id, problem_id) REFERENCES sheet_problem(sheet_id, problem_id) ON DELETE CASCADE,
  FOREIGN KEY (sheet_id, user_id)    REFERENCES sheet_assignment(sheet_id, user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------- teams
CREATE TABLE team (
  team_id      SERIAL PRIMARY KEY,
  name         VARCHAR(80)  NOT NULL,
  univ_id      INT          NOT NULL REFERENCES university(univ_id),
  coach_id     INT          NOT NULL REFERENCES app_user(user_id),
  invite_code  CHAR(10)     NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (univ_id, name)
);

-- A user belongs to at most one team, hence user_id is the key.
CREATE TABLE team_member (
  user_id      INT         PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
  team_id      INT         NOT NULL REFERENCES team(team_id) ON DELETE CASCADE,
  member_role  VARCHAR(40) NOT NULL,        -- 'Captain', 'DP & Math', ...
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ICPC rule: at most three members per team.
CREATE OR REPLACE FUNCTION enforce_team_size() RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM team_member WHERE team_id = NEW.team_id) >= 3 THEN
    RAISE EXCEPTION 'team % already has three members', NEW.team_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER team_size_check
  BEFORE INSERT ON team_member
  FOR EACH ROW EXECUTE FUNCTION enforce_team_size();

-- ---------------------------------------------------------------- resources
CREATE TABLE resource (
  resource_id   SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  type          VARCHAR(10)  NOT NULL CHECK (type IN ('Article', 'Video', 'Notes', 'Roadmap', 'Tutorial', 'Book')),
  url           VARCHAR(500) NOT NULL UNIQUE,
  topic_id      INT          NOT NULL REFERENCES topic(topic_id),
  level         VARCHAR(6)   NOT NULL CHECK (level IN ('Easy', 'Medium', 'Hard')),
  duration_min  INT          CHECK (duration_min > 0),
  added_by      INT          NOT NULL REFERENCES app_user(user_id)
);

CREATE TABLE bookmark (
  user_id        INT         NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  resource_id    INT         NOT NULL REFERENCES resource(resource_id) ON DELETE CASCADE,
  bookmarked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, resource_id)
);

-- ---------------------------------------------------------------- calendar
-- Contest and sheet-deadline entries are derived; only these kinds are stored.
CREATE TABLE calendar_event (
  event_id      SERIAL PRIMARY KEY,
  title         VARCHAR(120) NOT NULL,
  kind          VARCHAR(12)  NOT NULL CHECK (kind IN ('practice', 'session', 'announcement')),
  starts_at     TIMESTAMPTZ  NOT NULL,
  duration_min  INT          NOT NULL CHECK (duration_min > 0),
  team_id       INT          REFERENCES team(team_id) ON DELETE CASCADE,   -- NULL = personal
  created_by    INT          NOT NULL REFERENCES app_user(user_id)
);

CREATE TABLE reminder (
  user_id         INT      NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  event_id        INT      NOT NULL REFERENCES calendar_event(event_id) ON DELETE CASCADE,
  minutes_before  SMALLINT NOT NULL CHECK (minutes_before > 0),
  PRIMARY KEY (user_id, event_id)
);

-- ================================================================ derived data
-- Problem status per user: solved / attempted / todo.
CREATE VIEW v_problem_status AS
SELECT u.user_id, p.problem_id,
       CASE WHEN bool_or(s.verdict = 'OK') THEN 'solved'
            WHEN count(s.submission_id) > 0 THEN 'attempted'
            ELSE 'todo' END AS status
FROM app_user u CROSS JOIN problem p
LEFT JOIN submission s ON s.user_id = u.user_id AND s.problem_id = p.problem_id
GROUP BY u.user_id, p.problem_id;

-- Difficulty band is a function of rating, so it is derived rather than stored.
CREATE VIEW v_problem_difficulty AS
SELECT problem_id,
       CASE WHEN rating < 1400 THEN 'Easy'
            WHEN rating < 2000 THEN 'Medium'
            ELSE 'Hard' END AS difficulty
FROM problem;

-- Per-student sheet progress: synced solves OR manual ticks.
CREATE VIEW v_sheet_progress AS
SELECT sa.sheet_id, sa.user_id,
       count(sp.problem_id)                                        AS total,
       count(sp.problem_id) FILTER (WHERE ps.status = 'solved'
                                       OR sc.problem_id IS NOT NULL) AS completed
FROM sheet_assignment sa
JOIN sheet_problem sp       ON sp.sheet_id = sa.sheet_id
LEFT JOIN v_problem_status ps ON ps.user_id = sa.user_id AND ps.problem_id = sp.problem_id
LEFT JOIN sheet_completion sc ON sc.sheet_id = sa.sheet_id AND sc.user_id = sa.user_id
                             AND sc.problem_id = sp.problem_id
GROUP BY sa.sheet_id, sa.user_id;

-- Upsolve queue: contest problems the user entered but never solved.
CREATE VIEW v_upsolve_queue AS
SELECT pa.user_id, cp.contest_id, cp.problem_id, cp.label
FROM participation pa
JOIN contest_problem cp ON cp.contest_id = pa.contest_id
LEFT JOIN submission s  ON s.user_id = pa.user_id AND s.problem_id = cp.problem_id AND s.verdict = 'OK'
WHERE s.submission_id IS NULL;

-- Contest status is a function of the clock.
CREATE VIEW v_contest_status AS
SELECT contest_id,
       CASE WHEN now() < starts_at THEN 'upcoming'
            WHEN now() < starts_at + duration_min * INTERVAL '1 minute' THEN 'live'
            ELSE 'ended' END AS status
FROM contest;

COMMIT;
