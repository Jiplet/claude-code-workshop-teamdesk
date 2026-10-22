import { beforeEach, describe, expect, test } from "bun:test";
import { createMember } from "./members.ts";
import type { Database } from "./schema.ts";
import {
  completeTask,
  getTask,
  insertTask,
  listTasks,
  setTaskAssignee,
  setTaskFlag,
} from "./tasks.ts";
import { createTestDatabase } from "./testing.ts";

let db: Database;
let memberId: string;

beforeEach(async () => {
  db = createTestDatabase();
  memberId = (
    await createMember(db, {
      email: "ana@example.com",
      name: "Ana",
      role: "member",
    })
  ).id;
});

const addTask = (title: string, dueOn: string | null = null) =>
  insertTask(db, { assigneeId: null, createdById: memberId, dueOn, title });

describe("tasks", () => {
  test("listTasks puts open tasks first, by due date, undated last", async () => {
    const undated = await addTask("Undated");
    await addTask("Later", "2026-11-01");
    await addTask("Sooner", "2026-10-25");
    await completeTask(db, undated.id);
    await addTask("Also undated");

    expect((await listTasks(db)).map((t) => t.title)).toEqual([
      "Sooner",
      "Later",
      "Also undated",
      "Undated",
    ]);
  });

  test("completeTask only completes an open task once", async () => {
    const task = await addTask("Ship it");

    expect((await completeTask(db, task.id))?.completedAt).not.toBeNull();
    expect(await completeTask(db, task.id)).toBeNull();
  });

  test("setTaskAssignee and the assignee filter", async () => {
    const task = await addTask("Ship it");
    await addTask("Someone else's");

    await setTaskAssignee(db, task.id, memberId);

    expect((await getTask(db, task.id))?.assigneeId).toBe(memberId);
    expect(
      (await listTasks(db, { assigneeId: memberId })).map((t) => t.title)
    ).toEqual(["Ship it"]);
  });

  test("setTaskFlag sets one flag and leaves the other", async () => {
    const task = await addTask("Fix the printer");

    expect(await setTaskFlag(db, task.id, "highPriority", true)).toMatchObject({
      blocked: false,
      highPriority: true,
    });
    expect(await setTaskFlag(db, "999", "blocked", true)).toBeNull();
  });
});
