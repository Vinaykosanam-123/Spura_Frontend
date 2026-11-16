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

Public: `/`, `/courses`, `/courses/[slug]`, `/visualize`, `/visualize/[slug]`, `/login`, `/register`.
Student (login): `/my`, `/my/curriculum`, `/my/lessons/[id]`, `/my/courses`, `/my/live`,
`/my/recordings`, `/my/announcements`, `/my/progress`, `/my/feedback`, `/my/questions/[id]`,
`/practice`, `/practice/mock`, `/bank`, `/contests`.
Admin: `/admin/*` (courses, batches, enrollments, curriculum, live, questions, announcements).

## Visualizers

Frontend-only interactive DSA labs under `/visualize`:

- Sorting: bubble, selection, insertion, merge, quick (custom + random arrays).
- Stack & queue: push/pop/enqueue/dequeue with an operation log.
- Linked list: insert head/tail, delete, search with pointer rewinds.
- Binary search tree: insert, search, inorder/preorder/postorder.
- Graph: BFS/DFS on a fixed graph with selectable start node.

Each lab has play/pause, step, speed, reset, pseudocode line highlighting, an explanation
panel and live stats. Public visitors unlock 3 visualizers (tracked in
`localStorage.ll_visualizer_trials_v1`); signed-in users get all of them. No backend calls are
required to run a visualizer — move enforcement server-side once auth/enrollment is ready.

Spec: `FRONTEND_BUILD_SPEC.md` (§0 has the real API shapes).
