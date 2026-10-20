import { beforeEach, describe, expect, test } from "bun:test";
import { createTeam, type Team } from "./fixtures.ts";
import { createRoomsService, type RoomsService } from "./rooms.ts";

let team: Team;
let rooms: RoomsService;

beforeEach(async () => {
  team = await createTeam();
  rooms = createRoomsService(team.db);
});

describe("rooms service", () => {
  test("an admin adds a room", async () => {
    const result = await rooms.add(team.admin.id, {
      capacity: 6,
      name: "Quay",
    });

    expect(result.ok).toBe(true);
    expect((await rooms.list()).map((r) => r.name)).toContain("Quay");
  });

  test("members cannot add rooms", async () => {
    const result = await rooms.add(team.ana.id, { capacity: 6, name: "Quay" });

    expect(result).toEqual({ error: "Only admins can add rooms.", ok: false });
  });

  test("duplicate names are refused", async () => {
    const result = await rooms.add(team.admin.id, {
      capacity: 6,
      name: "Harbour",
    });

    expect(result.ok).toBe(false);
  });

  test("archiving hides a room from the default list", async () => {
    const result = await rooms.archive(team.admin.id, team.bigRoom.id);

    expect(result.ok).toBe(true);
    expect((await rooms.list()).map((r) => r.name)).toEqual(["Bridge"]);
  });
});
