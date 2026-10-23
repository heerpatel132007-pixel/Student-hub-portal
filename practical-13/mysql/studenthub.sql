-- StudentHub database  (Practical 13 - JSON API with Fetch)
-- Import in phpMyAdmin: Import tab -> choose this file -> Go

CREATE DATABASE IF NOT EXISTS studenthub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studenthub;

DROP TABLE IF EXISTS remember_tokens;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS students;

-- 1) STUDENTS
CREATE TABLE students (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20)  UNIQUE,
  name       VARCHAR(50)  NOT NULL,
  course     ENUM('CSE','IT','CE','DS') NOT NULL,
  year       TINYINT      NOT NULL,
  semester   TINYINT      NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  mobile     VARCHAR(10)  NULL,
  password   VARCHAR(255) NULL,
  gender     ENUM('Male','Female','Other') NULL,
  address    VARCHAR(200) NULL,
  role       ENUM('student','admin') NOT NULL DEFAULT 'student',
  last_login DATETIME     NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_students_name (name),
  INDEX idx_students_course_year (course, year)
) ENGINE=InnoDB;

-- 2) EVENTS
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  event_date  DATE         NOT NULL,
  location    VARCHAR(100) NOT NULL,
  seats       INT          NOT NULL DEFAULT 50,
  poster      VARCHAR(255) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3) REGISTRATIONS  (students <-> events, many-to-many)
CREATE TABLE registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  event_id      INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_event (student_id, event_id),
  CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_event   FOREIGN KEY (event_id)   REFERENCES events(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) REMEMBER_TOKENS  (secure remember-me: only a SHA-256 hash of the token is stored)
CREATE TABLE remember_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT          NOT NULL,
  selector   CHAR(12)     NOT NULL UNIQUE,
  token_hash CHAR(64)     NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SAMPLE DATA  (passwords are bcrypt hashes made like PHP password_hash(); demo password: Student@123)
INSERT INTO students (student_id, name, course, year, semester, email, mobile, password, gender, address) VALUES
('ST1001','Aarav Patel','CSE',2,3,'aarav.patel@example.com','9876543210','$2y$10$XQtnze.3oOy6pZi2IkcD0e0D3uKq2dcqFPPRDJorCIIruyp0nNGpm','Male','Ahmedabad, Gujarat'),
('ST1002','Diya Shah','IT',1,1,'diya.shah@example.com','9876543211','$2y$10$sEEQijZHTWh5cuu8qrboSOITjahpj3zDJIcmYpQstew1.8b677Vr.','Female','Surat, Gujarat'),
('ST1003','Rohan Mehta','CE',3,5,'rohan.mehta@example.com','9876543212','$2y$10$obXrIJGpN5HSXN8dnrfJiuVX4n0NnCSSvx9ZzAoSqkdDm.aDQqT4S','Male','Vadodara, Gujarat'),
('ST1004','Isha Desai','DS',4,7,'isha.desai@example.com','9876543213','$2y$10$2QcXxAXEEErwOUT8I06SNOdv3XzpXl.yTY50DnWqevPoxL1a0oray','Female','Rajkot, Gujarat'),
('ST1005','Karan Joshi','CSE',3,5,'karan.joshi@example.com','9876543214','$2y$10$y2K0hZ1XisV/7FHDwc6m3.7BiZnxRmABuz6mziDHclulX6paEZWKi','Male','Bharuch, Gujarat'),
('ST1006','Meera Trivedi','IT',2,3,'meera.trivedi@example.com','9876543215','$2y$10$sGcmMWCEKml7nwCdZ0iI1u78zhaJ13Ur1ILnEAxA.EEwxyTsPWJtO','Female','Anand, Gujarat'),
('ST1007','Neel Parmar','DS',1,1,'neel.parmar@example.com','9876543216','$2y$10$ysMn0NFH1jsjSfzq7Hm7a.fSjFcYDYdZ3ut3tDdpUqJQMw27fowo.','Male','Navsari, Gujarat'),
('ST1008','Priya Nair','CE',4,7,'priya.nair@example.com','9876543217','$2y$10$scJMBagJDLsTVXbTlHdALeY9JxZQDoqlPq9dqsij/fFRAE28DSqzm','Female','Valsad, Gujarat'),
('ST1009','Yash Vyas','CSE',1,2,'yash.vyas@example.com','9876543218','$2y$10$pikW4V22cTXnZOMhdbG7ou3ejYudJgmkFT.grwnIep6PynqsGGsVO','Male','Gandhinagar, Gujarat'),
('ST1010','Sneha Kapoor','IT',3,6,'sneha.kapoor@example.com','9876543219','$2y$10$NXSpoKA1AcIG09kHcOF3V.z0NPmtTda9lSNlmHBle4T34vt65hW0u','Female','Morbi, Gujarat'),
('ST1011','Heer Patel','CSE',2,4,'heer.patel@example.com','9876543220','$2y$10$4EdJm7ZCiM7I1in0fNgAqO5k5G7Xe9w6BkT38lI77iit7LYyYKbvu','Female','Ankleshwar, Gujarat');

