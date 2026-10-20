import { beforeEach, describe, expect, test } from "bun:test";
import { getRoom, insertRoom, listRooms, setRoomArchived } from "./rooms.ts";
import type { Database } from "./schema.ts";
import { createTestDatabase } from "./testing.ts";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
});

describe("rooms", () => {
  test("insertRoom returns the stored room", async () => {
    const room = await insertRoom(db, "Harbour", 8);

    expect(room).toEqual({
      archived: false,
      capacity: 8,
      id: room.id,
      name: "Harbour",
    });
    expect(await getRoom(db, room.id)).toEqual(room);
  });

  test("listRooms hides archived rooms unless asked", async () => {
    const harbour = await insertRoom(db, "Harbour", 8);
    await insertRoom(db, "Bridge", 4);
    await setRoomArchived(db, harbour.id, true);

    expect((await listRooms(db)).map((r) => r.name)).toEqual(["Bridge"]);
    expect(
      (await listRooms(db, { includeArchived: true })).map((r) => r.name)
    ).toEqual(["Bridge", "Harbour"]);
  });
});
