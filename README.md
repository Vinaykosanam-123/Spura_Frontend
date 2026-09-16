# landlweb — Learn&Learn frontend

Next.js 16 + React 19 + Tailwind 4 student portal + admin studio.
Reads/writes ONLY the real production API in `../learnandlearn`. No hardcoded data.

## Run

Backend (`../learnandlearn`) must be up first:

```bash
# terminal 1 — API :4000 (Postgres :5432, Redis :6379)
cd ../learnandlearn && npm run dev:api
```

```bash
# terminal 2 — web :4028
npm run dev
```

Env (`landlweb/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Backend CORS needs `WEB_ORIGIN=http://localhost:4028` (+ restart `dev:api`).

## Checks

```bash
npm run build   # must pass
npx tsc --noEmit
npm run lint
```

## Test account

- `vinay@example.com` / `ChangeThisPassword123` (student + admin)
- Login → `/dashboard`. Admin studio at `/admin` (403 for pure students).

## Routes

Public: `/`, `/catalog`, `/catalog/[slug]`, `/login`, `/register`.
Student (login): `/dashboard`, `/curriculum`, `/lessons/[id]`, `/live`,
`/recordings`, `/announcements`, `/progress`, `/questions/[id]`.
Admin: `/admin/*` (courses, batches, enrollments, curriculum, live, questions, announcements).

Spec: `FRONTEND_BUILD_SPEC.md` (§0 has the real API shapes).
