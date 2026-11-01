USE lms_final_database;

INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'admin', 'System administrator'),
(2, 'instructor', 'Creates and manages courses and learning content'),
(3, 'student', 'Learns through courses, lessons, quizzes, and assignments')
ON DUPLICATE KEY UPDATE description = VALUES(description);


INSERT INTO users
(user_id, role_id, first_name, last_name, email, password_hash, status)
VALUES
(1, 1, 'Ada', 'Admin', 'ada.admin@example.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(2, 2, 'Ian', 'Instructor', 'ian.instructor@example.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(3, 3, 'Mia', 'Santos', 'mia.santos@example.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(4, 3, 'Noah', 'Garcia', 'noah.garcia@example.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active');


INSERT INTO courses
(course_id, course_code, course_name, description, instructor_id, status)
VALUES
(1, 'DBMS101', 'Database Management Systems',
 'Introduction to relational databases, SQL, normalization, and database design.',
 2, 'published'),
(2, 'SIA201', 'System Integration and Architecture',
 'Foundations of system architecture, integration patterns, APIs, and application structure.',
 2, 'published'),
(3, 'CAP300', 'Capstone Project',
 'Applied software development project integrating database and system architecture concepts.',
 2, 'draft');


INSERT INTO modules
(module_id, course_id, title, description, module_order, passing_score, status)
VALUES
(1, 1, 'Database Fundamentals',
 'Core concepts of databases, DBMS components, and relational data.',
 1, 75.00, 'published'),
(2, 1, 'SQL and Queries',
 'SQL statements, filtering, joins, grouping, and aggregate functions. Requires Module 1 at 75%.',
 2, 75.00, 'published'),
(3, 2, 'System Architecture',
 'System components, layers, architecture patterns, and integration concepts.',
 1, 75.00, 'published'),
(4, 2, 'API and System Integration',
 'REST APIs, integration techniques, and communication between systems. Requires Module 3 at 75%.',
 2, 75.00, 'published');


INSERT INTO lessons
(lesson_id, module_id, title, content, lesson_order, estimated_minutes, status)
VALUES
(1, 1, 'Introduction to Databases',
 'A database stores organized data that can be accessed and managed efficiently.',
 1, 30, 'published'),
(2, 2, 'SQL Joins',
 'Use INNER JOIN, LEFT JOIN, and other joins to combine related records.',
 1, 45, 'published'),
(3, 3, 'Architecture Fundamentals',
 'Explore layers, components, responsibilities, and system boundaries.',
 1, 40, 'published'),
(4, 4, 'REST API Fundamentals',
 'Learn resources, HTTP methods, status codes, and JSON responses.',
 1, 45, 'published');


INSERT INTO enrollments
(enrollment_id, student_id, course_id, enrolled_at, status, completion_date, final_score)
VALUES
(1, 3, 1, '2026-09-01 08:00:00', 'active', NULL, NULL),
(2, 3, 2, '2026-09-01 08:05:00', 'active', NULL, NULL),
(3, 4, 1, '2026-09-01 08:10:00', 'active', NULL, NULL),
(4, 4, 2, '2026-09-01 08:15:00', 'active', NULL, NULL);


INSERT INTO quizzes
(quiz_id, module_id, title, description, passing_score, time_limit_minutes, attempt_limit, status)
VALUES
(1, 1, 'Database Fundamentals Quiz',
 'Check understanding of database fundamentals. Score 75% to unlock Module 2. You have 3 attempts.',
 75.00, 30, 3, 'published'),
(2, 3, 'System Architecture Quiz',
 'Assess understanding of architecture fundamentals. You have 2 attempts.',
 75.00, 30, 2, 'published'),
(3, 4, 'API Integration Quiz',
 'Assess understanding of REST APIs and integration. You have 3 attempts.',
 75.00, 30, 3, 'published');


INSERT INTO questions
(question_id, quiz_id, question_text, question_type, points, question_order, options, correct_answer)
VALUES
(1, 1, 'What is the primary purpose of a database?', 'multiple_choice', 37.00, 1,
 '["Store and manage data","Create images","Edit videos","Design logos"]',
 'Store and manage data'),
(2, 1, 'What does DBMS stand for?', 'multiple_choice', 37.00, 2,
 '["Database Management System","Data Backup Management Service","Digital Business Management System","Database Monitoring Service"]',
 'Database Management System'),
(3, 1, 'A relational database organizes data into tables.', 'true_false', 25.00, 3,
 NULL, 'True'),
(4, 1, 'Which key uniquely identifies a record in a table?', 'multiple_choice', 1.00, 4,
 '["Primary key","Foreign key","Duplicate key","Search key"]',
 'Primary key'),
(5, 2, 'What is a major goal of system architecture?', 'multiple_choice', 60.00, 1,
 '["Define system structure and responsibilities","Only design colors","Only write documentation","Only create passwords"]',
 'Define system structure and responsibilities'),
(6, 2, 'A layered architecture separates responsibilities into logical layers.', 'true_false', 40.00, 2,
 NULL, 'True'),
(7, 3, 'Which HTTP method is commonly used to create a resource?', 'multiple_choice', 50.00, 1,
 '["POST","GET","PUT","DELETE"]',
 'POST'),
(8, 3, 'Which status code commonly indicates successful resource creation?', 'multiple_choice', 50.00, 2,
 '["201","200","404","500"]',
 '201');


INSERT INTO attempts
(attempt_id, quiz_id, student_id, attempt_number, score, started_at, submitted_at, status)
VALUES
(1, 1, 3, 1, 75.00, '2026-09-10 09:00:00', '2026-09-10 09:20:00', 'graded'),
(2, 1, 4, 1, 74.00, '2026-09-10 10:00:00', '2026-09-10 10:20:00', 'graded'),
(3, 2, 4, 1, 40.00, '2026-09-20 10:00:00', '2026-09-20 10:20:00', 'graded'),
(4, 2, 4, 2, 60.00, '2026-09-21 10:00:00', '2026-09-21 10:20:00', 'graded');


INSERT INTO lesson_progress
(progress_id, student_id, lesson_id, status, progress_percent, started_at, completed_at, last_accessed_at)
VALUES
(1, 3, 1, 'completed', 100.00, '2026-09-05 09:00:00', '2026-09-05 09:30:00', '2026-09-05 09:30:00'),
(2, 3, 2, 'in_progress', 50.00, '2026-09-12 09:00:00', NULL, '2026-09-12 09:20:00'),
(3, 4, 1, 'completed', 100.00, '2026-09-05 10:00:00', '2026-09-05 10:30:00', '2026-09-05 10:30:00'),
(4, 4, 3, 'completed', 100.00, '2026-09-18 10:00:00', '2026-09-18 10:40:00', '2026-09-18 10:40:00');


INSERT INTO announcements
(announcement_id, course_id, author_id, title, content, published_at, expires_at, status)
VALUES
(1, 1, 2, 'Welcome to DBMS101',
 'Welcome! Start with Module 1 and complete the introductory lessons before taking the quiz.',
 '2026-09-01 08:00:00', NULL, 'published'),
(2, 1, 2, 'SQL Quiz Reminder',
 'Remember to review SQL joins before moving on to the SQL and Queries module.',
 '2026-09-12 08:00:00', NULL, 'published'),
(3, 2, 2, 'SIA201 Course Update',
 'The API and System Integration module is now available to enrolled students.',
 '2026-09-20 08:00:00', NULL, 'published');


INSERT INTO lesson_resources
(resource_id, lesson_id, title, resource_type, resource_url, description)
VALUES
(1, 1, 'Database Fundamentals PDF', 'pdf',
 'https://example.com/resources/database-fundamentals.pdf',
 'Introductory reading for database fundamentals.'),
(2, 2, 'SQL Quick Reference', 'document',
 'https://example.com/resources/sql-reference.pdf',
 'Quick reference for basic SQL commands.'),
(3, 2, 'SQL Joins Guide', 'link',
 'https://example.com/resources/sql-joins',
 'Additional explanation and examples of SQL joins.'),
(4, 4, 'REST API Guide', 'pdf',
 'https://example.com/resources/rest-api.pdf',
 'Reading material for REST API fundamentals.');


INSERT INTO attempt_answers
(answer_id, attempt_id, question_id, answer_text, is_correct, points_earned)
VALUES
(1, 1, 1, 'Store and manage data', TRUE, 37.00),
(2, 1, 2, 'Database Management System', TRUE, 37.00),
(3, 1, 3, 'False', FALSE, 0.00),
(4, 1, 4, 'Primary key', TRUE, 1.00);


INSERT INTO assignments
(assignment_id, module_id, created_by, title, instructions, due_date, max_score, status)
VALUES
(1, 1, 2, 'Database Design Exercise',
 'Create a simple relational database design and identify the primary and foreign keys.',
 '2026-09-18 23:59:00', 100.00, 'published'),
(2, 2, 2, 'SQL Query Practice',
 'Write SQL queries using SELECT, WHERE, ORDER BY, and INNER JOIN.',
 '2026-09-28 23:59:00', 100.00, 'published'),
(3, 4, 2, 'REST API Design Activity',
 'Design a small REST API with resources, endpoints, methods, and expected status codes.',
 '2026-10-10 23:59:00', 100.00, 'published');

INSERT INTO submissions
(submission_id, assignment_id, student_id, submission_text, file_url, submitted_at, score, feedback, status)
VALUES
(1, 1, 3, 'Submitted a database design with users, courses, and enrollments.',
 'https://example.com/submissions/mia-db-design.pdf',
 '2026-09-17 18:00:00', 95.00, 'Good relationships and clear key selection.', 'graded'),
(2, 1, 4, 'Submitted an initial relational database design after the deadline.',
 'https://example.com/submissions/noah-db-design.pdf',
 '2026-09-19 20:00:00', 80.00, 'Late submission; improve the normalization explanation.', 'late'),
(3, 2, 3, 'Submitted SQL practice queries.',
 'https://example.com/submissions/mia-sql-practice.pdf',
 '2026-09-27 17:00:00', NULL, NULL, 'submitted');


INSERT INTO discussions
(discussion_id, module_id, author_id, title, content, status)
VALUES
(1, 1, 3, 'Why are primary keys important?',
 'Why is a primary key important when designing a relational database?',
 'active'),
(2, 2, 4, 'When should I use INNER JOIN?',
 'I am still learning when INNER JOIN is preferable to LEFT JOIN. Can someone explain?',
 'active'),
(3, 4, 3, 'REST API best practices',
 'What are some important practices when designing REST API endpoints?',
 'active');


INSERT INTO discussion_replies
(reply_id, discussion_id, author_id, content, status)
VALUES
(1, 1, 4, 'A primary key uniquely identifies each row, which makes records easier to reference.',
 'active'),
(2, 1, 2, 'Exactly. Primary keys also support reliable relationships through foreign keys.',
 'active'),
(3, 2, 2, 'INNER JOIN is useful when you only want records that have matching values in both tables.',
 'active'),
(4, 3, 2, 'Keep endpoints resource-oriented and return consistent HTTP status codes and JSON responses.',
 'active');


INSERT INTO module_prerequisites
(prerequisite_id, module_id, prerequisite_module_id, minimum_score)
VALUES
(1, 2, 1, 75.00),
(2, 4, 3, 75.00);


INSERT INTO notifications
(notification_id, user_id, title, message, notification_type, reference_id, is_read)
VALUES
(1, 3, 'Module unlocked: SQL and Queries', 'You scored 75% on the Database Fundamentals Quiz.', 'quiz', 1, TRUE),
(2, 3, 'New Announcement', 'A new announcement has been posted in DBMS101.', 'announcement', 2, FALSE),
(3, 4, 'Quiz Progress', 'Your latest Database Fundamentals Quiz score was 74%. You need 75% to unlock Module 2.', 'progress', 1, FALSE),
(4, 4, 'Module unlocked by your instructor', 'Your instructor unlocked API and System Integration for you.', 'progress', 4, FALSE);


INSERT INTO module_unlocks
(unlock_id, module_id, student_id, unlocked_by, reason)
VALUES
(1, 4, 4, 2, 'Student used both attempts on the System Architecture quiz (40%, then 60%) and stayed below the minimum score; instructor granted an override.');


SELECT
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    c.course_code,
    c.course_name,
    e.status AS enrollment_status,
    e.final_score
FROM enrollments e
INNER JOIN users u ON u.user_id = e.student_id
INNER JOIN courses c ON c.course_id = e.course_id
ORDER BY c.course_code, student_name;


SELECT
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    q.title AS quiz,
    a.attempt_number,
    a.score,
    a.status
FROM attempts a
INNER JOIN users u ON u.user_id = a.student_id
INNER JOIN quizzes q ON q.quiz_id = a.quiz_id
ORDER BY student_name, q.quiz_id, a.attempt_number;


SELECT
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    c.course_code,
    m.title AS module,
    l.title AS lesson,
    lp.status,
    lp.progress_percent
FROM lesson_progress lp
INNER JOIN users u ON u.user_id = lp.student_id
INNER JOIN lessons l ON l.lesson_id = lp.lesson_id
INNER JOIN modules m ON m.module_id = l.module_id
INNER JOIN courses c ON c.course_id = m.course_id
ORDER BY student_name, c.course_code, m.module_order, l.lesson_order;

SELECT
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    target.title AS unlocked_module,
    prerequisite.title AS prerequisite_module,
    mp.minimum_score,
    mu.reason,
    CONCAT(i.first_name, ' ', i.last_name) AS unlocked_by
FROM module_unlocks mu
INNER JOIN users u ON u.user_id = mu.student_id
INNER JOIN modules target ON target.module_id = mu.module_id
INNER JOIN module_prerequisites mp ON mp.module_id = mu.module_id
INNER JOIN modules prerequisite ON prerequisite.module_id = mp.prerequisite_module_id
INNER JOIN users i ON i.user_id = mu.unlocked_by
ORDER BY student_name;

SELECT
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    c.course_code,
    m.title AS module,
    a.title AS assignment,
    s.submitted_at,
    s.score,
    s.status
FROM submissions s
INNER JOIN users u ON u.user_id = s.student_id
INNER JOIN assignments a ON a.assignment_id = s.assignment_id
INNER JOIN modules m ON m.module_id = a.module_id
INNER JOIN courses c ON c.course_id = m.course_id
ORDER BY student_name, s.submitted_at;
