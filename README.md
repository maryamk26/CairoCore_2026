# CairoCore

CairoCore is a web application for discovering places in Cairo and planning day trips. It helps residents and visitors find museums, historical sites, parks, cafés, restaurants, and other venues, save them to personal boards, and turn a selection into a mapped route with directions.

Undergraduate project — Cairo-focused place discovery combined with an AI-assisted trip planner.

## Features

**Discovery** — Browse a home feed, search the catalogue, and open rich place pages (photos, map, fees, hours, vibes, kid/pet-friendly flags, feedback).

**Social & profiles** — Authentication via Supabase. User profiles, boards, saved routes, follows, and user-submitted place listings.

**Trip planner** — Conversational assistant collects trip preferences, retrieves matching places via vector search, ranks them, and lets the user pick stops. Supports optional café/restaurant stops, route reordering, a custom start point, and navigation (OpenRouteService). Planner intelligence runs through LM Studio (chat + embeddings).

**Administration** — Admin panel for moderating users, places, and feedback.

## Tech stack

Next.js, React, Tailwind CSS, Leaflet, PostgreSQL, Prisma, pgvector, Supabase, OpenRouteService, LM Studio.

## Architecture

The codebase follows a standard Next.js App Router layout: UI in `components/`, server logic in `lib/`, and shared types/helpers in `utils/`.

| Layer | Role |
|-------|------|
| `app/` | Routes (pages) and REST handlers under `app/api/` |
| `components/` | React UI grouped by feature (`feed`, `places`, `planner`, `profile`, `admin`, `layout`) |
| `lib/` | Server-side domain code — not imported by client components for heavy logic |
| `utils/` | Shared types and pure helpers used on both client and server (e.g. planner types, routing math) |
| `prisma/` | Database schema and migrations |
| `public/` | Static assets and place images |
| `scripts/` | Maintenance utilities (e.g. embedding places for search) |

**API surface** — Handlers are grouped by domain: `places`, `planner`, `profile`, `routing`, `auth`, `feed`, `users`, `admin`.

**Planner pipeline** — `lib/planner/` holds trip profile parsing, candidate retrieval, scoring, and the assistant turn orchestrator. The chat UI in `components/planner/` only renders state and calls `/api/planner/assistant`.

**Data access** — `lib/db/` wraps Prisma queries; `lib/places/` covers search, embeddings, and place detail mapping.

Configuration is described in `.env.example`.
