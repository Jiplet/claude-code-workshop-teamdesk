import type { Database } from "@repo/db";
import { TASK_TITLE_MAX_LENGTH, type Task } from "@repo/db/shared";
import {
  completeTask,
  getTask,
  insertTask,
  listTasks,
  setTaskAssignee,
} from "@repo/db/tasks";
import { z } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { requireMember } from "./members.ts";

export const createTaskInput = z.object({
  assigneeId: z.string().nullable().default(null),
  dueOn: z.iso.date().nullable().default(null),
  title: z
    .string()
    .trim()
    .min(1, "Task title must not be empty.")
    .max(
      TASK_TITLE_MAX_LENGTH,
      `Task title must be at most ${TASK_TITLE_MAX_LENGTH} characters.`
    ),
});

export type CreateTaskInput = z.input<typeof createTaskInput>;

export interface TasksService {
  assign: (
    actorId: string,
    taskId: string,
    assigneeId: string | null
  ) => Promise<Task>;
  /** The assignee, the creator or an admin may complete a task. */
  complete: (actorId: string, taskId: string) => Promise<Task>;
  /** Throws on a missing assignee or a due date in the past. */
  create: (
    actorId: string,
    input: CreateTaskInput,
    today: string
  ) => Promise<Task>;
  list: (filter?: { assigneeId?: string }) => Promise<Task[]>;
}

export const createTasksService = (db: Database): TasksService => ({
  assign: async (actorId, taskId, assigneeId) => {
    await requireMember(db, actorId);
    if (assigneeId !== null) {
      await requireMember(db, assigneeId);
    }
    const task = await setTaskAssignee(db, taskId, assigneeId);
    if (!task) {
      throw new NotFoundError("Task", taskId);
    }
    return task;
  },
  complete: async (actorId, taskId) => {
    const actor = await requireMember(db, actorId);
    const task = await getTask(db, taskId);
    if (!task) {
      throw new NotFoundError("Task", taskId);
    }
    const allowed =
      actor.role === "admin" ||
      task.createdById === actor.id ||
      task.assigneeId === actor.id;
    if (!allowed) {
      throw new ForbiddenError(
        "Only the assignee, the creator or an admin can complete this task."
      );
    }
    const done = await completeTask(db, taskId);
    if (!done) {
      throw new ValidationError("This task is already done.");
    }
    return done;
  },
  // `today` comes from the caller (YYYY-MM-DD) so the rule is testable and the
  // service never reads the clock for a business decision.
  create: async (actorId, input, today) => {
    await requireMember(db, actorId);
    const data = createTaskInput.parse(input);
    if (data.assigneeId !== null) {
      await requireMember(db, data.assigneeId);
    }
    if (data.dueOn !== null && data.dueOn < today) {
      throw new ValidationError("The due date is in the past.");
    }
    return await insertTask(db, { ...data, createdById: actorId });
  },
  list: (filter) => listTasks(db, filter),
});
