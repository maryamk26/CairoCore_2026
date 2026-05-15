# CairoCore — project structure

This is a **Next.js App Router** application: UI and routing live under `app/`, shared React components under `components/`, and server-side logic under `lib/` and `utils/`.

## Top-level layout

| Path          | Role                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Routes, layouts, and Route Handlers (`app/api/**/route.ts`). Keep handlers thin: parse input, call `lib/`, return JSON or redirects.                                               |
| `components/` | React components grouped by area (`planner/`, `profile/`, `places/`, `layout/`, …). Client components use `"use client"` only where needed.                                        |
| `lib/`        | Server-oriented modules: Prisma (`lib/prisma.ts`, `lib/db/*`), Supabase (`lib/supabase/*`), auth (`lib/auth/*`), domain services (`lib/places/*`, `lib/planner/*`, `lib/admin/*`). |
| `utils/`      | Pure helpers used by planner/route logic (distances, OSRM, recommendations). Prefer no React or Node-only globals here unless already coupled.                                     |
| `prisma/`     | Schema and migrations.                                                                                                                                                             |
| `scripts/`    | One-off or operational scripts (e.g. embeddings).                                                                                                                                  |

## Data and auth

- **Postgres** is accessed through **Prisma** (`@/lib/prisma`). Use small, focused functions in `lib/db/*` for persistence patterns.
- **Supabase Auth** handles sign-in; middleware refreshes the session cookie and exposes `x-user-id` / `x-user-email` for routing decisions. Server routes that need the user use `@/lib/supabase/server` or existing session helpers.
- **Admin** APIs and `/admin` UI go through `lib/auth/requireAdmin.ts` and related policy modules.

## Conventions

- Path alias **`@/`** maps to the repository root (see `tsconfig.json`).
- TypeScript **`strict`** plus **`noUnusedLocals`** / **`noUnusedParameters`** are enabled to keep the codebase review-ready.
- Formatting: **`npm run format`** (Prettier) keeps style consistent for demos and grading.

## Environment

Copy `.env.example` to `.env` / `.env.local` and set `DATABASE_URL`, Supabase keys, and optional planner/embedding variables as documented there.
