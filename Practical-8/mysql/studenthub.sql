-- StudentHub database  (Practical 7)
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

-- SAMPLE DATA (same students as students.json)
INSERT INTO students (student_id, name, course, year, email) VALUES
('ST1001','Aarav Patel','CSE',2,'aarav.patel@example.com'),
('ST1002','Diya Shah','IT',1,'diya.shah@example.com'),
('ST1003','Rohan Mehta','CE',3,'rohan.mehta@example.com'),
('ST1004','Isha Desai','DS',4,'isha.desai@example.com'),
('ST1005','Karan Joshi','CSE',3,'karan.joshi@example.com'),
('ST1006','Meera Trivedi','IT',2,'meera.trivedi@example.com'),
('ST1007','Neel Parmar','DS',1,'neel.parmar@example.com'),
('ST1008','Priya Nair','CE',4,'priya.nair@example.com'),
('ST1009','Yash Vyas','CSE',1,'yash.vyas@example.com'),
('ST1010','Sneha Kapoor','IT',3,'sneha.kapoor@example.com');

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
