# AGENTS – Social

## Repo shape
- No root `package.json` / `bun.lock` – monorepo with two **independent** apps: `backend/` (Express+Prisma) and `front/` (Vite React). Run everything from inside each app, never from repo root.
- `backend/src/generated/` is Prisma generated client (`runtime = bun`) – gitignored, do not edit. Regenerate after schema changes.

## Commands – use bun + per-app cwd
```bash
cd backend && bun install
cd front && bun install
```
- **Backend dev/build:** `cd backend && bun run dev` (`bun --watch src/index.ts`, port `3000`), `bun run build` (`tsc`), `bun run start`
- **Backend DB (always with env file):** `cd backend && bun --env-file=.env ./node_modules/.bin/prisma generate` (`db:generate`), `db:migrate` (`migrate dev`), `db:push`, `db:seed`
- **Front dev/build:** `cd front && bun run dev` (Vite `5173`), `bun run build` (`tsc -b && vite build`), `bun run lint`
- Never `bun install` / `bun add` from repo root – it recreates `package.json` at root. Always `cd backend && bun add <pkg>` or `cd front && bun add <pkg>`. If you accidentally create `social/package.json` or `social/bun.lock`, delete them.

## Env
- `backend/.env` (gitignored) required: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d` (fallback `dev-secret-change-me`). `front/.env` optional `VITE_API_URL` (defaults to `http://localhost:3000` in `front/src/app/baseApi.ts:5`).
- `front/src/app/baseApi.ts` uses `credentials:'include'` and `backend/src/index.ts` uses `cookieParser()` + `cors({origin:true, credentials:true})` – httpOnly `token` cookie flow. Changing `VITE_API_URL` or `JWT_SECRET` breaks auth/search.

## Backend quirks
- `backend/tsconfig.json` is ESM (`"type":"module"` + `verbatimModuleSyntax:true`): imports must use `.js` extensions (`from '../../lib/jwt.js'`), type-only imports must be `import type`.
- Feature layout is `schema → service → controller → route` under `backend/src/feature/<name>/`, shared code in `backend/src/lib/` (`prisma` singleton, `jwt`, `validate`, `errorHandler`, `response` envelope, `stripPassword`) and `backend/src/middleware/` (`attachUser`/`requireAuth`, final `errorMiddleware` registered last in `index.ts`).
- Services throw `AppError(message, statusCode)` / `ValidationError`; controllers let throws bubble to `errorMiddleware`. Responses use the `{status,message,data}` envelope (`responseSuccess`/`responseCreated`/`responseError`).
- Route order matters: `GET /user/me` (authRouter) before `GET /user/:id`, `GET /friendship/pending` before `/:id`, `GET /post/feed` before author timeline. Auth router mounts before user router in `index.ts`.
- Prisma: `backend/prisma/schema.prisma` outputs to `src/generated/prisma`, `backend/prisma.config.ts` loads `DATABASE_URL` via `env()`. Migrations in `backend/prisma/migrations/`, seed `backend/prisma/seed.ts` (alice/bob/charlie).

## Frontend quirks
- `front/src/app/baseApi.ts` is RTK Query with `credentials:'include'` – required for JWT cookie; `tagTypes: ['User','Friendship','Presence']`.
- Auth truth is backend JWT, but `front/src/features/auth/authSlice.ts:8-13` also persists `isAuthenticated` in `localStorage`. Stale `localStorage=true` + missing cookie = `GET /user?search=` returns `401` (strict). Hooks `useUserSearch`/`useFriendRequests` detect `status===401` and dispatch `logout()` → redirect `/login`.
- `front/src/features/friendship/hooks/useFriendRequests.ts` uses `GET /user/me` (`front/src/features/users/usersApi.ts:22`) for `currentUserId` – not search-by-username (which broke after self-exclusion).

## Search / friendship invariants
- `GET /user?search=` with valid JWT excludes self by `id notIn + username NOT equals insensitive` and `ACCEPTED` friends (`backend/src/feature/user/user.service.ts`). `PENDING` is NOT excluded so UI can show Accept/Pending.
- Requires auth when `search` present (`401` if no JWT) – `GET /user/me` also `401`. Generic `GET /user` without search still works for `UsersPage` but self-exclusion still applies if authenticated.

## Reference
- Source of truth: `README.md`, `backend/package.json`/`front/package.json` scripts, `backend/tsconfig.json`, `front/vite.config.ts:8`, `backend/prisma/schema.prisma`.
