# My day: implementation plan

Spec: [my-day.md](my-day.md). Three phases, one commit each.

## Phase 1: data and service

- `packages/db/src/bookings.ts`: add `listMemberBookingsBetween(db, memberId, from, to)`: active bookings with `startsAt < to` and `endsAt > from`, ordered by `startsAt`, with the room name joined in. If the join complicates `Booking`, return `Booking` and let the page map `roomId` to a name from `rooms.list` instead (preferred: no new shared type).
- `packages/db/src/tasks.ts`: add `listOpenTasksDueBy(db, assigneeId, date)`: not completed, `dueOn` not null and `<= date`, ordered by `dueOn`, then `id`.
- `packages/services/src/my-day.ts`: `createMyDayService(db)` with `get`, zod input `myDayInput`, the rules from the spec. Export `./my-day` in `packages/services/package.json`.
- `packages/services/src/my-day.test.ts`: the cases listed under "Done when", using `createTeam()` fixtures.
- Exit: `bun test` passes.

## Phase 2: API

- `apps/web/src/server/trpc/context.ts`: add `myDay: createMyDayService(db)`.
- `apps/web/src/server/trpc/routers/my-day.ts`: `get` query, input `{ memberId, ...myDayInput }`, one service call.
- Register `myDay` in `router.ts`.
- Exit: `bun run check` passes.

## Phase 3: page

- `apps/web/src/routes/my-day.tsx`: loader fetches `members.list` and `rooms.list` (SSR-safe). The day data is fetched on the client in an effect once the acting member is known, because the server does not know the browser's timezone. Local day bounds computed with a small helper in `apps/web/src/lib/datetime.ts` (with a test in `datetime.test.ts`).
- Done button reuses `useAction` + `tasks.complete`, then refetches.
- Header nav link and home page card.
- Exit: verified in the browser locally for Kim, Ana and Ben; `bun test` and `bun run check` pass.
