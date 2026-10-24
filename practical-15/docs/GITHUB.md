# Submit the project on GitHub

I could not create or push a repository for you. Do these steps once on your computer.

## 1. Create the repository
1. Sign in at https://github.com → **New repository**.
2. Name: `studenthub-portal` (any name is fine). Keep it **Public** (or give your teacher access).
3. Do **not** add a README, .gitignore or licence (the project already has them). Click **Create repository**.

## 2. Push the project
Open a terminal in the project folder (the one that contains `html-css`, `php`, `js`, `json`, `mysql`):

```bash
git init
git branch -M main
git add .
git status          # check: php/config.php must NOT be in the list (it is ignored)
git commit -m "StudentHub portal - final integrated version"
git remote add origin https://github.com/<your-username>/studenthub-portal.git
git push -u origin main
```

If Git asks who you are:
```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```
GitHub no longer accepts account passwords on the command line: use a **personal access token**
(GitHub → Settings → Developer settings → Personal access tokens) or GitHub Desktop.

## 3. Make the repository look good
- `README.md` is the front page. Add 3–4 screenshots from the `screenshots` folder.
- Add a tag for the submission: `git tag v1.0 && git push origin v1.0`.
- Optional: one commit per practical (7, 8, 10 … 15) shows your progress.

## 4. Submit
Copy the repository link (`https://github.com/<your-username>/studenthub-portal`) and submit it
together with the zip, the screenshots and the filled `docs/TESTING.md`.

## What is (not) uploaded
| Uploaded | Not uploaded (see `.gitignore`) |
|---|---|
| all code, `mysql/studenthub.sql`, sample posters, docs | `php/config.php` (database password), data files in `php/data/`, posters uploaded while testing |
