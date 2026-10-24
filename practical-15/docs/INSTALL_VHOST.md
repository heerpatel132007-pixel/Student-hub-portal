# Install StudentHub on XAMPP with an Apache virtual host

Works on macOS and Windows XAMPP. Paths for both are shown.

| | macOS | Windows |
|---|---|---|
| XAMPP folder | `/Applications/XAMPP/xamppfiles` | `C:\xampp` |
| Web folder (htdocs) | `/Applications/XAMPP/xamppfiles/htdocs` | `C:\xampp\htdocs` |
| `httpd.conf` | `…/xamppfiles/etc/httpd.conf` | `C:\xampp\apache\conf\httpd.conf` |
| `httpd-vhosts.conf` | `…/xamppfiles/etc/extra/httpd-vhosts.conf` | `C:\xampp\apache\conf\extra\httpd-vhosts.conf` |
| hosts file | `/etc/hosts` | `C:\Windows\System32\drivers\etc\hosts` |

## 1. Copy the project
Copy the project folder to htdocs and name it **studenthub**
(`…/htdocs/studenthub/html-css`, `…/htdocs/studenthub/php`, …).

## 2. Start XAMPP
Open the XAMPP control panel and start **Apache** and **MySQL**.

## 3. Create the database
1. Open `http://localhost/phpmyadmin`.
2. **Import** → choose `mysql/studenthub.sql` → **Go**.
3. The database `studenthub` appears with 5 tables: `students`, `events`, `registrations`, `remember_tokens`, `contact_messages`.

If your MySQL root user has a password, copy `php/config.example.php` to `php/config.php` and change `pass`.
(A ready `php/config.php` with the XAMPP defaults is already in the zip.)

## 4. Turn on virtual hosts
In `httpd.conf` make sure this line is **not** commented (no `#` in front):

```
Include etc/extra/httpd-vhosts.conf        # Windows: Include conf/extra/httpd-vhosts.conf
```

Also check that these modules are loaded (they are by default in XAMPP): `mod_rewrite`, `mod_headers`, `mod_authz_core`.

## 5. Add the virtual host
Open `deploy/studenthub.vhost.conf`, choose the lines for your system (macOS or Windows),
and paste it at the end of `httpd-vhosts.conf`.
The first block keeps `http://localhost` working; the second block is StudentHub.
`AllowOverride All` is required, because the `.htaccess` files protect the portal.

## 6. Add the host name
Add this line to the hosts file (macOS: `sudo nano /etc/hosts`, Windows: open Notepad **as administrator**):

```
127.0.0.1   studenthub.local
```

## 7. Restart Apache and open the portal
Restart Apache in the XAMPP control panel, then open **http://studenthub.local/**.
It opens the home page (`html-css/index.html`).

Demo logins (change them before real use):

| Role | Login | Password |
|---|---|---|
| Admin | `admin@studenthub.edu` | `Admin@1234` |
| Student | `heer.patel@example.com` (or `ST1011`) | `Student@123` |

## 8. Check the installation
```
python3 tools/verify.py          # files, links, JavaScript, security rules
php -l php/login.php             # PHP syntax (php is in the XAMPP bin folder), repeat for other files
```
Then follow `docs/TESTING.md`.

## Troubleshooting
| Problem | Fix |
|---|---|
| `studenthub.local` does not open | Check the hosts line, restart the browser, check `Include …httpd-vhosts.conf` is active, restart Apache. |
| 403 Forbidden on every page | In the `<Directory>` block use `Require all granted`; the folder must be inside htdocs or be allowed. |
| Protected pages open directly (no 403) | `AllowOverride All` is missing, so `.htaccess` is ignored. |
| "Database connection failed" | MySQL not started, database not imported, or wrong password in `php/config.php`. |
| Poster upload fails (macOS) | `chmod -R 775 uploads php/data` and make sure Apache's user (`daemon`) can write there. |
| Session ends immediately | Browser blocks cookies for `.local` names? Try `http://localhost/studenthub/html-css/login.html` instead. |
| Upload says "too large" for a small file | Check `upload_max_filesize` and `post_max_size` in `php.ini` (must be at least 2M). |
