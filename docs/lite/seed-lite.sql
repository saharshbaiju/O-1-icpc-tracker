-- Sample data for O(1) Lite — small enough to read on one slide.
BEGIN;
INSERT INTO university (univ_name, city) VALUES
  ('Amrita Vishwa Vidyapeetham', 'Amritapuri'),
  ('NIT Calicut', 'Kozhikode');

INSERT INTO team (team_name) VALUES ('Segfault Survivors'), ('Off By One'), ('Null Pointers');

INSERT INTO app_user (name, email, password_hash, cf_handle, univ_id, team_id) VALUES
  ('Saharsh Baiju', 'saharsh@am.edu',     '$2b$10$hash', 'saharsh', 1, 1),
  ('Anu Thomas',    'anu@am.edu',         '$2b$10$hash', 'anu_t',   1, 1),
  ('Rahul Menon',   'rahul@am.edu',       '$2b$10$hash', 'rahulm',  1, 1),
  ('Fathima K',     'fathima@nitc.ac.in', '$2b$10$hash', 'fathk',   2, 2);

INSERT INTO topic (topic_name) VALUES ('Greedy'), ('DP'), ('Graphs'), ('Math'), ('Binary Search');

INSERT INTO problem VALUES
  ('1520C', 'Not Adjacent Matrix', 1000),
  ('1547G', 'How Many Paths?',     2100),
  ('455A',  'Boredom',             1500),
  ('1201C', 'Maximum Median',      1400);

INSERT INTO problem_topic VALUES
  ('1520C', 4), ('1547G', 2), ('1547G', 3), ('455A', 2), ('1201C', 1), ('1201C', 5);

INSERT INTO submission VALUES
  (1, '1520C', '2026-09-01 10:00', 'WRONG_ANSWER', 'C++17'),
  (1, '1520C', '2026-09-01 10:12', 'OK',           'C++17'),
  (1, '455A',  '2026-09-02 18:30', 'OK',           'C++17'),
  (2, '455A',  '2026-09-02 19:05', 'OK',           'Python 3'),
  (2, '1547G', '2026-09-03 21:40', 'TIME_LIMIT_EXCEEDED', 'Python 3'),
  (3, '1201C', '2026-09-04 09:15', 'OK',           'Java 21'),
  (4, '1520C', '2026-09-04 11:00', 'OK',           'C++17');

INSERT INTO sheet (title, team_id, deadline) VALUES ('DP Warm-up', 1, '2026-10-15');
INSERT INTO sheet_problem VALUES (1, '455A', 1), (1, '1547G', 2), (1, '1520C', 3);
COMMIT;
