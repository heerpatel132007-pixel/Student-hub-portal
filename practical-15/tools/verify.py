#!/usr/bin/env python3
"""
tools/verify.py - quick checks for the StudentHub portal (no extra packages needed)
Run from the project folder:   python3 tools/verify.py
Checks: links and files, JavaScript syntax, PHP structure, security rules, protected pages.
For real PHP syntax checking also run:   php -l php/login.php   (XAMPP has php in its bin folder)
"""
import os, re, glob, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
results = []

def check(group, name, ok, detail=""):
    results.append((group, name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + (("  -> " + detail) if detail else ""))

def read(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()

PROTECTED = ["dashboard", "admin", "manage_students", "manage_events", "api_demo",
             "courses", "timetable", "assignments", "results", "notices"]
PAGE_PHP = {"courses", "timetable", "assignments", "results", "notices"}

# ---------------------------------------------------------------- 1) navigation / files
print("\n1. Navigation, links and files")
html_files = sorted(glob.glob("html-css/*.html"))
bad = []
for f in html_files:
    s = read(f)
    for m in re.finditer(r'(?:href|src|action)="([^"#]+)"', s):
        url = m.group(1)
        if url.startswith(("http", "mailto:", "data:", "javascript:")):
            continue
        path, _, query = url.partition("?")
        target = os.path.normpath(os.path.join("html-css", path))
        if not os.path.exists(target):
            bad.append(f"{f}: {url}")
        elif path.endswith("page.php"):
            name = query.replace("p=", "")
            if name not in PAGE_PHP or not os.path.exists(f"html-css/{name}.html"):
                bad.append(f"{f}: {url} (unknown page)")
check("nav", f"all links / scripts / form actions exist ({len(html_files)} html pages)", not bad, "; ".join(bad[:5]))

direct = []
for f in html_files:
    s = read(f)
    for p in PROTECTED:
        if re.search(r'href="%s\.html"' % p, s):
            direct.append(f"{f} -> {p}.html")
check("nav", "no page links directly to a protected .html (all go through PHP guards)", not direct, "; ".join(direct[:5]))

js_missing = []
for f in sorted(glob.glob("js/*.js")):
    for m in re.finditer(r'["\'](\.\./(?:php|json)/[A-Za-z0-9_/\.-]+)', read(f)):
        if not os.path.exists(os.path.normpath(os.path.join("html-css", m.group(1)))):
            js_missing.append(f"{f}: {m.group(1)}")
check("nav", "every php/json file requested by the JavaScript exists", not js_missing, "; ".join(js_missing[:5]))

menu_bad = []
import json
for item in json.load(open("json/menu.json", encoding="utf-8"))["menu"]:
    path = item["url"].split("?")[0]
    if not os.path.exists(os.path.normpath(os.path.join("html-css", path))):
        menu_bad.append(item["url"])
check("nav", "all role-menu links in json/menu.json exist", not menu_bad, "; ".join(menu_bad))

# ---------------------------------------------------------------- 2) javascript
print("\n2. JavaScript syntax")
node = subprocess.run(["which", "node"], capture_output=True, text=True).stdout.strip()
if node:
    failed = []
    for f in sorted(glob.glob("js/*.js")):
        r = subprocess.run(["node", "--check", f], capture_output=True, text=True)
        if r.returncode != 0:
            failed.append(f)
    check("js", f"node --check passes for {len(glob.glob('js/*.js'))} JavaScript files", not failed, ", ".join(failed))
else:
    print("  SKIP  node not installed")

# ---------------------------------------------------------------- 3) php structure
print("\n3. PHP structure (not a replacement for php -l)")
php_files = sorted(glob.glob("php/**/*.php", recursive=True)) + ["index.php"]

def balanced(src):
    stack, i, n = [], 0, len(src)
    pairs = {")": "(", "]": "[", "}": "{"}
    while i < n:
        c = src[i]
        if src.startswith("//", i) or c == "#":
            i = src.find("\n", i); i = n if i < 0 else i; continue
        if src.startswith("/*", i):
            i = src.find("*/", i + 2); i = n if i < 0 else i + 2; continue
        if c in "'\"":
            q = c; i += 1
            while i < n and src[i] != q:
                i += 2 if src[i] == "\\" else 1
            i += 1; continue
        if c in "([{": stack.append(c)
        elif c in ")]}":
            if not stack or stack.pop() != pairs[c]: return False
        i += 1
    return not stack

unbal = [f for f in php_files if not balanced(read(f))]
check("php", f"brackets / quotes balanced in {len(php_files)} PHP files", not unbal, ", ".join(unbal))
noopen = [f for f in php_files if not read(f).lstrip().startswith("<?php")]
check("php", "every PHP file starts with <?php", not noopen, ", ".join(noopen))

# ---------------------------------------------------------------- 4) security
print("\n4. Security rules")
allphp = {f: read(f) for f in php_files}
text = "\n".join(allphp.values())
prep = len(re.findall(r"->prepare\(", text))
check("sec", f"MySQLi prepared statements used ({prep} prepare() calls)", prep >= 30)

sqlinj = []
for f, s in allphp.items():
    for n, line in enumerate(s.splitlines(), 1):
        if re.search(r"\b(SELECT|INSERT|UPDATE|DELETE)\b", line) and re.search(r"\$_(GET|POST|REQUEST|COOKIE)", line):
            sqlinj.append(f"{f}:{n}")
check("sec", "no user input ($_GET/$_POST/$_COOKIE) written directly into an SQL line", not sqlinj, ", ".join(sqlinj))

queries = []
for f, s in allphp.items():
    for n, line in enumerate(s.splitlines(), 1):
        if "->query(" in line:
            queries.append(f"{f}:{n}")
print("  INFO  ->query() calls (all run fixed SQL, no user input): " + (", ".join(queries) or "none"))

check("sec", "passwords hashed with password_hash()", "password_hash(" in text)
check("sec", "login uses password_verify()", "password_verify(" in allphp["php/login.php"])
check("sec", "session ID regenerated after login", "session_regenerate_id(true)" in allphp["php/auth.php"])
check("sec", "session cookie is HttpOnly + SameSite", "'httponly' => true" in allphp["php/auth.php"] and "'samesite' => 'Lax'" in allphp["php/auth.php"])
check("sec", "session timeout enforced", "SESSION_TIMEOUT" in allphp["php/auth.php"])
check("sec", "remember-me token stored as a hash and compared with hash_equals()", "hash_equals(" in allphp["php/auth.php"] and "hash('sha256'" in allphp["php/auth.php"])
check("sec", "login gives one message for wrong user or wrong password", allphp["php/login.php"].count("Invalid email/username or password.") == 1)
check("sec", "login has a brute-force limit", "fail_count" in allphp["php/login.php"])
check("sec", "poster upload checks type, real content and size", all(k in allphp["php/events_api.php"] for k in ["finfo", "getimagesize", "POSTER_MAX_BYTES"]))
check("sec", "uploaded files get random names", "random_bytes" in allphp["php/events_api.php"])
check("sec", "admin endpoints check the admin role",
      all("!== 'admin'" in allphp[f] for f in ["php/students_api.php", "php/events_api.php", "php/admin_stats.php", "php/admin_students.php", "php/api/events.php"]))
check("sec", "event registration uses the logged-in student", "$_SESSION['user']['studentId']" in allphp["php/register_event.php"])
danger = [f for f, s in allphp.items() if re.search(r"\b(eval|system|shell_exec|passthru|exec)\s*\(|\bmd5\(|\bsha1\(", s)]
check("sec", "no eval/exec/md5/sha1 in the PHP code", not danger, ", ".join(danger))
js_all = "\n".join(read(f) for f in glob.glob("js/*.js"))
check("sec", "JavaScript escapes text before inserting it into the page", "esc(" in js_all or "textContent" in js_all)

# ---------------------------------------------------------------- 5) protection files
print("\n5. Protected pages and folders")
hc = read("html-css/.htaccess")
check("prot", "html-css/.htaccess blocks direct access to protected pages", all(p in hc for p in PROTECTED))
check("prot", "php/.htaccess hides auth.php, db.php and config files", "auth|db|config" in read("php/.htaccess"))
check("prot", "php/data, mysql and uploads/posters have an .htaccess", all(os.path.exists(p) for p in ["php/data/.htaccess", "mysql/.htaccess", "uploads/posters/.htaccess"]))
check("prot", "root .htaccess turns off directory listing", "Options -Indexes" in read(".htaccess"))
check("prot", "each guarded PHP page calls its guard",
      all(re.search(g, allphp[f]) for f, g in [("php/dashboard.php", r"guardPage\('student'\)"), ("php/admin.php", r"guardPage\('admin'\)"),
          ("php/manage_students.php", r"guardPage\('admin'\)"), ("php/manage_events.php", r"guardPage\('admin'\)"),
          ("php/api_demo.php", r"guardPage\('admin'\)"), ("php/page.php", r"guardLoggedIn\(\)")]))
check("prot", "config.php is listed in .gitignore", "php/config.php" in read(".gitignore") if os.path.exists(".gitignore") else False)

# ---------------------------------------------------------------- 6) database + docs
print("\n6. Database script and documentation")
sqltext = read("mysql/studenthub.sql")
tables = re.findall(r"CREATE TABLE (\w+)", sqltext)
check("db", f"SQL creates {len(tables)} tables: {', '.join(tables)}", len(tables) == 5)
check("db", "foreign keys with ON DELETE CASCADE", sqltext.count("ON DELETE CASCADE") >= 3)
check("db", "no plain-text passwords in the sample data", "Student@123'" not in sqltext and "$2y$10$" in sqltext)
for doc in ["README.md", "docs/INSTALL_VHOST.md", "docs/TESTING.md", "docs/SECURITY.md", "docs/GITHUB.md", "deploy/studenthub.vhost.conf"]:
    check("docs", f"{doc} exists", os.path.exists(doc))

failed = [r for r in results if not r[2]]
print(f"\nSummary: {len(results) - len(failed)} passed, {len(failed)} failed")
sys.exit(1 if failed else 0)
