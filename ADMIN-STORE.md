# HighLife Live Admin Store

Hybrid data layer for the admin console. Supports both localStorage (fallback) and Postgres (primary).

## Current Mode: Postgres via Prisma (Live)

Data lives in Prisma Postgres (db.prisma.io). The cutover was completed 2026-05-31.

### Architecture

1. **Database**: Prisma Postgres (PostgreSQL), schema at `prisma/schema.prisma`.
2. **Prisma Client**: `src/lib/db.ts` -- singleton PrismaClient using `@prisma/adapter-pg` for Prisma 7 compatibility.
3. **API Routes** (REST, under `/api/admin/`):
   - `/api/admin/artists` (GET list, POST create)
   - `/api/admin/artists/[id]` (GET, PATCH, DELETE)
   - `/api/admin/venues` (GET list, POST create)
   - `/api/admin/venues/[id]` (GET, PATCH, DELETE)
   - `/api/admin/campaigns` (GET list, POST create)
   - `/api/admin/campaigns/[id]` (GET, PATCH, DELETE)
   - `/api/admin/opportunities` (GET list, POST create)
   - `/api/admin/opportunities/[id]` (GET, PATCH, DELETE)
   - `/api/admin/research` (GET list)
   - `/api/admin/research/[id]` (PATCH, DELETE)
4. **DB Mappers**: `src/lib/admin-db-mappers.ts` -- converts between Prisma model shapes (flattened socials/scoring, DateTime fields) and the `admin-data.ts` interfaces used by the frontend.
5. **Hybrid Store**: `src/lib/admin-store.ts` -- checks `NEXT_PUBLIC_USE_DB` env var at runtime.
   - When `true`: mutations fire API calls (fire-and-forget), reads come from API via hooks.
   - When `false`: original localStorage behavior (demo data seeded on first load).
6. **React Hooks**: `src/hooks/useAdminStore.ts` -- `useArtists()`, `useVenues()`, etc. auto-switch between API fetch and localStorage based on the flag. Re-fetch on `triggerStoreUpdate()`.

### Feature Flag

Set `NEXT_PUBLIC_USE_DB=true` in `.env.local` (local) and Vercel environment variables (production) to use Postgres. Remove or set to `false` to fall back to localStorage.

### Seeding

```bash
npm run seed
```

Runs `scripts/seed.ts` which upserts all demo data from `admin-data.ts` into the database. Safe to re-run (uses upsert with `skipDuplicates` via `where` clauses).

### Key Files

- `prisma/schema.prisma` -- database schema
- `prisma.config.ts` -- Prisma 7 config (loads DATABASE_URL via dotenv)
- `src/lib/db.ts` -- PrismaClient singleton with pg adapter
- `src/lib/admin-db-mappers.ts` -- type conversion layer
- `src/lib/admin-store.ts` -- hybrid store (localStorage + API)
- `src/hooks/useAdminStore.ts` -- React hooks
- `src/app/api/admin/` -- all REST routes
- `scripts/seed.ts` -- database seeder

## Fallback Mode: localStorage

When `NEXT_PUBLIC_USE_DB` is not `true`, all CRUD operations persist to the browser's localStorage under `hl-admin-*` keys. On first load, demo data from `admin-data.ts` is seeded automatically.

### Key operations (localStorage mode)

- **clearAllData()** -- removes all localStorage keys
- **resetDemoData()** -- clears then re-seeds from hardcoded demo constants
- **addVenues()** -- bulk add with name+city deduplication (used by CSV import)

## CSV Import

- **API route**: `POST /api/import/csv` -- accepts `{csv: string, type: "venues"|"artists"}`, uses Claude to normalize messy CSV columns
- **UI**: `/admin/venues/import` -- upload CSV or paste text, preview, commit
- Imported rows get `source: "CSV Import"`, `reviewStatus: "Needs Review"`
