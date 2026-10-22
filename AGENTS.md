# Teamdesk

Rooms, bookings and tasks for a small team. TanStack Start on Cloudflare Workers with D1, Bun monorepo (Turborepo). Overview and layout: [README.md](README.md).

Package rules live beside the code and load when you work there: [apps/web/AGENTS.md](apps/web/AGENTS.md), [packages/db/AGENTS.md](packages/db/AGENTS.md), [packages/services/AGENTS.md](packages/services/AGENTS.md).

## Instruction routing

This repo is standalone. Its rules are these `AGENTS.md` files only; no outside workspace contract applies here.

- `AGENTS.md` is the source of truth at every level. Codex reads it directly; each `CLAUDE.md` beside it only imports it with `@AGENTS.md`.
- Edit rules in `AGENTS.md`, never in `CLAUDE.md`. Put a rule at the shallowest level it applies to: repo-wide here, package-only in that package's file.
- A new package that needs its own rules gets an `AGENTS.md` plus a one-line `CLAUDE.md` containing `@AGENTS.md`, and a link from the list above.
- Claude-only settings (tool permissions) stay in `.claude/settings.json`. Reason: they are harness config, not instructions.

## Commands

- `bun test`: all tests, in-memory SQLite. Run before every commit; it takes under a second.
- `bun run check`: lint (Ultracite/Biome) and typecheck. Run after edits; the pre-commit hook only formats.
- `bun run fix`: format and safe lint fixes. Use it instead of hand-formatting, so diffs stay clean.
- `bun run dev`: applies local migrations, seeds, serves http://localhost:3000.
- `bun run deploy`: build and deploy. The D1 id in `apps/web/wrangler.jsonc` is the real remote one; never set it back to `local`.
- Run `bun run db:apply:remote` before `bun run deploy` whenever a migration ships. Reason: the Worker will query columns the remote database lacks.

## Where code goes

A request flows: route component (`apps/web/src/routes/`) -> tRPC router (`apps/web/src/server/trpc/routers/`) -> service (`packages/services/src/<module>.ts`) -> query functions (`packages/db/src/<module>.ts`).

- One entry per module, no barrel files. A new table gets `src/<name>.ts` in both packages plus an `exports` line in each `package.json`. Reason: keeps the server/browser split explicit.
- Shared types and limits (`Booking`, `MAX_BOOKINGS_PER_MEMBER_PER_DAY`) go in `packages/db/src/shared.ts`. Reason: UI and services read the same constants.
- Times are UTC ISO strings; slots are `[startsAt, endsAt)`. Reason: back-to-back bookings must not clash.

## Auth

There is no sign-in. Mutations take the acting member as `actorId`; pages pick it with a member picker. Reason: permission checks (owner or admin) need a member, and they happen in the service via `requireMember`.

## Tests

Tests sit beside the code as `*.test.ts` and use `createTestDatabase()` from `@repo/db/testing`. Reason: a fresh in-memory DB with real migrations per test, no server needed.

## Specs and plans

Feature specs live in `docs/specs/<feature>.md`, with the plan beside them as `docs/specs/<feature>.plan.md`. Reason: the plan reviews against the spec it sits next to.
