import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { type Database, tasks } from "./schema.ts";
import type { Task } from "./shared.ts";

type TaskRow = typeof tasks.$inferSelect;

function toTask(row: TaskRow): Task {
  return {
    assigneeId: row.assigneeId === null ? null : String(row.assigneeId),
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    createdById: String(row.createdById),
    dueOn: row.dueOn,
    id: String(row.id),
    title: row.title,
  };
}

/**
 * Open tasks first, ordered by due date (undated last), then done tasks,
 * most recently completed first.
 */
export async function listTasks(
  db: Database,
  filter: { assigneeId?: string } = {}
): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(
      filter.assigneeId
        ? eq(tasks.assigneeId, Number(filter.assigneeId))
        : undefined
    )
    .orderBy(
      asc(isNotNull(tasks.completedAt)),
      asc(sql`${tasks.dueOn} is null`),
      asc(tasks.dueOn),
      desc(tasks.completedAt),
      asc(tasks.id)
    );
  return rows.map(toTask);
}

export async function getTask(db: Database, id: string): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, Number(id)))
    .limit(1);
  return row ? toTask(row) : null;
}

export async function insertTask(
  db: Database,
  input: {
    assigneeId: string | null;
    createdById: string;
    dueOn: string | null;
    title: string;
  }
): Promise<Task> {
  const [row] = await db
    .insert(tasks)
    .values({
      assigneeId: input.assigneeId === null ? null : Number(input.assigneeId),
      createdAt: new Date().toISOString(),
      createdById: Number(input.createdById),
      dueOn: input.dueOn,
      title: input.title,
    })
    .returning();
  if (!row) {
    throw new Error("Task was inserted but could not be read back.");
  }
  return toTask(row);
}

export async function setTaskAssignee(
  db: Database,
  id: string,
  assigneeId: string | null
): Promise<Task | null> {
  const [row] = await db
    .update(tasks)
    .set({ assigneeId: assigneeId === null ? null : Number(assigneeId) })
    .where(eq(tasks.id, Number(id)))
    .returning();
  return row ? toTask(row) : null;
}

/** Marks an open task done. Null when the task is missing or already done. */
export async function completeTask(
  db: Database,
  id: string
): Promise<Task | null> {
  const [row] = await db
    .update(tasks)
    .set({ completedAt: new Date().toISOString() })
    .where(and(eq(tasks.id, Number(id)), isNull(tasks.completedAt)))
    .returning();
  return row ? toTask(row) : null;
}
