# Security checks

| Area | What the portal does | Where |
|---|---|---|
| SQL injection | Every query with user input is a MySQLi prepared statement. The few `->query()` calls run fixed SQL. Sort columns come from a whitelist; `LIKE` input is escaped. | all `php/*.php` |
| Passwords | `password_hash()` when saved, `password_verify()` at login, hash upgraded with `password_needs_rehash()`. | `process.php`, `students_api.php`, `login.php` |
| Login | Same message for unknown user and wrong password; 5 wrong tries → 60 s wait; session ID regenerated after login. | `login.php`, `auth.php` |
| Sessions | `HttpOnly`, `SameSite=Lax` cookie, strict mode, 15-minute inactivity timeout, session destroyed on logout. | `auth.php` |
| Remember-me | Random 64-character token in an HttpOnly cookie; only its SHA-256 hash is stored; compared with `hash_equals()`; a token is used once and replaced; a wrong token deletes all tokens of that user. | `auth.php` |
| Access control | Admin pages and APIs check the role on the server (401 / 403). Protected `.html` files cannot be opened directly (`.htaccess`); PHP serves them after the check. Menu links are filtered on the server. | `auth.php`, `*.htaccess`, `menu.php` |
| Event registration | Uses the logged-in student, never a Student ID typed by the user. | `register_event.php` |
| File upload | Poster: extension whitelist, real MIME type (`finfo`), `getimagesize()`, 2 MB limit, random file name, no scripts can run in the upload folder. | `events_api.php`, `uploads/posters/.htaccess` |
| XSS | Server strips tags from input; the JavaScript inserts text with `textContent` or an escape function. | `process.php`, `js/*.js` |
| CSRF | Cookies are `SameSite=Lax`; the JSON API needs `Content-Type: application/json`, which other websites cannot send without a CORS permission. | `auth.php`, `api/events.php` |
| Files and folders | `mysql/`, `docs/`, `tools/`, `deploy/`, `php/data/`, `config.php`, `auth.php`, `db.php` are blocked from the browser; directory listing is off; security headers are set. | `.htaccess` files |
| Secrets | Database settings are in `php/config.php`, which is not uploaded to GitHub. | `.gitignore` |

## Known limits (be honest in the report)
- XAMPP runs on plain HTTP. On a real server use HTTPS (the session cookie then also gets the `Secure` flag automatically).
- The XAMPP MySQL `root` user has no password. Create a separate database user for a real server.
- The demo accounts and the demo password are public: change or delete them before real use.
- The registration form still keeps a JSON copy of each registration (with the password **hash**) in `php/data/`; this folder is blocked from the browser.
- The brute-force limit is kept in the session, so it slows a normal user but would not stop an automated attacker; a real site should also limit by IP address.
- `tools/verify.py` checks structure and rules; it cannot replace a full security test.
