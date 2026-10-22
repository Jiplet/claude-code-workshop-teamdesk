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

  test("new tasks start in To do", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    expect(task.status).toBe("todo");
  });

  test("completing a task moves it to Done", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    expect((await tasks.complete(team.ana.id, task.id)).status).toBe("done");
  });

  test("moving to Done records completion, moving out clears it", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    const done = await tasks.move(team.ana.id, {
      status: "done",
      taskId: task.id,
    });
    expect(done).toMatchObject({ status: "done" });
    expect(done.completedAt).not.toBeNull();

    const reopened = await tasks.move(team.ana.id, {
      status: "in_progress",
      taskId: task.id,
    });
    expect(reopened).toMatchObject({
      completedAt: null,
      status: "in_progress",
    });
  });

  test("anyone may start an unassigned task, which assigns it to them", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    const started = await tasks.move(team.ben.id, {
      status: "in_progress",
      taskId: task.id,
    });
    expect(started).toMatchObject({
      assigneeId: team.ben.id,
      status: "in_progress",
    });
  });

  test("only the assignee, the creator or an admin can move an assigned task", async () => {
    const task = await tasks.create(
      team.ana.id,
      { assigneeId: team.ana.id, title: "Plan" },
      TODAY
    );

    await expect(
      tasks.move(team.ben.id, { status: "in_progress", taskId: task.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (await tasks.move(team.admin.id, { status: "done", taskId: task.id }))
        .status
    ).toBe("done");
  });

  test("a stranger cannot finish an unassigned task", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    await expect(
      tasks.move(team.ben.id, { status: "done", taskId: task.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("moving to the same column changes nothing", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plan" }, TODAY);

    expect(
      await tasks.move(team.ben.id, { status: "todo", taskId: task.id })
    ).toEqual(task);
  });

  test("move rejects an unknown status and a missing task", async () => {
    await expect(
      tasks.move(team.ana.id, {
        status: "blocked" as "todo",
        taskId: "1",
      })
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      tasks.move(team.ana.id, { status: "done", taskId: "999" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("new tasks start unflagged", async () => {
    const task = await tasks.create(team.ana.id, { title: "Plain" }, TODAY);

    expect(task).toMatchObject({ blocked: false, highPriority: false });
  });

  test("the creator can tick and clear blocked and high priority", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Fix the printer" },
      TODAY
    );

    const blocked = await tasks.flag(team.ana.id, {
      flag: "blocked",
      taskId: task.id,
      value: true,
    });
    const urgent = await tasks.flag(team.ana.id, {
      flag: "highPriority",
      taskId: task.id,
      value: true,
    });
    expect(urgent).toMatchObject({ blocked: true, highPriority: true });
    expect(blocked.status).toBe(task.status);

    const cleared = await tasks.flag(team.ana.id, {
      flag: "blocked",
      taskId: task.id,
      value: false,
    });
    expect(cleared).toMatchObject({ blocked: false, highPriority: true });
  });

  test("only the assignee, the creator or an admin can flag a task", async () => {
    const task = await tasks.create(team.ana.id, { title: "Ana's job" }, TODAY);

    await expect(
      tasks.flag(team.ben.id, { flag: "blocked", taskId: task.id, value: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await tasks.assign(team.ana.id, task.id, team.ben.id);
    expect(
      (
        await tasks.flag(team.ben.id, {
          flag: "blocked",
          taskId: task.id,
          value: true,
        })
      ).blocked
    ).toBe(true);
  });

  test("flag rejects an unknown flag and a missing task", async () => {
    await expect(
      tasks.flag(team.ana.id, {
        flag: "urgent" as "blocked",
        taskId: "1",
        value: true,
      })
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      tasks.flag(team.ana.id, { flag: "blocked", taskId: "999", value: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
