# CairoCore

Website for discovering places in cairo (museums, markets, cafés, etc). Feed, search, place pages, save to boards, route planner with a small survey.

next.js + prisma/postgres + supabase + leaflet. folder structure is in ARCHITECTURE.md if you need it.

## setup

```bash
git clone https://github.com/maryamk26/CairoCore.git
cd CairoCore
npm install
```

copy `.env.example` → `.env.local`

fill in `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. shadow db url too if migrate asks for it.

```bash
npm run db:generate
npm run db:migrate
```

(`db:push` ok if migrate is being annoying locally)

supabase dashboard: add `http://localhost:3000` and redirect `http://localhost:3000/auth/callback`

```bash
npm run dev
```

go to localhost:3000, auth is `/auth`

planner works without any ai — leave `AI_PLANNER_ENABLED=false` in env. survey + recommendations still run, just not the vector/llm part.

`OPENROUTESERVICE_API_KEY` is optional (directions). works without it via osrm fallback.

`/admin` — only my admin email in `lib/auth/adminPolicy.ts` gets in, sign in with that to test moderation.

`npm run build` / `npm run start` for prod-ish check.

## ai planner (only if you want to test that part)

not required for the rest of the app.

turn on `AI_PLANNER_ENABLED=true`, lm studio running with an embedding model loaded, set `LM_STUDIO_BASE_URL` + `LM_STUDIO_EMBEDDING_MODEL` in env (see .env.example).

postgres needs pgvector once:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

then `npm run embed:places` after you have places in the db. chat rerank needs `LM_STUDIO_CHAT_MODEL` too but you can skip that.

if lm studio isn't on it just uses the normal rule sorting anyway.

## grading / demo

no automated tests in the repo.

usually i check: feed → search → open a place → sign in → profile/saved boards → create place → planner survey + map → admin if needed.
