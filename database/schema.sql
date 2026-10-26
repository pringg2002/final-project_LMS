CREATE DATABASE IF NOT EXISTS lms_final_database;

USE lms_final_database;

CREATE TABLE IF NOT EXISTS roles (
    role_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('announcement','progress','quiz','assignment','system') NOT NULL DEFAULT 'system',
    reference_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (user_id, is_read),
    INDEX idx_notifications_created (created_at)
);

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    passing_score DECIMAL(5,2) NOT NULL DEFAULT 75.00,
    time_limit_minutes INT NULL,
    attempt_limit INT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (module_id) REFERENCES modules(module_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS questions (
    question_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL DEFAULT 'multiple_choice',
    points DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    question_order INT NOT NULL DEFAULT 1,
    correct_answer TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    attempt_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('in_progress', 'submitted', 'graded') NOT NULL DEFAULT 'in_progress',

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

    FOREIGN KEY (student_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

    INDEX idx_quiz_attempts_user (student_id),
    INDEX idx_quiz_attempts_quiz (quiz_id)
);

 
 CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    author_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME NOT NULL,
    expires_at DATETIME NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attempt_answers (
    answer_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

