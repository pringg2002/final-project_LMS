USE lms_final_database;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'admin', 'System administrator'),
(2, 'instructor', 'Creates and manages courses and learning content'),
(3, 'student', 'Learns through courses, lessons, quizzes, and assignments');


INSERT INTO users
(user_id, role_id, first_name, last_name, email, password_hash, status)
VALUES
(1, 1, 'Ada', 'Admin', 'ada.admin@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(2, 2, 'Ian', 'Instructor', 'ian.instructor@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(3, 2, 'April Mae', 'Castillon', 'april.mae.castillon@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(4, 3, 'John Mar', 'Singuit', 'john.mar.singuit@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(5, 3, 'Louise', 'Tumale', 'louise.tumale@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(6, 3, 'Mark', 'Silverio', 'mark.silverio@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(7, 3, 'George Norman', 'Triplitt', 'george.norman.triplitt@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(8, 3, 'Zschem', 'Remoticado', 'zschem.remosticado@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(9, 3, 'Jack', 'Torres', 'jack.torres@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(10, 3, 'Zed', 'Villanueva', 'zed.villanueva@testlms.com',
 '$2a$10$yxazpyL1iZ7lpLr/c8w4l.Eyii7oI3pRwmyw1gS/euLF4CJEtz6RK', 'active'),
(11, 3, 'Ruth', 'Mendoza', 'ruth.mendoza@testlms.com',
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
 3, 'draft');


INSERT INTO modules
(module_id, course_id, title, description, module_order, passing_score, status)
VALUES
(1, 1, 'Database Fundamentals',
 'Core concepts of databases, DBMS components, and relational data.',
 1, 75.00, 'published'),
(2, 1, 'SQL and Queries',
 'SQL statements, filtering, joins, grouping, and aggregate functions.',
 2, 75.00, 'published'),
(3, 2, 'System Architecture',
 'System components, layers, architecture patterns, and integration concepts.',
 1, 75.00, 'published'),
(4, 2, 'API and System Integration',
 'REST APIs, integration techniques, and communication between systems.',
 2, 75.00, 'published'),
(5, 3, 'Capstone Planning',
 'Planning, requirements, architecture, and implementation preparation for a capstone project.',
 1, 75.00, 'draft');


INSERT INTO lessons
(lesson_id, module_id, title, content, lesson_order, estimated_minutes, status)
VALUES
(1, 1, 'Introduction to Databases',
 'A database stores organized data that can be accessed and managed efficiently.',
 1, 30, 'published'),
(2, 1, 'DBMS Components',
 'A DBMS provides tools for storing, retrieving, securing, and managing data.',
 2, 35, 'published'),
(3, 2, 'Basic SQL',
 'Learn SELECT, INSERT, UPDATE, and DELETE statements.',
 1, 45, 'published'),
(4, 2, 'Filtering and Sorting',
 'Use WHERE, ORDER BY, and related SQL clauses to retrieve specific records.',
 2, 40, 'published'),
(5, 2, 'SQL Joins',
 'Use INNER JOIN, LEFT JOIN, and other joins to combine related records.',
 3, 45, 'published'),
(6, 3, 'Architecture Fundamentals',
 'Explore layers, components, responsibilities, and system boundaries.',
 1, 40, 'published'),
(7, 3, 'Architecture Patterns',
 'Compare common patterns such as layered and client-server architecture.',
 2, 40, 'published'),
(8, 4, 'REST API Fundamentals',
 'Learn resources, HTTP methods, status codes, and JSON responses.',
 1, 45, 'published'),
(9, 4, 'API Integration',
 'Connect applications through APIs and exchange data between services.',
 2, 45, 'published'),
(10, 5, 'Capstone Requirements',
 'Identify stakeholders, requirements, scope, and project objectives.',
 1, 35, 'draft'),
(11, 5, 'Capstone Architecture Plan',
 'Prepare the architecture and integration plan for the capstone system.',
 2, 40, 'draft');


INSERT INTO enrollments
(enrollment_id, student_id, course_id, enrolled_at, status, completion_date, final_score)
VALUES
(1, 5, 1, '2026-09-01 08:00:00', 'active', NULL, NULL),
(2, 6, 1, '2026-09-01 08:10:00', 'active', NULL, NULL),
(3, 7, 1, '2026-09-01 08:20:00', 'active', NULL, NULL),
(4, 8, 1, '2026-09-01 08:30:00', 'active', NULL, NULL),
(5, 9, 1, '2026-09-01 08:40:00', 'active', NULL, NULL),
(6, 4, 1, '2026-09-01 08:50:00', 'completed', '2026-10-20 15:00:00', 88.00),
(7, 5, 2, '2026-09-02 09:00:00', 'active', NULL, NULL),
(8, 8, 2, '2026-09-02 09:10:00', 'active', NULL, NULL),
(9, 11, 2, '2026-09-02 09:20:00', 'active', NULL, NULL),
(10, 4, 3, '2026-09-03 10:00:00', 'active', NULL, NULL);


INSERT INTO quizzes
(quiz_id, module_id, title, description, passing_score, time_limit_minutes, attempt_limit, status)
VALUES
(1, 1, 'Database Fundamentals Quiz',
 'Check understanding of database fundamentals.',
 75.00, 30, 3, 'published'),
(2, 2, 'SQL and Queries Quiz',
 'Assess knowledge of basic SQL and query operations.',
 75.00, 30, 2, 'published'),
(3, 3, 'System Architecture Quiz',
 'Assess understanding of architecture fundamentals.',
 75.00, 30, 2, 'published'),
(4, 4, 'API Integration Quiz',
 'Assess understanding of REST APIs and integration.',
 75.00, 30, 3, 'published');


INSERT INTO questions
(question_id, quiz_id, question_text, question_type, points, question_order, options, correct_answer)
VALUES
(1, 1, 'What is the primary purpose of a database?', 'multiple_choice', 10.00, 1,
 '["Store and manage data","Create images","Edit videos","Design logos"]',
 'Store and manage data'),
(2, 1, 'What does DBMS stand for?', 'multiple_choice', 10.00, 2,
 '["Database Management System","Data Backup Management Service","Digital Business Management System","Database Monitoring Service"]',
 'Database Management System'),
(3, 1, 'A relational database organizes data into tables.', 'true_false', 10.00, 3,
 NULL, 'True'),
(4, 1, 'Which key uniquely identifies a record in a table?', 'multiple_choice', 10.00, 4,
 '["Primary key","Foreign key","Duplicate key","Search key"]',
 'Primary key'),
(5, 2, 'Which SQL statement retrieves records?', 'multiple_choice', 10.00, 1,
 '["SELECT","FETCHALL","GETDATA","READ"]',
 'SELECT'),
(6, 2, 'Which clause filters rows in a query?', 'multiple_choice', 10.00, 2,
 '["WHERE","ORDER BY","GROUP BY","VALUES"]',
 'WHERE'),
(7, 2, 'Which clause sorts query results?', 'multiple_choice', 10.00, 3,
 '["ORDER BY","SORT","ARRANGE","FILTER"]',
 'ORDER BY'),
(8, 2, 'Which join returns only matching records from both tables?', 'multiple_choice', 10.00, 4,
 '["INNER JOIN","LEFT JOIN","RIGHT JOIN","CROSS JOIN"]',
 'INNER JOIN'),
(9, 3, 'What is a major goal of system architecture?', 'multiple_choice', 10.00, 1,
 '["Define system structure and responsibilities","Only design colors","Only write documentation","Only create passwords"]',
 'Define system structure and responsibilities'),
(10, 3, 'A layered architecture separates responsibilities into logical layers.', 'true_false', 10.00, 2,
 NULL, 'True'),
(11, 3, 'Which layer commonly handles database access?', 'multiple_choice', 10.00, 3,
 '["Data access layer","Presentation layer","User interface layer","Design layer"]',
 'Data access layer'),
(12, 4, 'Which HTTP method is commonly used to retrieve data?', 'multiple_choice', 10.00, 1,
 '["GET","POST","PUT","DELETE"]',
 'GET'),
(13, 4, 'Which HTTP method is commonly used to create a resource?', 'multiple_choice', 10.00, 2,
 '["POST","GET","PUT","DELETE"]',
 'POST'),
(14, 4, 'REST APIs commonly exchange data using JSON.', 'true_false', 10.00, 3,
 NULL, 'True'),
(15, 4, 'Which status code commonly indicates successful resource creation?', 'multiple_choice', 10.00, 4,
 '["201","200","404","500"]',
 '201');


INSERT INTO attempts
(attempt_id, quiz_id, student_id, attempt_number, score, started_at, submitted_at, status)
VALUES
(1, 1, 5, 1, 100.00, '2026-09-10 09:00:00', '2026-09-10 09:20:00', 'graded'),
(2, 2, 5, 1, 100.00, '2026-09-15 09:00:00', '2026-09-15 09:20:00', 'graded'),
(3, 4, 5, 1, 100.00, '2026-10-01 09:00:00', '2026-10-01 09:20:00', 'graded'),
(4, 1, 6, 1, 37.00, '2026-09-10 10:00:00', '2026-09-10 10:20:00', 'graded'),
(5, 1, 6, 2, 74.00, '2026-09-11 10:00:00', '2026-09-11 10:20:00', 'graded'),
(6, 1, 7, 1, 75.00, '2026-09-12 11:00:00', '2026-09-12 11:20:00', 'graded'),
(7, 1, 8, 1, 37.00, '2026-09-13 13:00:00', '2026-09-13 13:20:00', 'graded'),
(8, 1, 8, 2, 62.00, '2026-09-14 13:00:00', '2026-09-14 13:20:00', 'graded'),
(9, 1, 8, 3, 74.00, '2026-09-15 13:00:00', '2026-09-15 13:20:00', 'graded'),
(10, 1, 9, 1, 0.00, '2026-09-16 14:00:00', '2026-09-16 14:20:00', 'graded'),
(11, 1, 9, 2, 37.00, '2026-09-17 14:00:00', '2026-09-17 14:20:00', 'graded'),
(12, 1, 9, 3, 62.00, '2026-09-18 14:00:00', '2026-09-18 14:20:00', 'graded'),
(13, 1, 10, 1, 37.00, '2026-09-19 15:00:00', '2026-09-19 15:20:00', 'graded');


INSERT INTO lesson_progress
(progress_id, student_id, lesson_id, status, progress_percent, started_at, completed_at, last_accessed_at)
VALUES
(1, 5, 1, 'completed', 100.00, '2026-09-05 09:00:00', '2026-09-05 09:30:00', '2026-09-05 09:30:00'),
(2, 5, 2, 'completed', 100.00, '2026-09-06 09:00:00', '2026-09-06 09:35:00', '2026-09-06 09:35:00'),
(3, 5, 3, 'completed', 100.00, '2026-09-12 09:00:00', '2026-09-12 09:45:00', '2026-09-12 09:45:00'),
(4, 6, 1, 'completed', 100.00, '2026-09-05 10:00:00', '2026-09-05 10:30:00', '2026-09-05 10:30:00'),
(5, 6, 2, 'in_progress', 60.00, '2026-09-06 10:00:00', NULL, '2026-09-06 10:25:00'),
(6, 7, 1, 'completed', 100.00, '2026-09-05 11:00:00', '2026-09-05 11:30:00', '2026-09-05 11:30:00'),
(7, 7, 2, 'completed', 100.00, '2026-09-06 11:00:00', '2026-09-06 11:35:00', '2026-09-06 11:35:00'),
(8, 8, 1, 'completed', 100.00, '2026-09-05 13:00:00', '2026-09-05 13:30:00', '2026-09-05 13:30:00'),
(9, 8, 2, 'completed', 100.00, '2026-09-06 13:00:00', '2026-09-06 13:35:00', '2026-09-06 13:35:00'),
(10, 9, 1, 'in_progress', 50.00, '2026-09-07 14:00:00', NULL, '2026-09-07 14:20:00'),
(11, 4, 1, 'completed', 100.00, '2026-09-04 08:00:00', '2026-09-04 08:30:00', '2026-09-04 08:30:00'),
(12, 11, 6, 'in_progress', 50.00, '2026-09-08 09:00:00', NULL, '2026-09-08 09:20:00');

INSERT INTO announcements
(announcement_id, course_id, author_id, title, content, published_at, expires_at, status)
VALUES
(1, 1, 2, 'Welcome to DBMS101',
 'Welcome! Start with Module 1 and complete the introductory lessons before taking the quiz.',
 '2026-09-01 08:00:00', NULL, 'published'),
(2, 1, 2, 'SQL Quiz Reminder',
 'Remember to review SQL joins before attempting the SQL and Queries quiz.',
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
(2, 2, 'DBMS Components Video', 'video',
 'https://example.com/resources/dbms-components',
 'Video explaining the major components of a DBMS.'),
(3, 3, 'SQL Quick Reference', 'document',
 'https://example.com/resources/sql-reference.pdf',
 'Quick reference for basic SQL commands.'),
(4, 5, 'SQL Joins Guide', 'link',
 'https://example.com/resources/sql-joins',
 'Additional explanation and examples of SQL joins.'),
(5, 8, 'REST API Guide', 'pdf',
 'https://example.com/resources/rest-api.pdf',
 'Reading material for REST API fundamentals.'),
(6, 9, 'API Integration Examples', 'link',
 'https://example.com/resources/api-integration',
 'Examples of application-to-application API integration.');


INSERT INTO attempt_answers
(answer_id, attempt_id, question_id, answer_text, is_correct, points_earned)
VALUES
(1, 1, 1, 'Store and manage data', TRUE, 10.00),
(2, 1, 2, 'Database Management System', TRUE, 10.00),
(3, 1, 3, 'True', TRUE, 10.00),
(4, 1, 4, 'Primary key', TRUE, 10.00),
(5, 4, 1, 'Create images', FALSE, 0.00),
(6, 4, 2, 'Database Management System', TRUE, 10.00),
(7, 4, 3, 'False', FALSE, 0.00),
(8, 4, 4, 'Foreign key', FALSE, 0.00),
(9, 5, 1, 'Store and manage data', TRUE, 10.00),
(10, 5, 2, 'Database Management System', TRUE, 10.00),
(11, 5, 3, 'True', TRUE, 10.00),
(12, 5, 4, 'Foreign key', FALSE, 0.00),
(13, 6, 1, 'Store and manage data', TRUE, 10.00),
(14, 6, 2, 'Database Management System', TRUE, 10.00),
(15, 6, 3, 'True', TRUE, 10.00),
(16, 6, 4, 'Primary key', TRUE, 10.00);

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
(1, 1, 5, 'Submitted a database design with users, courses, and enrollments.',
 'https://example.com/submissions/mia-db-design.pdf',
 '2026-09-17 18:00:00', 95.00, 'Good relationships and clear key selection.', 'graded'),
(2, 1, 6, 'Submitted an initial relational database design.',
 'https://example.com/submissions/noah-db-design.pdf',
 '2026-09-19 20:00:00', 80.00, 'Good start; improve normalization explanation.', 'graded'),
(3, 2, 8, 'Submitted SQL practice queries.',
 'https://example.com/submissions/ella-sql-practice.pdf',
 '2026-09-29 22:30:00', 74.00, 'Review INNER JOIN and filtering conditions.', 'graded'),
(4, 2, 9, 'Submitted SQL query practice after the deadline.',
 'https://example.com/submissions/jack-sql-practice.pdf',
 '2026-10-01 23:30:00', 62.00, 'Late submission; review SQL joins.', 'late'),
(5, 3, 5, 'Designed a REST API for a learning module service.',
 'https://example.com/submissions/mia-rest-api.pdf',
 '2026-10-09 19:00:00', 98.00, 'Clear endpoint and response design.', 'graded');


INSERT INTO discussions
(discussion_id, module_id, author_id, title, content, status)
VALUES
(1, 1, 5, 'Why are primary keys important?',
 'Why is a primary key important when designing a relational database?',
 'active'),
(2, 2, 6, 'When should I use INNER JOIN?',
 'I am still learning when INNER JOIN is preferable to LEFT JOIN. Can someone explain?',
 'active'),
(3, 4, 5, 'REST API best practices',
 'What are some important practices when designing REST API endpoints?',
 'active');


INSERT INTO discussion_replies
(reply_id, discussion_id, author_id, content, status)
VALUES
(1, 1, 7, 'A primary key uniquely identifies each row, which makes records easier to reference.',
 'active'),
(2, 1, 2, 'Exactly. Primary keys also support reliable relationships through foreign keys.',
 'active'),
(3, 2, 2, 'INNER JOIN is useful when you only want records that have matching values in both tables.',
 'active'),
(4, 2, 8, 'So if a student has no matching enrollment, an INNER JOIN would exclude that student?',
 'active'),
(5, 3, 3, 'Keep endpoints resource-oriented and return consistent HTTP status codes and JSON responses.',
 'active');

INSERT INTO module_prerequisites
(prerequisite_id, module_id, prerequisite_module_id, minimum_score)
VALUES
(1, 2, 1, 75.00),
(2, 4, 3, 75.00);


INSERT INTO notifications
(notification_id, user_id, title, message, notification_type, reference_id, is_read)
VALUES
(1, 5, 'Welcome to DBMS101', 'You are enrolled in Database Management Systems.', 'system', 1, TRUE),
(2, 5, 'Quiz Passed', 'You passed the Database Fundamentals Quiz with 100%.', 'quiz', 1, TRUE),
(3, 6, 'Quiz Progress', 'Your latest Database Fundamentals Quiz score was 74%.', 'progress', 1, FALSE),
(4, 8, 'Instructor Review', 'You have used all attempts for the prerequisite quiz and require an instructor review.', 'progress', 1, FALSE),
(5, 9, 'Instructor Review', 'Your quiz attempts remain below the required score. Contact your instructor.', 'progress', 1, FALSE),
(6, 5, 'New Announcement', 'A new announcement has been posted in DBMS101.', 'announcement', 2, FALSE),
(7, 11, 'SIA201 Update', 'New learning material is available in SIA201.', 'announcement', 3, FALSE);


INSERT INTO module_unlocks
(unlock_id, module_id, student_id, unlocked_by, reason)
VALUES
(1, 2, 8, 2, 'Student used all attempts on the prerequisite quiz but remained below the minimum score; instructor granted an override.'),
(2, 2, 9, 2, 'Student used all attempts on the prerequisite quiz but remained below the minimum score; instructor granted an override.');

SET FOREIGN_KEY_CHECKS = 1;


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
INNER JOIN module_prerequisites mp
    ON mp.module_id = mu.module_id
INNER JOIN modules prerequisite
    ON prerequisite.module_id = mp.prerequisite_module_id
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