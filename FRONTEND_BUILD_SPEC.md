# landlweb — End-to-End Frontend Build Spec (Build All At Once, Then Review)
**Backend base:** `http://localhost:4000` (prod: `https://api.<domain>`) — verified live 2026-09-13.
**Frontend root:** `landlweb/` (Next.js 16.3.5, React 19, Tailwind 4, `src/`). Do NOT touch `../learnandlearn`.
**How to use:** build every file below in order, run `npm run build`, manually click every route, then ask for review. No hardcoded data anywhere.

---

## 0. Global contracts (REAL shapes — use exactly these, not PRD guesses)
- `GET /health/live → {status}` ; `GET /health/ready → {status, dependencies:{database,redis}}`.
- Auth cookie `learnandlearn_session` httpOnly. All fetches `credentials:'include'`. 401→login, 403→NoPermission, 404→NotFound, 409→show `code`, 400→show `fields`.
- `GET /api/v1/auth/me → {user:{id,email,fullName,roles:string[]}}`. Roles include `student`, admin has `admin`.
- `GET /api/v1/catalog/courses → {courses:[{id,slug,title,subtitle,description,level,estimatedDurationHours,coverImageUrl,learningOutcomes:string[],publishedAt,openBatchCount}]}`.
- `GET /api/v1/catalog/courses/:slug → {course:{...same}, batches:[{id,code,name,startAt,endAt,capacity,timezone,tuitionAmountMinor,currency,enrollmentOpensAt,enrollmentClosesAt,reservedSeats,availableSeats}]}`. Batch uses `name/startAt/endAt` (NOT title/startsAt).
- `GET /api/v1/me/enrollments → {enrollments:[{id,state,activatedAt,accessExpiresAt,batchId,batchCode,batchName,batchStartAt,batchEndAt,courseId,courseSlug,courseTitle}]}`.
- `GET /api/v1/me/curriculum → {curriculum:[{enrollmentId,course:{id,slug,title},modules:[{id,sequence,title,description,lessons:[{id,sequence,title,description,type,durationSeconds,watchedSeconds,completedAt,locked}]}]}]}`.
- `GET /api/v1/me/lessons/:id → {lesson:{enrollmentId,id,title,description,type,videoProviderId,durationSeconds,watchedSeconds,completedAt,locked,resources:[{id,sequence,title,resourceUrl,contentType}]}}`. 403 `LESSON_UNAVAILABLE` / `LESSON_LOCKED`.
- `POST /api/v1/me/lessons/:id/progress {watchedSeconds:int} → {progress:{lessonId,watchedSeconds,completedAt,updatedAt}}`.
- `POST /api/v1/me/lessons/:id/complete → {progress:{...completedAt}}`.
- `GET /api/v1/me/live/upcoming → {live:[{id,title,provider,meetingUrl,scheduledAt,endsAt,status,batchName,courseTitle}]}`.
- `POST /api/v1/me/classes/:id/attendance → {attended:true} 201`.
- `GET /api/v1/me/recordings → {recordings:[{classId,title,recordingUrl,scheduledAt,batchName,accessExpiresAt}]}` (only ended + url + not revoked).
- `GET /api/v1/me/lessons/:id/questions → {questions:[{id,slug,title,topic,difficulty,externalUrl,sequence}]}`.
- `GET /api/v1/me/questions/:id → {question:{...version}, samples:[{id,stdin,expected}]}`.
- `GET /api/v1/me/announcements → {announcements:[{id,title,body,publishedAt}]}`.
- `GET /api/v1/me/progress → {progress:[{topic,totalLessons,completedLessons,attendedLives}]}`.
- Admin: `POST /api/v1/admin/courses {slug,title,description,level,status,learningOutcomes?} 201`, `GET /api/v1/admin/courses`, `POST /api/v1/admin/courses/:id/publish`, `POST /api/v1/admin/batches {courseId,code,name,startAt,endAt,capacity,timezone,status} 201`, `POST /api/v1/admin/batches/:id/enrollments {userId,state} 201`, `POST /api/v1/admin/courses/:id/modules {sequence,title,description?}`, `POST /api/v1/admin/modules/:id/publish`, `POST /api/v1/admin/modules/:id/lessons {sequence,title,type,durationSeconds?}`, `POST /api/v1/admin/lessons/:id/publish`, `POST /api/v1/admin/lessons/:id/resources {sequence,title,resourceUrl,contentType}`, `POST /api/v1/admin/lessons/:id/prerequisites {prerequisiteLessonId}`, `GET /api/v1/admin/courses/:id/curriculum`, `POST /api/v1/admin/batches/:id/classes {title,provider,meetingUrl?,scheduledAt,endsAt,status}`, `POST /api/v1/admin/batches/:id/quick-class {topicTitle,classTitle,provider,scheduledAt,endsAt,questions:[{slug,title,externalUrl?}]}`, `POST /api/v1/admin/questions {slug,title,topic,difficulty,externalUrl?,status}`, `POST /api/v1/admin/lessons/:id/questions {questionId,sequence}`, `PATCH /api/v1/admin/classes/:id {recordingUrl?,status?}`, `POST /api/v1/admin/announcements {batchId?,courseId?,title,body}`, `POST /api/v1/admin/questions/:id/versions {statement,...}`, `POST /api/v1/admin/versions/:id/testcases`.

Helpers (already in frontend): `courseDurationLabel(estimatedDurationHours)`, `batchTitle/batchStart/batchEnd` tolerant getters, `formatPrice(tuitionAmountMinor,currency)`, `formatDate(startAt)`.

---

