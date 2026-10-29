-- Active: 1792478757853@@127.0.0.1@3306@lms_final_database
USE lms_final_database;

INSERT INTO roles (role_id, role_name, description) VALUES
  (1, 'admin',      'Full system access'),
  (2, 'instructor', 'Creates and manages courses'),
  (3, 'student',    'Enrolls in courses and learns')
ON DUPLICATE KEY UPDATE description = VALUES(description);