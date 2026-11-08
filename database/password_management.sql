USE lms_final_database;

ALTER TABLE users
  ADD COLUMN must_change_password
    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN token_version
    INT NOT NULL DEFAULT 0;
