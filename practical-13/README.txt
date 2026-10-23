PRACTICAL 13 - Simple PHP JSON API + Fetch API (events) - StudentHub
(built on practical-12)

1. Copy this folder to C:\xampp\htdocs\practical-13
2. Start Apache + MySQL in XAMPP
3. phpMyAdmin -> Import -> mysql/studenthub.sql -> Go
4. Open http://localhost/practical-13/html-css/login.html
5. Log in as admin:  admin@studenthub.edu / Admin@1234
   -> Admin Dashboard -> "JSON API + Fetch Demo"  (php/api_demo.php)

You can also open the API in the browser (public GET):
   http://localhost/practical-13/php/api/events.php
   http://localhost/practical-13/php/api/events.php?id=3
   http://localhost/practical-13/php/api/events.php?q=java

New files
  php/api/events.php     the JSON API:  GET list / GET one / POST add / PUT update / DELETE delete
  php/api_demo.php       page guard (admin only) + serves html-css/api_demo.html
  html-css/api_demo.html
  js/api_demo.js         fetch() calls; the table, messages and request log update without reloading the page
  json/api_docs.json     endpoint list shown on the demo page

Small additions to existing files
  html-css/admin.html    "JSON API + Fetch Demo" button
  mysql/studenthub.sql   events.updated_at column + Practical 13 queries

API rules
  - GET is public. POST, PUT and DELETE need an admin session (401 / 403 otherwise).
  - POST and PUT send JSON (Content-Type: application/json), otherwise 415.
  - Status codes: 200, 201, 400, 401, 403, 404, 405, 409 (same title + date), 415, 422 (validation), 500.
  - Every database statement is a MySQLi prepared statement.
  - Posters are not changed by this API (see practical 12 for uploads); deleting an event removes its poster file.
Open the pages through the login / php files, not by double-clicking the .html files.
