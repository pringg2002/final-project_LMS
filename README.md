# Learning Module Management System (LMS)

The LMS provides role-based learning management, course enrollment, lessons, assessments, submissions, discussions, notifications and **adaptive learning progression**.


## Technology and architecture

- Frontend: HTML, CSS, browser JavaScript and `fetch`.
- Backend: Node.js, Express, REST/JSON, middleware, controllers, services and models.
- Database: MySQL via `mysql2`; authentication uses `bcryptjs` and JSON Web Tokens.
- Flow: browser → `/api` routes → auth/role middleware → controllers → services → models → MySQL → JSON response.

## Core functionality

- Admin/instructor/student authentication and role-aware screens.
- Course/module management, prerequisite rules and enrollments.
- Published lessons, resources and lesson completion tracking.
- Quizzes, questions, attempts, automatic scoring and answer storage.
- Assignment submissions, discussion threads, replies and announcements.
- Instructor manual module unlocks and notifications.
- Profile and password management screens.

## Repository layout

```text
 database/            schema.sql, seed.sql, sampleData.sql, password_management.sql
 public/              HTML pages, css/style.css, js/*.js
 src/server.js         Express setup and HTTP server
 src/db.js             MySQL connection pool
 src/routes/           API route declarations
 src/middleware/       authentication, roles, error handling
 src/controllers/      HTTP handlers
 src/services/         business rules
 src/models/           SQL/database operations
 src/lib/              config, password, tokens, validation, mastery/grading
 src/utils/            response helpers and diagnostics
```

## Member ownership (from the assigned guides)

| Member | Responsibility | Tables | Join report |
|---|---|---|---|
| April | Core, authentication, users, notifications, manual unlocks | `roles, users, notifications, module_unlocks` | Student Roles (INNER JOIN) |
| Louise | Courses, modules, prerequisites, mastery rules | `courses, modules, module_prerequisites` | Course Modules (INNER JOIN) |
| Mark | Lessons, resources, learning progress | `lessons, lesson_resources, lesson_progress` | Lessons Without Resources (LEFT JOIN) |
| Zschem | Quizzes, questions, attempts, grading | `quizzes, questions, attempts` | Quiz Questions (INNER JOIN) |
| George | Assignments, submissions, discussions, replies | `assignments, submissions, discussions, discussion_replies` | Assignments Without Submissions (LEFT JOIN) |
| Jhonmar | Enrollments, attempt answers, announcements, reporting | `enrollments, attempt_answers, announcements` | Enrollment / Activity (FULL OUTER equivalent) |

The member guides describe a proposed ownership split; confirm actual Git contributions and record any deviations. The repository schema defines **20 tables** including `module_unlocks`, while the original group guide described 19 before that addition.

## Adaptive learning progression

A module is mastered when the student completes **100% of published lessons** and achieves **at least 75% on the latest graded quiz**, subject to prerequisite/enrollment checks. The next module stays locked at 74% and unlocks at 75% if all other conditions are satisfied. Authorized instructor overrides are stored in `module_unlocks` with a reason; do not confuse a manual unlock with automatic mastery.

## API conventions

Base URL: `http://localhost:3000/api`. Except `/api/health`, `/api/auth/register` and `/api/auth/login`, protected requests use `Authorization: Bearer <token>`. `GET` reads, `POST` creates/actions, `PUT` updates, `DELETE` removes. Expected statuses include 200, 201, 400, 401, 403, 404 and 500; inspect actual handlers for precise cases.

### Routes

**mounted routes** in `src/routes/index.js`

#### adaptive

| Method | Route |
|---|---|
| `GET` | `/api/modules/:id/access` |
| `GET` | `/api/courses/:courseId/progress` |
| `GET` | `/api/modules/:moduleId/unlock-candidates` |
| `GET` | `/api/modules/:moduleId/unlocks` |
| `POST` | `/api/modules/:moduleId/unlocks` |
| `DELETE` | `/api/modules/:moduleId/unlocks/:studentId` |

#### answer

| Method | Route |
|---|---|
| `GET` | `/api/attempts/:attemptId/answers` |
| `POST` | `/api/attempts/:attemptId/answers` |
| `PUT` | `/api/answers/:id` |

#### assignment

| Method | Route |
|---|---|
| `GET` | `/api/modules/:moduleId/assignments` |
| `POST` | `/api/modules/:moduleId/assignments` |
| `GET` | `/api/assignments/:id` |
| `PUT` | `/api/assignments/:id` |
| `DELETE` | `/api/assignments/:id` |
| `GET` | `/api/assignments/:assignmentId/submissions` |
| `POST` | `/api/assignments/:assignmentId/submissions` |
| `GET` | `/api/submissions/:id` |
| `PUT` | `/api/submissions/:id` |
| `DELETE` | `/api/submissions/:id` |

#### auth

