PRACTICAL 10 - Secure login / logout with PHP sessions - StudentHub

1. Copy this folder to C:\xampp\htdocs\practical-10
2. Start Apache + MySQL in XAMPP
3. phpMyAdmin -> Import -> mysql/studenthub.sql -> Go
4. Open http://localhost/practical-10/html-css/login.html

Demo accounts
  admin  : admin@studenthub.edu        / Admin@1234   -> php/admin.php
  student: heer.patel@example.com      / Student@123  -> php/dashboard.php
  (any seeded student works with Student@123; login also accepts the Student ID, e.g. ST1011)

New files
  php/auth.php           session start (httponly, samesite), timeout, remember-me, guards
  php/login.php          password_verify(), session_regenerate_id(true), role redirect
  php/logout.php         destroys session + remember-me token
  php/session_check.php  who is logged in (used by the pages)
  php/dashboard.php      student dashboard (guard + serves html-css/dashboard.html)
  php/admin.php          admin dashboard (guard + serves html-css/admin.html)
  php/admin_students.php admin-only user list
  html-css/admin.html, js/admin.js

Small additions to existing files
  login.html / login.js, dashboard.html / dashboard.js, mysql/studenthub.sql
  (role + last_login columns, remember_tokens table, admin account)

Open the dashboards through php/dashboard.php (login does this) - not by double-clicking the .html file.
Session timeout: 15 minutes of inactivity (SESSION_TIMEOUT in php/auth.php).