## 1. Files to build (35 files — create all, then review)
### A. Foundation (4 done, verify)
1. `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:4000`.
2. `src/lib/api.ts` → typed `req<T>`, throws `{status,code,body}`, exports: login, register, me, logout, catalog, catalogDetail, enrollments, curriculum, lessonDetail, saveProgress, completeLesson, upcoming, recordings, announcements, progress, attendance, lessonQuestions, questionDetail.
3. `src/lib/types.ts` → types mirroring §0 exactly (no durationWeeks, no startsAt).
4. `src/lib/format.ts` → date, price, duration helpers.
### B. Public (6 files)
5. `src/app/layout.tsx` → nav (Home Catalog Login Dashboard) + footer.
6. `src/app/page.tsx` → ISR 60, hero, 3 featured from catalog, CTAs. Error→retry.
7. `src/app/catalog/page.tsx` → client search + level filter, skeleton, error+retry, empty.
8. `src/app/catalog/[slug]/page.tsx` → ISR 60, outcomes, BatchTable, request-enrollment placeholder.
9. `src/app/catalog/[slug]/not-found.tsx` → friendly 404.
10. `src/components/CourseCard.tsx` + `src/components/BatchTable.tsx`.
### C. Auth (3 files, done, verify)
11. `src/app/login/page.tsx`, 12. `src/app/register/page.tsx`, 13. `src/middleware.ts` (guard /dashboard,/curriculum,/lessons,/live,/admin when no cookie).
### D. Student (9 files)
14. `src/app/dashboard/page.tsx` → server, me + enrollments + next lesson + progress + 3 announcements. Empty (no enrollment) state.
15. `src/app/curriculum/page.tsx` → modules/lessons, lock icon, completed check, link to lesson.
16. `src/app/lessons/[id]/page.tsx` → detail + resources + questions + Save/Complete buttons + 403 locked message.
17. `src/app/live/page.tsx` → upcoming + Join (new tab) + attendance fire-once + status.
18. `src/app/recordings/page.tsx` → list with video link, empty “no recordings yet”.
19. `src/app/announcements/page.tsx` → list sorted desc.
20. `src/app/progress/page.tsx` → per-topic bars from total/completed/attendedLives.
21. `src/app/questions/[id]/page.tsx` → statement + samples only (never hidden tests).
22. `src/components/Guard.tsx`, `Empty.tsx`, `ErrorBox.tsx`, `ProgressBar.tsx`.
### E. Admin studio (13 files, role-gated: `me.roles includes admin` else 403 page)
23. `src/app/admin/page.tsx` → tabs + role check.
24. `src/app/admin/courses/page.tsx` → list + create form (slug,title,description,level,status) + publish button. Show 409/400 codes.
25. `src/app/admin/batches/page.tsx` → create (courseId dropdown, code, name, dates, capacity, status open) + list.
26. `src/app/admin/enrollments/page.tsx` → enroll (batchId + userId + active) + result.
27. `src/app/admin/curriculum/page.tsx` → course picker → modules/lessons tree + create module/lesson/resource/prerequisite + publish buttons.
28. `src/app/admin/live/page.tsx` → create class + quick-class + patch recording (recordingUrl + ended).
29. `src/app/admin/questions/page.tsx` → create question + link to lesson + versions/testcases forms (data only).
30. `src/app/admin/announcements/page.tsx` → create + list.
31. `src/components/AdminForm.tsx` (labeled inputs + error display).
### F. Root
32. `src/app/not-found.tsx`, 33. `src/app/error.tsx`, 34. `README.md` (how to run backend :4000 + web :4028), 35. `FRONTEND_PRD_TRD.md` §4 updated to §0 shapes.

## 2. Per-page acceptance (must all pass before review)
- `/` shows 3 real courses (Full Test, Test Course, DSA), no hardcode; API down → retry button.
- `/catalog` search “dsa” filters; level filter works; skeleton → grid; empty → “no courses”.
- `/catalog/data-structures-and-algorithms` shows batch DSA-2026-01, 50 seats, price ₹0 INR, outcomes; bad slug → not-found.
- `/login` vinay@example.com → `/dashboard` shows name + roles; wrong pw → 401 message; `/register` duplicate → 409.
- `/dashboard` no-enrollment user → pending state; active → batch + next lesson + progress numbers match API.
- `/curriculum` lock icon on locked, check on completed; click → lesson.
- `/lessons/:id` Save 120s → watchedSeconds persists on refresh; Complete → completedAt set; locked → 403 message.
- `/live` Join opens meetingUrl + attendance 201 once; `/progress` attendedLives 0→1 after join (verified backend behavior).
- `/recordings` empty until admin ends class + sets URL; `/announcements` shows backend list desc.
- `/admin` as student → 403 page; as admin → all creates return 201/200, duplicates show 409 code, validation shows fields.
- Logout → `/login`, then `/dashboard` redirects to login (session revoked).

## 3. Build order (single pass)
Foundation → Public → Auth verify → Student → Admin → Root → `npm run build` must pass → click every route above with backend `:4000` running (login vinay@example.com / ChangeThisPassword123) → fix → request review with: build log + screenshots/list of each URL status + any 403/409 cases.

## 4. Review checklist (reviewer ticks)
[ ] No hardcoded courses/batches/progress; [ ] cookies only, no localStorage token; [ ] every page has loading/error/empty/401/403; [ ] price/seats/dates match API; [ ] `WEB_ORIGIN=http://localhost:4028` + API restarted; [ ] `npm run build` green; [ ] mobile + keyboard pass.

Start at §1A.4 → B. Do not skip §0 shapes.