-- Admin account (role-based redirection goes to the admin dashboard). Password: Admin@1234
INSERT INTO students (student_id, name, course, year, semester, email, mobile, password, gender, address, role) VALUES
('ADMIN01','System Admin','CSE',4,8,'admin@studenthub.edu','9876543200','$2y$10$HEsSkTVZyI52OC4t0tqY4.3/AhfJw58nDbruz9.JZU2Vn6T9ycXaK','Male','Ankleshwar, Gujarat','admin');

UPDATE students SET last_login = '2026-10-22 14:05:12' WHERE student_id = 'ST1011';
UPDATE students SET last_login = '2026-10-22 14:03:47' WHERE student_id = 'ADMIN01';

INSERT INTO events (title, description, event_date, location, seats, poster) VALUES
('Web Development Workshop','Hands-on HTML, CSS and JavaScript session.','2026-11-05','Lab 101',40,'poster_seed_1.jpg'),
('Hackathon 2026','24-hour coding competition in teams of four.','2026-11-14','Main Auditorium',100,'poster_seed_2.jpg'),
('Java Seminar','Object-oriented programming with industry speaker.','2026-11-20','Seminar Hall',60,'poster_seed_3.jpg'),
('Database Design Bootcamp','ER diagrams, normalization and SQL practice.','2026-12-02','Lab 204',30,'poster_seed_4.jpg'),
('Annual Tech Fest','Project exhibition, quizzes and cultural events.','2026-12-15','College Ground',300,'poster_seed_5.jpg'),
('Orientation Day','Welcome session for new students.','2026-09-10','Main Auditorium',200,'poster_seed_6.jpg');

INSERT INTO registrations (student_id, event_id) VALUES
(1,1),(1,2),(2,1),(3,3),(4,2),(5,2),(6,4),(7,1),(8,5),(9,2),(10,5);

INSERT INTO remember_tokens (student_id, selector, token_hash, expires_at) VALUES
(11,'3f9a1c7d2b84','50bd76f132e8c8934ce556107169036104110d8c611d067ed92c446902b07cbb','2026-11-21 14:05:12');

-- USEFUL QUERIES --------------------------------------------------
-- All registrations with names
SELECT s.name, s.student_id, e.title, e.event_date, r.registered_at
FROM registrations r
JOIN students s ON s.id = r.student_id
JOIN events   e ON e.id = r.event_id
ORDER BY r.id;

-- Seats left per event
SELECT e.title, e.seats, COUNT(r.id) AS registered, e.seats - COUNT(r.id) AS seats_left
FROM events e LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id;

-- PRACTICAL 8: REGISTRATION QUERIES (used by php/process.php and php/check_user.php) ---------
-- Duplicate check (email or Student ID/username) before inserting
SELECT email, student_id FROM students WHERE email = 'heer.patel@example.com' OR student_id = 'ST1011';

-- Insert a new user (PHP binds the values with mysqli prepared statements; password = password_hash())
-- INSERT INTO students (student_id, name, course, year, semester, email, mobile, password, gender, address)
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Check that every password is stored as a hash (never plain text)
SELECT student_id, email, LEFT(password, 7) AS hash_prefix, LENGTH(password) AS hash_length FROM students;

