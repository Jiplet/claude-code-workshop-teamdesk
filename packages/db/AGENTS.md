# packages/db (`@repo/db`)

Entry points, table module template and migration commands: [README.md](README.md).

- Schema is `src/schema.ts`. After changing it, run `bun run generate` here and commit `migrations/` including `meta/`. Reason: drizzle diffs against the snapshot; a missing snapshot recreates tables.
- Migrations are applied by wrangler, not drizzle-kit (`bun run db:apply` / `db:apply:remote` from the root). Reason: D1 tracks applied migrations in its own table.
- Query functions take a `Database`, do no validation and return plain JSON (string ids, ISO dates). Reason: services validate first, tRPC serialises results, and row types must not leak.
- Keep the stored row shape private to its module. Reason: callers depend on `shared.ts` types, not columns.
- `src/shared.ts` must not import drizzle. Reason: it is the only entry browser code may import.
- Demo data is `seed.sql`, not a migration. Keep it re-runnable.
