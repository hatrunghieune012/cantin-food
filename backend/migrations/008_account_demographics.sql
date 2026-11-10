-- Preserve existing student codes and unique index; new accounts may omit the code.
ALTER TABLE accounts
  MODIFY student_code VARCHAR(20) NULL,
  ADD COLUMN gender ENUM('male', 'female', 'other') NULL,
  ADD COLUMN date_of_birth DATE NULL;
