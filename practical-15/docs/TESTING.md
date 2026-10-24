# StudentHub - test report and test plan

## A. Checks already run while building the project

These were run in the build environment, which has **no Apache, PHP or MySQL**. Anything that needs the database or PHP is therefore in part B.

| Area | Check | Result |
|---|---|---|
| Navigation | `python3 tools/verify.py`: every link, script, form action and role-menu link points to an existing file; no page links straight to a protected `.html` | passed |
| JavaScript | `node --check` on all 17 JavaScript files | passed |
| PHP | bracket / quote balance and `<?php` start for all PHP files (**not** a real `php -l`) | passed |
| Security rules | `tools/verify.py`: prepared statements, `password_hash` / `password_verify`, session ID regeneration, cookie flags, timeout, remember-me hashing, upload checks, role checks, no `eval/exec/md5/sha1` | passed |
| Protection files | `.htaccess` for protected pages, `php/`, `php/data`, `mysql/`, `uploads/posters`, directory listing off | files present (effect is tested in part B) |
| Responsiveness | 15 pages opened at 375, 768 and 1280 px in a browser: no sideways scrolling. Two pages (home, login) overflowed on a phone and were fixed with small `@media` rules | passed |
| AJAX / forms | Login messages, registration duplicate errors, student CRUD, event CRUD with poster errors, JSON API (GET/POST/PUT/DELETE), dashboard statistics, role menu: run in a browser with the server replies **mocked** | worked as designed |
| Documentation | README, install guide, security notes, GitHub guide, this file | written |

Run the first rows again at any time: `python3 tools/verify.py`

## B. Test plan to run on XAMPP (fill in the last column)

Start with the install guide (`docs/INSTALL_VHOST.md`), import `mysql/studenthub.sql`, open `http://studenthub.local/`.

### B1. Authentication
| # | Steps | Expected | Done |
|---|---|---|---|
| 1 | Login with a wrong password | red message "Invalid email/username or password." (same text for an unknown user) | ☐ |
| 2 | Login as student `heer.patel@example.com` / `Student@123` | goes to the student dashboard; menu shows student items | ☐ |
| 3 | Login as admin `admin@studenthub.edu` / `Admin@1234` | goes to the admin dashboard; menu shows admin items | ☐ |
| 4 | Login with the Student ID `ST1011` instead of the email | works | ☐ |
| 5 | Press Logout, then the browser Back button | login page / expired session, dashboard not shown | ☐ |
| 6 | Wrong password 6 times | message "Too many failed attempts…", wait 1 minute | ☐ |
| 7 | Tick "Remember me", login, close the browser, open `php/dashboard.php` again | still logged in; in phpMyAdmin `remember_tokens` has a new row | ☐ |
| 8 | Without Remember me: set `SESSION_TIMEOUT` to 60 in `php/auth.php`, login, wait 70 s, reload | login page with "Session Expired" | ☐ |
| 9 | After the test set `SESSION_TIMEOUT` back to 900 | | ☐ |

### B2. Access control
| # | Steps | Expected | Done |
|---|---|---|---|
| 1 | Logged out: open `/php/dashboard.php`, `/php/admin.php`, `/php/page.php?p=results` | redirected to the login page | ☐ |
| 2 | Logged out: open `/html-css/admin.html` and `/html-css/results.html` directly | 403 Forbidden | ☐ |
| 3 | Student: open `/php/admin.php` | redirected to the student dashboard | ☐ |
| 4 | Student: open `/php/admin_stats.php` and `/php/students_api.php?action=list` | JSON with `Access denied` (403) | ☐ |
| 5 | Open `/mysql/studenthub.sql`, `/php/data/`, `/php/config.php`, `/docs/README.md` | 403 or 404 | ☐ |
| 6 | Open `/uploads/` | no file list (403) | ☐ |

### B3. Database operations
| # | Steps | Expected | Done |
|---|---|---|---|
| 1 | Register a new student on the Profile page | success message; new row in `students` with a `$2y$` password hash | ☐ |
| 2 | Register again with the same email / Student ID | red messages under the fields | ☐ |
| 3 | Admin → Manage Students: add, edit, search, filter, delete | green success / red failure messages; table and phpMyAdmin agree | ☐ |
| 4 | Admin → Manage Events: add an event with a JPG poster, edit, delete | poster saved in `uploads/posters/`, removed again on delete | ☐ |
| 5 | Student → Events → Register | success; row in `registrations`; second click says "already registered" | ☐ |
| 6 | Contact page: send a message | success; row in `contact_messages` | ☐ |

### B4. AJAX (no full page reload)
| # | Steps | Expected | Done |
|---|---|---|---|
| 1 | Admin → JSON API + Fetch Demo: add, edit, delete an event | table changes, the page does not reload, the request log shows 201 / 200 | ☐ |
| 2 | Manage Students: type in the search box | list changes after a short pause | ☐ |
| 3 | Profile: leave the email field with an existing email | "already registered" appears before you press Save | ☐ |
| 4 | Admin dashboard: press Refresh | numbers update without reload | ☐ |

### B5. Security
| # | Steps | Expected | Done |
|---|---|---|---|
| 1 | Login with `' OR '1'='1` as the email | normal "Invalid …" message | ☐ |
| 2 | Contact message `<script>alert(1)</script>` | no alert; tags removed | ☐ |
| 3 | Upload `notes.pdf`, a 3 MB image, and a text file renamed `x.jpg` as a poster | three different clear errors; nothing saved | ☐ |
| 4 | Admin API as a student: `fetch('/php/api/events.php',{method:'DELETE'})` in the console | 401 / 403 JSON | ☐ |
| 5 | Check the cookie in the browser tools | `STUDENTHUB_SESSION` is HttpOnly | ☐ |

### B6. Responsiveness
Open the browser developer tools → device toolbar → iPhone SE (375 px) and iPad (768 px).
Check: home, login, profile, dashboard, admin dashboard, manage students, manage events.
Expected: no sideways scrolling; tables scroll inside their own box; the hamburger menu works on the public pages.  ☐

### B7. Documentation and submission
| # | Item | Done |
|---|---|---|
| 1 | README opens and the steps work on a clean XAMPP | ☐ |
| 2 | `docs/` files read correctly | ☐ |
| 3 | Real phpMyAdmin screenshots added to `screenshots/` | ☐ |
| 4 | Repository pushed and link submitted (`docs/GITHUB.md`) | ☐ |

Notes / problems found:

________________________________________________
