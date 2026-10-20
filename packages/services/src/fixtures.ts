// Test fixtures, not for app code. A small team and two rooms on a fresh
// in-memory database.
import type { Database } from "@repo/db";
import { createMember } from "@repo/db/members";
import { insertRoom } from "@repo/db/rooms";
import type { Member, Room } from "@repo/db/shared";
import { createTestDatabase } from "@repo/db/testing";

export interface Team {
  admin: Member;
  ana: Member;
  ben: Member;
  bigRoom: Room;
  db: Database;
  smallRoom: Room;
}

export async function createTeam(): Promise<Team> {
  const db = createTestDatabase();
  return {
    admin: await createMember(db, {
      email: "kim@example.com",
      name: "Kim",
      role: "admin",
    }),
    ana: await createMember(db, {
      email: "ana@example.com",
      name: "Ana",
      role: "member",
    }),
    ben: await createMember(db, {
      email: "ben@example.com",
      name: "Ben",
      role: "member",
    }),
    bigRoom: await insertRoom(db, "Harbour", 10),
    db,
    smallRoom: await insertRoom(db, "Bridge", 2),
  };
}

/** 23 October 2026 at `time` (HH:MM), UTC. */
export const at = (time: string): string => `2026-10-23T${time}:00.000Z`;