| Method | Route |
|---|---|
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/login` |
| `GET` | `/api/auth/me` |
| `POST` | `/api/auth/change-password` |

#### course

| Method | Route |
|---|---|
| `GET` | `/api/courses` |
| `GET` | `/api/courses/:id` |
| `POST` | `/api/courses` |
| `PUT` | `/api/courses/:id` |
| `DELETE` | `/api/courses/:id` |
| `GET` | `/api/courses/:id/classmates` |
| `GET` | `/api/courses/:courseId/modules` |
| `POST` | `/api/courses/:courseId/modules` |

#### discussion

| Method | Route |
|---|---|
| `GET` | `/api/modules/:moduleId/discussions` |
| `POST` | `/api/modules/:moduleId/discussions` |
| `GET` | `/api/discussions/:id` |
| `PUT` | `/api/discussions/:id` |
| `DELETE` | `/api/discussions/:id` |
| `GET` | `/api/discussions/:discussionId/replies` |
| `POST` | `/api/discussions/:discussionId/replies` |
| `PUT` | `/api/replies/:id` |
| `DELETE` | `/api/replies/:id` |

#### enrollments

| Method | Route |
|---|---|
| `GET` | `/api/enrollments` |
| `GET` | `/api/enrollments/:id` |
| `POST` | `/api/enrollments` |
| `PUT` | `/api/enrollments/:id` |
| `DELETE` | `/api/enrollments/:id` |
| `GET` | `/api/courses/:courseId/announcements` |
| `POST` | `/api/courses/:courseId/announcements` |
| `GET` | `/api/announcements/:id` |
| `PUT` | `/api/announcements/:id` |
| `DELETE` | `/api/announcements/:id` |

#### lesson

| Method | Route |
|---|---|
| `GET` | `/api/modules/:moduleId/lessons` |
| `POST` | `/api/modules/:moduleId/lessons` |
| `GET` | `/api/lessons/:id` |
| `PUT` | `/api/lessons/:id` |
| `DELETE` | `/api/lessons/:id` |
| `GET` | `/api/lessons/:lessonId/resources` |
| `POST` | `/api/lessons/:lessonId/resources` |
| `PUT` | `/api/resources/:id` |
| `DELETE` | `/api/resources/:id` |
| `GET` | `/api/progress/me` |
| `GET` | `/api/lessons/:lessonId/progress` |
| `POST` | `/api/progress` |
| `PUT` | `/api/progress/:id` |

#### module

| Method | Route |
|---|---|
| `GET` | `/api/modules/:id` |
| `PUT` | `/api/modules/:id` |
| `DELETE` | `/api/modules/:id` |
| `GET` | `/api/modules/:moduleId/prerequisites` |
| `POST` | `/api/modules/:moduleId/prerequisites` |
| `DELETE` | `/api/prerequisites/:id` |

#### notification

| Method | Route |
|---|---|
| `GET` | `/api/notifications/` |
| `PUT` | `/api/notifications/read-all` |
| `PUT` | `/api/notifications/:id/read` |
| `DELETE` | `/api/notifications/:id` |

#### quiz

| Method | Route |
|---|---|
| `GET` | `/api/modules/:moduleId/quizzes` |
| `POST` | `/api/modules/:moduleId/quizzes` |
| `GET` | `/api/quizzes/:id` |
| `PUT` | `/api/quizzes/:id` |
| `DELETE` | `/api/quizzes/:id` |
| `GET` | `/api/quizzes/:quizId/questions` |
| `POST` | `/api/quizzes/:quizId/questions` |
| `GET` | `/api/questions/:id` |
| `PUT` | `/api/questions/:id` |
| `DELETE` | `/api/questions/:id` |
| `GET` | `/api/quizzes/:quizId/attempts` |
| `POST` | `/api/quizzes/:quizId/attempts` |
| `GET` | `/api/attempts/:id` |
| `POST` | `/api/attempts/:id/submit` |

#### report

| Method | Route |
|---|---|
| `GET` | `/api/reports/student-roles` |
| `GET` | `/api/reports/course-modules` |
| `GET` | `/api/reports/lessons-without-resources` |
| `GET` | `/api/reports/quiz-questions` |
| `GET` | `/api/reports/assignments-without-submissions` |
| `GET` | `/api/reports/enrollment-activity` |

#### user

| Method | Route |
|---|---|
| `GET` | `/api/users/` |
| `GET` | `/api/users/students` |
| `POST` | `/api/users/` |
| `GET` | `/api/users/:id` |
| `PUT` | `/api/users/:id` |
| `POST` | `/api/users/:id/reset-password` |
| `DELETE` | `/api/users/:id` |

### Health

`GET /api/health` — responds with the message “Learning Module API is running”.

## SQL join reports

| Report | SQL strategy | Purpose |
|---|---|---|
| Student Roles | INNER JOIN | `/api/reports/student-roles` |
| Course Modules | INNER JOIN | `/api/reports/course-modules` |
| Lessons Without Resources | LEFT JOIN | `/api/reports/lessons-without-resources` |
| Quiz Questions | INNER JOIN | `/api/reports/quiz-questions` |
| Assignments Without Submissions | LEFT JOIN | `/api/reports/assignments-without-submissions` |
| Enrollment / Activity | FULL OUTER equivalent | `/api/reports/enrollment-activity` |


## Database

The repository's `database/schema.sql` defines these tables:

`roles`, `users`, `courses`, `modules`, `lessons`, `enrollments`, `quizzes`, `questions`, `attempts`, `lesson_progress`, `announcements`, `lesson_resources`, `attempt_answers`, `assignments`, `submissions`, `discussions`, `discussion_replies`, `module_prerequisites`, `notifications`, `module_unlocks`.

Study primary keys, foreign keys, unique constraints, cascading deletes and restricted deletes. Foreign keys maintain referential integrity; a unique `(student_id, course_id)` prevents duplicate enrollment when present.
