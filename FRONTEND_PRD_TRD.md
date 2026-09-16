# landlweb — Frontend PRD + TRD
**Backend:** `../learnandlearn` (Fastify API :4000, Postgres :5432, Redis :6379 — all verified working 2026-09-13)
**Frontend:** this folder `landlweb/` (Next.js 16.3.5 + React 19 + Tailwind 4, `src/` dir). Backend is NOT touched from here.
**Docs source of truth:** `../learnandlearn/docs/next-steps.md`, `STACK_V3_FROZEN.md`, `postman/*.json`, `api.http` (28+36 requests).

---

# PART A — PRD (Product Requirements)

## 1. Goal
Build a Coursera-style learning website + student portal + admin studio that reads/writes ONLY the real production API. No hardcoded courses, batches, progress. Visitor discovery is public; learning is gated by `enrollment.state='active' AND access_expires_at > now()` (2-year access, decoupled from batch end).

## 2. Non-goals (explicitly out of scope)
- Payments/checkout (batch has `tuition_amount_minor/currency` for display only; enrollment stays manual admin `POST /admin/batches/:id/enrollments`).
- Compiler execution / submissions queue (only question metadata + samples; `feature_flags {compiler_v1:true, contests/certificates/leaderboards:false}`).
- Mentor/support tickets, certificates, leaderboards (V2).
- Video hosting (use `meeting_url/recording_url` links, Zoho now, provider-agnostic).

## 3. Personas & roles (from `roles` table)
- **Visitor** (no session): can view landing, catalog, course detail. Cannot see curriculum/progress.
- **Student** (`roles:[student]`): register/login, view own enrollments, curriculum, lessons, live upcoming, recordings, announcements, progress, attendance, Q&A links.
- **Admin** (`roles:[student,admin]` via `npm run admin:grant -- email` in backend + re-login): everything student can + create/publish courses, batches, enroll students, author modules/lessons/resources/prerequisites, classes, questions, announcements, patch recordings.

## 4. Backend API inventory (all verified 2026-09-13, use exactly these — superseded by FRONTEND_BUILD_SPEC.md §0 REAL shapes)
Health: `GET /health/live → {status}`, `GET /health/ready → {status, dependencies:{database,redis}}`.
Auth: `POST /api/v1/auth/register 201/409`, `POST /api/v1/auth/login 200/401`, `GET /api/v1/auth/me → {user:{id,email,fullName,roles}} 200/401`, `POST /api/v1/auth/logout 204`. Cookie: `learnandlearn_session`, httpOnly, `SameSite=lax`, `credentials:include` required.
Admin catalog: `POST /api/v1/admin/courses {slug,title,description,level,status,learningOutcomes?} 201/409/400`, `GET /api/v1/admin/courses → {courses} 200`, `POST /api/v1/admin/courses/:id/publish 200/404`, `POST /api/v1/admin/batches {courseId,code,name,startAt,endAt,capacity,timezone,status} 201/404/409`, `POST /api/v1/admin/batches/:id/enrollments {userId,state} 201/404/409` (capacity + `SELECT FOR UPDATE`).
Public: `GET /api/v1/catalog/courses → {courses:[{id,slug,title,subtitle,description,level,estimatedDurationHours,coverImageUrl,learningOutcomes,publishedAt,openBatchCount}]} 200` (only published + open batches in window), `GET /api/v1/catalog/courses/:slug → {course,batches:[{id,code,name,startAt,endAt,capacity,timezone,tuitionAmountMinor,currency,enrollmentOpensAt,enrollmentClosesAt,reservedSeats,availableSeats}]} 200/404`. Batch uses `name/startAt/endAt` (NOT title/startsAt). Course uses `estimatedDurationHours` (NOT durationWeeks).
Curriculum admin: `POST /admin/courses/:id/modules {sequence,title,description?} 201/409`, `POST /admin/modules/:id/publish 200/404`, `POST /admin/modules/:id/lessons {sequence,title,type,durationSeconds?} 201/409`, `POST /admin/lessons/:id/publish 200/409 (MODULE_NOT_PUBLISHED)`, `POST /admin/lessons/:id/resources {sequence,title,resourceUrl,contentType}`, `POST /admin/lessons/:id/prerequisites {prerequisiteLessonId}`, `GET /admin/courses/:id/curriculum 200/404`.
Curriculum student: `GET /me/curriculum → {curriculum:[{enrollmentId,course:{id,slug,title},modules:[{id,sequence,title,description,lessons:[{id,sequence,title,description,type,durationSeconds,watchedSeconds,completedAt,locked}]}]}]} 200`, `GET /me/lessons/:id → {lesson:{enrollmentId,id,title,description,type,videoProviderId,durationSeconds,watchedSeconds,completedAt,locked,resources:[{id,sequence,title,resourceUrl,contentType}]}} 200/403 LESSON_UNAVAILABLE/LESSON_LOCKED`, `POST /me/lessons/:id/progress {watchedSeconds} → {progress} 200`, `POST /me/lessons/:id/complete → {progress} 200`.
Enrollments: `GET /me/enrollments → {enrollments:[{id,state,activatedAt,accessExpiresAt,batchId,batchCode,batchName,batchStartAt,batchEndAt,courseId,courseSlug,courseTitle}]} 200`.
Live/practice admin: `POST /admin/batches/:id/classes {title,provider,meetingUrl?,scheduledAt,endsAt,status} 201`, `POST /admin/batches/:id/quick-class {topicTitle,classTitle,provider,scheduledAt,endsAt,questions:[{slug,title,externalUrl?}]} 201` (topic+lesson+class+questions tx), `POST /admin/questions {slug,title,topic,difficulty,externalUrl?,status} 201/409`, `POST /admin/lessons/:id/questions {questionId,sequence} 201`, `PATCH /admin/classes/:id {recordingUrl?,status?} 200` (recordingUrl/status), `POST /admin/announcements {batchId?,courseId?,title,body} 201`, `POST /admin/questions/:qid/versions {statement,...}`, `POST /admin/versions/:vid/testcases`.
Live student: `GET /me/live/upcoming → {live:[{id,title,provider,meetingUrl,scheduledAt,endsAt,status,batchName,courseTitle}]} 200`, `GET /me/recordings → {recordings:[{classId,title,recordingUrl,scheduledAt,batchName,accessExpiresAt}]} 200` (only ended+recording_url+not revoked), `GET /me/lessons/:id/questions → {questions:[{id,slug,title,topic,difficulty,externalUrl,sequence}]} 200`, `POST /me/classes/:id/attendance → {attended:true} 201`, `GET /me/announcements → {announcements:[{id,title,body,publishedAt}]} 200`, `GET /me/questions/:qid → {question,samples:[{id,stdin,expected}]} 200 (samples only)`, `GET /me/progress → {progress:[{topic,totalLessons,completedLessons,attendedLives}]} 200`.

