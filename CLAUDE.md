# Teamdesk

Rooms, bookings and tasks for a small team. TanStack Start on Cloudflare Workers with D1, Bun monorepo (Turborepo).

## Commands

- `bun test`: all tests, in-memory SQLite. Run before every commit; it takes under a second.
- `bun run check`: lint (Ultracite/Biome) and typecheck. Run after edits; the pre-commit hook only formats.
- `bun run fix`: format and safe lint fixes. Use it instead of hand-formatting, so diffs stay clean.
- `bun run dev`: applies local migrations, seeds, serves http://localhost:3000.
- `bun run deploy`: build and deploy. The D1 id in `apps/web/wrangler.jsonc` is the real remote one; never set it back to `local`.

## Where code goes

A request flows: route component (`apps/web/src/routes/`) -> tRPC router (`apps/web/src/server/trpc/routers/`) -> service (`packages/services/src/<module>.ts`) -> query functions (`packages/db/src/<module>.ts`).

- Business rules and zod input schemas live in the service. Reason: services are the only layer with tests for rules, and scripts reuse them.
- tRPC routers stay thin: service input schema, then one service call. Reason: no rules hidden where tests do not reach.
- Query functions do no validation and return plain JSON (string ids, ISO dates). Reason: tRPC serialises results, row types must not leak.
- Throw `ServiceError` subclasses from `@repo/services/errors` (NotFound, Conflict, Forbidden, Validation). Reason: `init.ts` maps them to 404/409/403/400.
- One entry per module, no barrel files. A new table gets `src/<name>.ts` in both packages plus an `exports` line in each `package.json`. Reason: keeps the server/browser split explicit.
- Browser code imports only `@repo/db/shared`. Reason: any other `@repo/db` entry pulls drizzle into the client bundle.
- Shared types and limits (`Booking`, `MAX_BOOKINGS_PER_MEMBER_PER_DAY`) go in `packages/db/src/shared.ts`. Reason: UI and services read the same constants.

## Data

- Schema: `packages/db/src/schema.ts`. After changing it run `bun run generate` in `packages/db` and commit `migrations/` including `meta/`. Reason: drizzle diffs against the snapshot; a missing snapshot recreates tables.
- Migrations are applied by wrangler, not drizzle-kit: `bun run db:apply` (local) and `bun run db:apply:remote`.
- After a migration ships, also run `bun run db:apply:remote` before `bun run deploy`. Reason: the Worker will query columns the remote database lacks.
- Demo data is `packages/db/seed.sql`, not a migration. Keep it re-runnable.
- Times are UTC ISO strings; slots are `[startsAt, endsAt)`. Reason: back-to-back bookings must not clash.

## Auth

There is no sign-in. Mutations take the acting member as `actorId`; pages pick it with a member picker. Permission checks (owner or admin) happen in the service via `requireMember`.

## Tests

- Tests sit beside the code as `*.test.ts` and use `createTestDatabase()` from `@repo/db/testing` (fresh in-memory DB with migrations applied).
- Service tests use fixtures from `packages/services/src/fixtures.ts`. Add a service test for every new rule.

## Specs and plans

Feature specs live in `docs/specs/<feature>.md`, with the plan beside them as `docs/specs/<feature>.plan.md`.
