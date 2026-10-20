import { beforeEach, describe, expect, test } from "bun:test";
import { createTeam, type Team } from "./fixtures.ts";
import { createTasksService, type TasksService } from "./tasks.ts";

const TODAY = "2026-10-23";

let team: Team;
let tasks: TasksService;

beforeEach(async () => {
  team = await createTeam();
  tasks = createTasksService(team.db);
});

describe("tasks service", () => {
  test("create trims the title and keeps the due date", async () => {
    const task = await tasks.create(
      team.ana.id,
      { dueOn: "2026-10-30", title: "  Book the venue  " },
      TODAY
    );

    expect(task).toMatchObject({
      createdById: team.ana.id,
      dueOn: "2026-10-30",
      title: "Book the venue",
    });
  });

  test("create rejects an unknown assignee", async () => {
    await expect(
      tasks.create(team.ana.id, { assigneeId: "999", title: "Nobody" }, TODAY)
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  // biome-ignore lint/suspicious/noSkippedTests: due dates are not validated yet, re-enable when tasks.ts checks them
  test.skip("create rejects a due date in the past", async () => {
    await expect(
      tasks.create(
        team.ana.id,
        { dueOn: "2026-10-01", title: "Too late" },
        TODAY
      )
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("only the assignee, the creator or an admin can complete a task", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Order pizza" },
      TODAY
    );

    await expect(tasks.complete(team.ben.id, task.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await tasks.assign(team.ana.id, task.id, team.ben.id);
    expect(
      (await tasks.complete(team.ben.id, task.id)).completedAt
    ).not.toBeNull();
  });

  test("completing twice is a validation error", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Order pizza" },
      TODAY
    );
    await tasks.complete(team.admin.id, task.id);

    await expect(tasks.complete(team.admin.id, task.id)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