Known backend bugs found & fixed during verification (do NOT regress): (1) `courses.status $9` needed `$9::course_status` + `$9::text` (was 42P08), (2) `learning_outcomes` must `JSON.stringify([])` not raw JS array (was 23514 `courses_learning_outcomes_check`), (3) lesson publish `COALESCE(published_at)` ambiguous → `lesson.published_at` (was 42702).

## 5. Pages & acceptance criteria
### 5.1 `/` Landing (public, ISR)
Hero + value prop + featured courses (first 3 from `catalog/courses`) + CTA login/catalog. AC: no session required; loads <2s; failed API shows retry, not blank.
### 5.2 `/catalog` (public, ISR + client filter)
Grid from `GET catalog/courses`; search by title, filter level. Card: title, level, duration, openBatchCount. AC: draft/archived never appear (backend guarantees; UI must not fake).
### 5.3 `/catalog/[slug]` (public, ISR)
Detail from `GET catalog/courses/:slug`: outcomes, batches table (dates, price `tuition_amount_minor/100 + currency`, `availableSeats`), “Request enrollment” placeholder (no checkout). AC: 404 slug → friendly not-found; enrollment window respected.
### 5.4 `/login`, `/register` (public, client)
Forms → `api.login/register` → push `/dashboard` on success. Errors: 401 invalid, 409 email exists, 400 validation (show `fields`). AC: never store token in localStorage; cookie only.
### 5.5 `/dashboard` (student server-guarded)
Needs session; else redirect `/login`. Shows: active batch (`me/enrollments`), next lesson (`me/curriculum` first unlocked), completion (`me/progress`), announcements preview (3). AC: no enrollment → empty state “access pending, contact admin”; matches API exactly.
### 5.6 `/curriculum` (student)
Modules → lessons with lock icon (`locked`), duration, completed check. From `me/curriculum`. AC: draft lessons invisible; locked needs prerequisite message.
### 5.7 `/lessons/[id]` (student)
`GET me/lessons/:id` → video/description + resources + questions links; buttons Save progress + Mark complete; 403 LOCKED/UNAVAILABLE → explain + back link. AC: progress persists after refresh (verified via curriculum `watchedSeconds/completedAt`).
### 5.8 `/live`, `/recordings`, `/announcements`, `/progress` (student)
Direct maps to APIs above. Live: Join button → `meetingUrl` new tab + fire `attendance` POST once. Recordings: only after admin ends class + sets recordingUrl. Progress: per-topic bars.
### 5.9 `/admin` studio (admin-guarded, check `me.roles includes admin` else 403 page)
Tabs: Courses (create/publish/list), Batches (create), Enrollments (enroll by userId), Curriculum (module/lesson/resource/prerequisite + publish), Live (class/quick-class/patch), Questions (create/link + versions/testcases data), Announcements. AC: 403 for pure student; 409 duplicate shows message (slug/code/sequence); every mutation refreshes list.
### 5.10 Global states
Every page implements loading skeleton, error + retry, empty, 401 → login redirect, 403 → “no permission” (not blank). Keyboard accessible, responsive mobile-first.

