# Learning Management System for College of Industrial Technology

A responsive front-end MVP for the College of Industrial Technology learning hub.

## Included in this version

- Student dashboard overview with approved classrooms only
- Single account/password sign-in with role detection from `dbo.Users`
- Role-specific workspaces for students, instructors, deans, and admins
- Students see classroom modules only after an instructor accepts their join request
- Instructors can create classrooms, review join requests, and accept students
- Classroom memberships and request status are stored in SQL Server
- Dean/admin overview metrics and assignment/grade management remain sample content
- Course progress cards
- Upcoming tasks and task filter
- Announcements panel
- Daily schedule
- Grades, calendar, messages, and course navigation placeholders
- Responsive layout for desktop and mobile screens
- CIT Learning Arc landing experience for Computer Industrial Technology

## Run

Open `index.html` directly in a browser to view the app. Login uses the local SQL Server API and defaults to the `LMS_DB` database on `SQLEXPRESS02` with Windows Authentication.

Create the classroom and membership tables once, then start the API:

```powershell
sqlcmd -S '.\SQLEXPRESS02' -E -d LMS_DB -i classroom-schema.sql
npm start
```

The migration is additive and keeps existing users. Do not run a script containing `DROP TABLE Users` after applying it; that would delete accounts and conflict with the classroom foreign keys. To use a different SQL Server instance or database, set `DB_SERVER` and `DB_NAME` before running `npm start`. The Windows account running Node needs permission to read `dbo.Users` and create/read/update the classroom tables.

## Suggested next modules

- Secure authentication and role-specific workspaces
- Student, instructor, and administrator accounts
- Course/module/lesson management
- Syllabus PDF download
- Assignment submission and grading
- Attendance and class schedules
- Announcements and private messaging
- Database-backed API

## GitHub Publishing

The `.gitignore` excludes dependency folders, environment files, SQL Server data files, backups, and ZIP archives. Do not force-add database backups or files containing real account data or passwords. The classroom schema is safe to share; user records are not.

GitHub Pages can host the static interface, but it cannot run this Node.js API or SQL Server. Login and classroom requests need a separately hosted API and database. The current API uses plain-text password comparison and permissive CORS, so use only test data and do not expose it publicly until authentication and deployment security are hardened.

To upload the source, first create an empty **private** repository on GitHub. Do not initialize it with a README, license, or `.gitignore`. Then run these commands from this project folder, replacing the URL with your repository URL:

```powershell
git add .
git status --short
git commit -m "Initial LMS project"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Before committing, confirm that `git status --short` does not list backups, `.env` files, or personal database data. Publishing the source does not publish or host the SQL Server database or API.
