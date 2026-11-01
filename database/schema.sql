-- Active: 1792478757853@@127.0.0.1@3306@lms_final_database
CREATE DATABASE IF NOT EXISTS lms_final_database;
USE lms_final_database;

CREATE TABLE roles (
  role_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  UNIQUE KEY uq_roles_name (role_name)
);

CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE KEY,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
  KEY idx_users_role (role_id),
  KEY idx_users_status (status),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE courses (
  course_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(30) NOT NULL UNIQUE KEY,
  course_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  instructor_id INT NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_courses_instructor (instructor_id),
  KEY idx_courses_status (status),
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users (user_id)
);

CREATE TABLE modules (
  module_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  module_order INT NOT NULL DEFAULT 1,
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_modules_course (course_id, module_order),
  KEY idx_modules_status (status),
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
);

CREATE TABLE lessons (
  lesson_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NULL,
  lesson_order INT NOT NULL DEFAULT 1,
  estimated_minutes INT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
  KEY idx_lessons_module (module_id, lesson_order),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE
);

CREATE TABLE enrollments (
  enrollment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active','completed','dropped') NOT NULL DEFAULT 'active',
  completion_date DATETIME NULL,
  final_score DECIMAL(5,2) NULL,

  UNIQUE KEY uq_enrollments_student_course (student_id, course_id),
  KEY idx_enrollments_course (course_id), 
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
);

CREATE TABLE quizzes (
  quiz_id  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  time_limit_minutes INT NULL,
  attempt_limit INT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

<<<<<<< HEAD
  KEY idx_quizzes_module (module_id),
  CONSTRAINT fk_quizzes_module FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE
);

CREATE TABLE questions (
  question_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice','true_false','short_answer') NOT NULL DEFAULT 'multiple_choice',
  points DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  question_order INT NOT NULL DEFAULT 1,
  options JSON NULL,
  correct_answer TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  KEY idx_questions_quiz (quiz_id, question_order),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (quiz_id) ON DELETE CASCADE
);

CREATE TABLE attempts (
  attempt_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  score DECIMAL(5,2) NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  status ENUM('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',

  UNIQUE KEY uq_attempts_quiz_student_number (quiz_id, student_id, attempt_number),
  KEY idx_attempts_student (student_id),
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (quiz_id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE lesson_progress (
  progress_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_accessed_at DATETIME NULL,

  UNIQUE KEY uq_progress_student_lesson (student_id, lesson_id),
  KEY idx_progress_lesson (lesson_id),
  CONSTRAINT chk_progress_percent CHECK (progress_percent BETWEEN 0 AND 100),
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE CASCADE
);

CREATE TABLE announcements (
  announcement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  published_at DATETIME NULL,
  expires_at DATETIME NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  KEY idx_announcements_course (course_id),
  KEY idx_announcements_author (author_id),
  CONSTRAINT fk_announcements_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (user_id)
);

CREATE TABLE lesson_resources (
  resource_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  resource_type ENUM('pdf','video','link','document') NOT NULL DEFAULT 'link',
  resource_url VARCHAR(500) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  KEY idx_resources_lesson (lesson_id),
  CONSTRAINT fk_resources_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE CASCADE
);

CREATE TABLE attempt_answers (
  answer_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT NULL,
  is_correct BOOLEAN NULL,
  points_earned DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_answers_attempt_question (attempt_id, question_id),
  KEY idx_answers_question (question_id),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts (attempt_id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (question_id) ON DELETE CASCADE
);

CREATE TABLE assignments (
  assignment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  instructions  TEXT NULL,
  due_date DATETIME NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
  KEY idx_assignments_module (module_id),
  KEY idx_assignments_creator (created_by),
  CONSTRAINT fk_assignments_module  FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_creator FOREIGN KEY (created_by) REFERENCES users (user_id)
);

CREATE TABLE submissions (
  submission_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT NULL,
  file_url VARCHAR(500) NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score DECIMAL(5,2) NULL,
  feedback TEXT NULL,
  status ENUM('submitted','graded','late') NOT NULL DEFAULT 'submitted',

  KEY idx_submissions_assignment (assignment_id),
  KEY idx_submissions_student (student_id),
  CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE discussions (
  discussion_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active','closed') NOT NULL DEFAULT 'active',

  KEY idx_discussions_module (module_id),
  KEY idx_discussions_author (author_id),
  CONSTRAINT fk_discussions_module FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE,
  CONSTRAINT fk_discussions_author FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE discussion_replies (
  reply_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  discussion_id INT NOT NULL,
  author_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active','deleted') NOT NULL DEFAULT 'active',

  KEY idx_replies_discussion (discussion_id),
  KEY idx_replies_author (author_id),
  CONSTRAINT fk_replies_discussion FOREIGN KEY (discussion_id) REFERENCES discussions (discussion_id) ON DELETE CASCADE,
  CONSTRAINT fk_replies_author FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE module_prerequisites (
  prerequisite_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  prerequisite_module_id INT NOT NULL,
  minimum_score DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_prereq_pair (module_id, prerequisite_module_id),
  KEY idx_prereq_prereq (prerequisite_module_id),
  CONSTRAINT chk_prereq_not_self CHECK (module_id <> prerequisite_module_id),
  CONSTRAINT fk_prereq_module FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE,
  CONSTRAINT fk_prereq_prereq FOREIGN KEY (prerequisite_module_id) REFERENCES modules (module_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  notification_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('announcement','progress','quiz','system') NOT NULL DEFAULT 'system',
  reference_id INT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_notifications_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE module_unlocks (
  unlock_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  student_id INT NOT NULL,
  unlocked_by INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  UNIQUE KEY uq_unlocks_module_student (module_id, student_id),
  KEY idx_unlocks_student (student_id),
  CONSTRAINT fk_unlocks_module  FOREIGN KEY (module_id) REFERENCES modules (module_id) ON DELETE CASCADE,
  CONSTRAINT fk_unlocks_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_unlocks_teacher FOREIGN KEY (unlocked_by) REFERENCES users (user_id)
);
=======
    INDEX idx_quiz_attempts_user (student_id),
    INDEX idx_quiz_attempts_quiz (quiz_id)
);

>>>>>>> ba8688c9ab67fa6c4652eab10accf589347baa6a
