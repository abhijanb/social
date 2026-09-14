# AGENTS – Social

## Repo shape
- No root `package.json` / `bun.lock` – monorepo with two **independent** apps: `back/` (Nest+Prisma) and `front/` (Vite React). Run everything from inside each app, never from repo root.
- `back/src/generated/` is Prisma generated client (`runtime = bun`) – gitignored, do not edit. Regenerate after schema changes.

## Commands – use bun + per-app cwd
```bash
cd back && bun install
cd front && bun install
```
- **Back dev/build:** `cd back && bun run dev` (`bun --watch src/main.ts`, port `3000`), `bun run build` (`tsc`), `bun run start`
- **Back DB (always with env file):** `cd back && bun --env-file=.env ./node_modules/.bin/prisma generate` (`db:generate`), `db:migrate` (`migrate dev`), `db:push`, `db:seed`
- **Front dev/build:** `cd front && bun run dev` (Vite `5173`), `bun run build` (`tsc -b && vite build`), `bun run lint`
- Never `bun install` / `bun add` from repo root – it recreates `package.json` at root. Always `cd back && bun add <pkg>` or `cd front && bun add <pkg>`. If you accidentally create `social/package.json` or `social/bun.lock`, delete them.

## Env
- `back/.env` (gitignored) required: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d` (fallback `dev-secret-change-me`). `front/.env` optional `VITE_API_URL` (defaults to `http://localhost:3000` in `front/src/app/baseApi.ts:5`).
- `front/src/app/baseApi.ts` uses `credentials:'include'` and `back/src/main.ts:10` uses `cookieParser()` + `enableCors({origin:true, credentials:true})` – httpOnly `token` cookie flow. Changing `VITE_API_URL` or `JWT_SECRET` breaks auth/search.

## Backend quirks
- `back/tsconfig.json` is ESM (`"type":"module"` + `"module":"ESNext"` + `verbatimModuleSyntax:true`): imports must use `.js` extensions (`from './presence/presence.module.js'`), type-only imports must be `import type`.
- `strict:true` + `emitDecoratorMetadata` – DTO `id!: number` needs `!` (see `back/src/chart/dto/update-chart.dto.ts:5`).
- `include:["src/**/*.ts"]` + `exclude:["src/**/*.spec.ts"]` – specs (`*.spec.ts` in `chart`, `on-line-off-line`) are Nest scaffolds requiring `@nestjs/testing`/`jest` types, excluded from build. Don't add specs without installing test deps.
- `ChartModule` + `OnLineOffLineModule` are scaffold bloat wired in `back/src/app.module.ts:6-10` – keep or delete together with their `@nestjs/websockets` deps (`back/package.json:20-21,30`). Real feature is `PresenceModule`.
- Prisma: `back/prisma/schema.prisma:1-5` outputs to `src/generated/prisma`, `back/prisma.config.ts` loads `DATABASE_URL` via `env()`. Migrations in `back/prisma/migrations/`, seed `back/prisma/seed.ts` (alice/bob/charlie).

## Frontend quirks
- `front/src/app/baseApi.ts` is RTK Query with `credentials:'include'` – required for JWT cookie; `tagTypes: ['User','Friendship','Presence']`.
- Auth truth is backend JWT, but `front/src/features/auth/authSlice.ts:8-13` also persists `isAuthenticated` in `localStorage`. Stale `localStorage=true` + missing cookie = `GET /user?search=` returns `401` (strict). Hooks `useUserSearch`/`useFriendRequests` detect `status===401` and dispatch `logout()` → redirect `/login`.
- `front/src/features/friendship/hooks/useFriendRequests.ts` uses `GET /user/me` (`front/src/features/users/usersApi.ts:22`) for `currentUserId` – not search-by-username (which broke after self-exclusion).

## Search / friendship invariants
- `GET /user?search=` with valid JWT excludes self by `id notIn + username NOT equals insensitive` and `ACCEPTED` friends (`back/src/user/user.service.ts:53-77`). `PENDING` is NOT excluded so UI can show Accept/Pending.
- Requires auth when `search` present (`401` if no JWT) – `GET /user/me` also `401`. Generic `GET /user` without search still works for `UsersPage` but self-exclusion still applies if authenticated.

## Reference
- Source of truth: `README.md`, `back/package.json`/`front/package.json` scripts, `back/tsconfig.json`, `front/vite.config.ts:8`, `back/prisma/schema.prisma`.
