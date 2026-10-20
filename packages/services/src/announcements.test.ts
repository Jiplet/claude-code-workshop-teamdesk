import { beforeEach, describe, expect, test } from "bun:test";
import {
  type AnnouncementsService,
  createAnnouncementsService,
} from "./announcements.ts";
import { createTeam, type Team } from "./fixtures.ts";

let team: Team;
let announcements: AnnouncementsService;

beforeEach(async () => {
  team = await createTeam();
  announcements = createAnnouncementsService(team.db);
});

describe("announcements service", () => {
  test("only admins post", async () => {
    await expect(
      announcements.post(team.ana.id, { body: "Hi" })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(
      (await announcements.post(team.admin.id, { body: " Hi " })).body
    ).toBe("Hi");
  });

  test("pinned announcements come first", async () => {
    const first = await announcements.post(team.admin.id, { body: "First" });
    await announcements.post(team.admin.id, { body: "Second" });
    await announcements.pin(team.admin.id, first.id, true);

    expect((await announcements.latest()).map((a) => a.body)).toEqual([
      "First",
      "Second",
    ]);
  });
});