## 6. Milestones & DoD
M1 Auth + guard (login/register/dashboard/logout) — DoD: login as vinay@example.com works, logout revokes (`me`→401).
M2 Public (landing/catalog/detail) — DoD: published course from backend appears, draft does not.
M3 Student learn loop (curriculum/lesson/progress/attendance) — DoD: complete lesson → progress increments; attendance → attendedLives 0→1 (verified via API 2026-09-13).
M4 Admin studio + live/questions/announcements — DoD: full flow course→batch→enroll→module→lesson→publish→class→attendance without Postman.
DoD global: `npm run build` passes, no hardcoded data, all errors show `{code,message}` from API.

---

# PART B — TRD (Technical Requirements)

## 7. Stack (frozen)
Next.js 16.3.5 App Router + TS + Tailwind 4 + ESLint, `src/` dir, `@/*` alias (already scaffolded). No extra UI lib for M1–M2 (plain Tailwind). Node 20+. Backend base URL via `NEXT_PUBLIC_API_URL` (dev `http://localhost:4000`, prod `https://api.<domain>`).

## 8. Architecture
```
landlweb/src/
  lib/api.ts            // typed fetch wrapper, credentials:include, throws {status,body}
  lib/types.ts          // mirror backend contracts (User, Course, Batch, Module, Lesson, Class, Question)
  app/
    page.tsx            // landing (ISR)
    catalog/page.tsx + [slug]/page.tsx
    login/page.tsx + register/page.tsx  // 'use client'
    dashboard/page.tsx  // server, cookies() forward
    curriculum/page.tsx + lessons/[id]/page.tsx
    live/page.tsx + recordings/page.tsx + announcements/page.tsx + progress/page.tsx
    admin/page.tsx + ...tabs (client, role check)
    layout.tsx
  components/ (CourseCard, BatchTable, ModuleList, LessonRow, Guard, Empty, ErrorBox)
  middleware.ts         // redirect /dashboard,/curriculum,/admin when no session cookie
```
Server components for reads with `cookies().toString()` forwarded + `cache:'no-store'` for auth data; ISR (`revalidate:60`) only for public catalog. Client components only for forms/mutations. No Redux — server data + `router.refresh()` after mutations.

## 9. Auth & CORS (critical)
Backend cookie `learnandlearn_session` httpOnly → JS never reads it. Browser must send it: all `fetch` with `credentials:'include'`. Backend `.env` `WEB_ORIGIN=http://localhost:4028` (currently `:4080` — change + restart `dev:api`), `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS=30`. Prod: `WEB_ORIGIN=https://<web-domain>`, `NODE_ENV=production` (secure cookies), `API` CORS `origin=WEB_ORIGIN, credentials:true`. Middleware: if `cookies().get(SESSION)` missing → redirect login; role check happens server-side via `GET /auth/me` (roles array), not client guess.

## 10. API client pattern
```ts
// lib/api.ts — already created
fetch(`${BASE}${path}`, { credentials:'include', headers:{'Content-Type':'application/json'} })
```
Map status: 401→login, 403→NoPermission (distinguish student vs admin), 404→NotFound, 409→show `code` (COURSE_SLUG_EXISTS/BATCH_CODE_EXISTS/ENROLLMENT_EXISTS/MODULE_SEQUENCE_EXISTS), 400→render `fields`, 500→retry + log `requestId` if present. Never swallow errors. IDs (`courseId/batchId/moduleId/lessonId/classId/questionId`) come from previous responses — no `PASTE_*` in UI; store in URL params/state.

## 11. Env & run
`landlweb/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`. Run: terminal1 `learnandlearn/npm run dev:api` (:4000), terminal2 `landlweb/npm run dev` (:4028). Build: `npm run build` must pass; typecheck via `tsc --noEmit`; lint `npm run lint`. No Docker needed in frontend.

## 12. Testing (no automated suite yet — manual contract)
Mirror `../learnandlearn/api.http` (36 reqs) in browser: register→login→me→create course→publish→batch→enroll→module→publish→lesson→publish→curriculum→progress→class→attendance→question→announcement. Verified IDs 2026-09-13 (course `57b792...`, batch `cd9be9...`, lesson `5b2fc9...`, class `347f41...`) prove contract. Add Playwright later for login→complete→progress E2E.

## 13. Deployment
Web: Vercel (root `landlweb/`, env `NEXT_PUBLIC_API_URL=https://api.<domain>`). API: Render/Railway/Fly (`npm install → db:migrate → build → start`, env `DATABASE_URL` Neon/Supabase, `REDIS_URL` Upstash, `WEB_ORIGIN=https://<web-domain>`). No `docker compose` in prod.

## 14. Risks
CORS/cookie miss (wrong WEB_ORIGIN) → auth looks broken; enum/JSONB backend quirks already fixed — keep `JSON.stringify` for arrays; cursor pagination/limits later for 1000 users (currently full lists OK); Razorpay/compiler deferred.

Build order: M1 → M2 → M3 → M4. Start M1 now with existing `login/dashboard` files.
