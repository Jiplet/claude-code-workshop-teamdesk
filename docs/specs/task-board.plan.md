# Task board: plan

Spec: [task-board.md](task-board.md).

## Phase 1: data and rules

1. `packages/db/src/schema.ts`: `status` text column on `tasks`, not null, default `todo`. `bun run generate`; append a backfill to the migration (`status = 'done'` where `completed_at` is set). Commit `migrations/` and `meta/`.
2. `packages/db/src/shared.ts`: `TASK_STATUSES`, `TaskStatus`, `status` on `Task`.
3. `packages/db/src/tasks.ts`: `toTask` maps status; `completeTask` also sets `done`; new `setTaskStatus(db, id, status, assigneeId?)` sets `completed_at` for done and clears it otherwise.
4. `packages/services/src/tasks.ts`: `moveTaskInput` (zod enum) and `move(actorId, taskId, status)` with the permission and pick-up rules. Tests for each rule in `tasks.test.ts`.

## Phase 2: API and board

5. `tasks.move` procedure in `routers/tasks.ts`.
6. `components/task-board.tsx` replaces `task-list.tsx`: three columns, native drag and drop, a status menu per card, assignee menu kept. Columns stack on phones.
7. `routes/tasks.tsx` uses the board.

## Ship

`bun run db:apply:remote` before `bun run deploy`: the Worker reads the new column.
