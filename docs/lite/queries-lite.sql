-- Q1 (JOIN): every accepted submission with the student's and the problem's details.
SELECT u.name, p.problem_code, p.title, s.submitted_at
FROM submission s
JOIN app_user u ON u.user_id = s.user_id
JOIN problem  p ON p.problem_code = s.problem_code
WHERE s.verdict = 'OK'
ORDER BY s.submitted_at;

-- Q2 (GROUP BY + HAVING): students who have solved at least 2 distinct problems.
SELECT u.name, count(DISTINCT s.problem_code) AS solved
FROM app_user u JOIN submission s ON s.user_id = u.user_id
WHERE s.verdict = 'OK'
GROUP BY u.name
HAVING count(DISTINCT s.problem_code) >= 2;

-- Q3 (NOT EXISTS subquery): problems on sheet 1 that user 3 (Rahul) has not solved yet.
SELECT sp.position, sp.problem_code
FROM sheet_problem sp
WHERE sp.sheet_id = 1
  AND NOT EXISTS (SELECT 1 FROM submission s
                  WHERE s.user_id = 3 AND s.problem_code = sp.problem_code
                    AND s.verdict = 'OK')
ORDER BY sp.position;

-- Q4 (M:N through a junction table): how many problems each topic has, and their average rating.
SELECT t.topic_name, count(*) AS problems, round(avg(p.rating)) AS avg_rating
FROM topic t
JOIN problem_topic pt ON pt.topic_id = t.topic_id
JOIN problem p        ON p.problem_code = pt.problem_code
GROUP BY t.topic_name
ORDER BY problems DESC, t.topic_name;

-- Q5 (VIEW): the leaderboard, ranked.
SELECT rank() OVER (ORDER BY solved DESC) AS rank, name, univ_name, solved
FROM v_leaderboard;

-- Q6 (LEFT JOIN): every team with its member count, including empty teams.
SELECT t.team_name, count(u.user_id) AS members
FROM team t
LEFT JOIN app_user u ON u.team_id = t.team_id
GROUP BY t.team_name
ORDER BY members DESC;
