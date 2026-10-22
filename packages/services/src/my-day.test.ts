import { beforeEach, describe, expect, test } from "bun:test";
import { cancelBooking, insertBooking } from "@repo/db/bookings";
import { completeTask, insertTask } from "@repo/db/tasks";
import { at, createTeam, type Team } from "./fixtures.ts";
import { createMyDayService, type MyDayService } from "./my-day.ts";

const TODAY = "2026-10-23";
const DAY_START = at("00:00");
const DAY_END = "2026-10-24T00:00:00.000Z";
const INPUT = { dayEnd: DAY_END, dayStart: DAY_START, today: TODAY };

let team: Team;
let myDay: MyDayService;

beforeEach(async () => {
  team = await createTeam();
  myDay = createMyDayService(team.db);
});

const book = (
  memberId: string,
  title: string,
  startsAt: string,
  endsAt: string,
  roomId = team.bigRoom.id
) =>
  insertBooking(team.db, {
    attendees: 2,
    endsAt,
    memberId,
    roomId,
    startsAt,
    title,
  });

const task = (title: string, dueOn: string | null, assigneeId = team.ana.id) =>
  insertTask(team.db, {
    assigneeId,
    createdById: team.admin.id,
    dueOn,
    title,
  });

describe("myDay.get bookings", () => {
  test("includes a booking from the previous day that overlaps dayStart", async () => {
    await book(team.ana.id, "Late", "2026-10-22T23:00:00.000Z", at("01:00"));
    const result = await myDay.get(team.ana.id, INPUT);
    expect(result.bookings.map((b) => b.title)).toEqual(["Late"]);
  });

  test("excludes a booking ending exactly at dayStart", async () => {
    await book(team.ana.id, "Ends", "2026-10-22T23:00:00.000Z", DAY_START);
    expect((await myDay.get(team.ana.id, INPUT)).bookings).toEqual([]);
  });

  test("excludes a booking starting exactly at dayEnd", async () => {
    await book(team.ana.id, "Starts", DAY_END, "2026-10-24T01:00:00.000Z");
    expect((await myDay.get(team.ana.id, INPUT)).bookings).toEqual([]);
  });

  test("excludes cancelled bookings", async () => {
    const booking = await book(team.ana.id, "Gone", at("09:00"), at("10:00"));
    await cancelBooking(team.db, booking.id);
    expect((await myDay.get(team.ana.id, INPUT)).bookings).toEqual([]);
  });

  test("excludes other members' bookings and orders by start", async () => {
    await book(team.ben.id, "Ben", at("09:00"), at("10:00"), team.smallRoom.id);
    await book(team.ana.id, "Second", at("13:00"), at("14:00"));
    await book(team.ana.id, "First", at("09:00"), at("10:00"));
    const result = await myDay.get(team.ana.id, INPUT);
    expect(result.bookings.map((b) => b.title)).toEqual(["First", "Second"]);
  });
});

describe("myDay.get tasks", () => {
  test("excludes completed, undated, future and other members' tasks", async () => {
    const done = await task("Done", TODAY);
    await completeTask(team.db, done.id);
    await task("Undated", null);
    await task("Future", "2026-10-24");
    await task("Ben's", TODAY, team.ben.id);
    await task("Mine", TODAY);
    const result = await myDay.get(team.ana.id, INPUT);
    expect(result.tasks.map((t) => t.title)).toEqual(["Mine"]);
  });

  test("lists overdue tasks before tasks due today", async () => {
    await task("Today", TODAY);
    await task("Overdue", "2026-10-20");
    const result = await myDay.get(team.ana.id, INPUT);
    expect(result.tasks.map((t) => t.title)).toEqual(["Overdue", "Today"]);
  });
});

describe("myDay.get validation", () => {
  test("rejects dayEnd equal to or before dayStart", async () => {
    await expect(
      myDay.get(team.ana.id, { ...INPUT, dayEnd: DAY_START })
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      myDay.get(team.ana.id, { ...INPUT, dayEnd: "2026-10-22T00:00:00.000Z" })
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("accepts exactly 25 hours and rejects more", async () => {
    await expect(
      myDay.get(team.ana.id, { ...INPUT, dayEnd: "2026-10-24T01:00:00.000Z" })
    ).resolves.toBeDefined();
    await expect(
      myDay.get(team.ana.id, { ...INPUT, dayEnd: "2026-10-24T01:00:00.001Z" })
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("rejects malformed input", async () => {
    await expect(
      myDay.get(team.ana.id, { ...INPUT, today: "tomorrow" })
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("rejects an unknown member", async () => {
    await expect(myDay.get("999", INPUT)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
