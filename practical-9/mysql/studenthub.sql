-- StudentHub database  (Practical 8 - secure registration)
-- Import in phpMyAdmin: Import tab -> choose this file -> Go

CREATE DATABASE IF NOT EXISTS studenthub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studenthub;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) EVENTS
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  event_date  DATE         NOT NULL,
  location    VARCHAR(100) NOT NULL,
  seats       INT          NOT NULL DEFAULT 50,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

INSERT INTO events (title, description, event_date, location, seats) VALUES
('Web Development Workshop','Hands-on HTML, CSS and JavaScript session.','2026-11-05','Lab 101',40),
('Hackathon 2026','24-hour coding competition in teams of four.','2026-11-14','Main Auditorium',100),
('Java Seminar','Object-oriented programming with industry speaker.','2026-11-20','Seminar Hall',60),
('Database Design Bootcamp','ER diagrams, normalization and SQL practice.','2026-12-02','Lab 204',30),
('Annual Tech Fest','Project exhibition, quizzes and cultural events.','2026-12-15','College Ground',300);

INSERT INTO registrations (student_id, event_id) VALUES
(1,1),(1,2),(2,1),(3,3),(4,2),(5,2),(6,4),(7,1),(8,5),(9,2),(10,5);

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