-- PRACTICAL 10: LOGIN / SESSION QUERIES (used by php/login.php, php/auth.php) ---------------
-- Find the user by email OR Student ID (username); password_verify() runs in PHP
SELECT id, student_id, name, email, role FROM students WHERE email = 'heer.patel@example.com' OR student_id = 'heer.patel@example.com';

-- Record the last login time after a successful login
-- UPDATE students SET last_login = NOW() WHERE id = ?;

-- Users per role (role-based redirection)
SELECT role, COUNT(*) AS users FROM students GROUP BY role;

-- Valid remember-me tokens (not expired)
SELECT t.selector, s.student_id, t.expires_at FROM remember_tokens t JOIN students s ON s.id = t.student_id WHERE t.expires_at > NOW();

-- PRACTICAL 11: STUDENT MANAGEMENT QUERIES (used by php/students_api.php) -------------------
-- ADD    (PHP binds the values; password = password_hash())
-- INSERT INTO students (student_id, name, course, year, semester, email, mobile, password, gender, address, role)
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- VIEW   (all students, newest first)
SELECT id, student_id, name, course, year, email, role FROM students ORDER BY id DESC;

-- SEARCH (name, Student ID or email)
SELECT id, student_id, name, course, year, email FROM students
WHERE name LIKE '%patel%' OR student_id LIKE '%patel%' OR email LIKE '%patel%';

-- FILTER (course + year)
SELECT id, student_id, name, course, year, email FROM students
WHERE course = 'CSE' AND year = 2 ORDER BY name;

-- EDIT
-- UPDATE students SET name = ?, course = ?, year = ?, semester = ?, email = ?, mobile = ?, gender = ?, address = ?, role = ? WHERE id = ?;

-- DELETE (registrations and remember-me tokens are removed automatically by ON DELETE CASCADE)
-- DELETE FROM students WHERE id = ?;

-- Students per course
SELECT course, COUNT(*) AS students FROM students GROUP BY course ORDER BY course;

-- PRACTICAL 12: EVENT MANAGEMENT QUERIES (used by php/events_api.php) ----------------------
-- ADD    (PHP binds the values; poster = random file name saved in uploads/posters/)
-- INSERT INTO events (title, description, event_date, location, seats, poster) VALUES (?, ?, ?, ?, ?, ?);

-- VIEW   (upcoming events first, with registrations so far)
SELECT e.id, e.title, e.event_date, e.location, e.seats, e.poster,
       (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
FROM events e ORDER BY e.event_date;

-- UPDATE
-- UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, seats = ?, poster = ? WHERE id = ?;

-- DELETE (registrations of the event are removed by ON DELETE CASCADE)
-- DELETE FROM events WHERE id = ?;

-- Upcoming events only
SELECT id, title, event_date, location FROM events WHERE event_date >= CURDATE() ORDER BY event_date;

-- Seats left per event
SELECT e.title, e.seats, COUNT(r.id) AS registered, e.seats - COUNT(r.id) AS seats_left
FROM events e LEFT JOIN registrations r ON r.event_id = e.id GROUP BY e.id;

-- PRACTICAL 13: STATEMENTS RUN BY THE JSON API (php/api/events.php) ----------------------------
-- GET    list            SELECT ... FROM events e [WHERE title/location LIKE ?] ORDER BY e.event_date;
-- GET    one             SELECT ... FROM events e WHERE e.id = ?;
-- POST   add             INSERT INTO events (title, description, event_date, location, seats) VALUES (?, ?, ?, ?, ?);
-- PUT    update          UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, seats = ? WHERE id = ?;
-- DELETE delete          DELETE FROM events WHERE id = ?;

-- Same title and date twice? (the API answers 409 Conflict)
SELECT id FROM events WHERE title = 'Hackathon 2026' AND event_date = '2026-11-14';

-- Events changed through the API (updated_at is filled automatically by MySQL)
SELECT id, title, seats, updated_at FROM events WHERE updated_at IS NOT NULL ORDER BY updated_at DESC;
