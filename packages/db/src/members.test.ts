import { beforeEach, describe, expect, test } from "bun:test";
import {
  createMember,
  getMember,
  getMemberByEmail,
  listMembers,
  updateMemberRole,
} from "./members.ts";
import type { Database } from "./schema.ts";
import { createTestDatabase } from "./testing.ts";

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
});

describe("members", () => {
  test("createMember stores the member with a join date", async () => {
    const member = await createMember(db, {
      email: "ana@example.com",
      name: "Ana",
      role: "admin",
    });

    expect(member).toMatchObject({ name: "Ana", role: "admin" });
    expect(await getMember(db, member.id)).toEqual(member);
    expect(await getMemberByEmail(db, "ana@example.com")).toEqual(member);
  });

  test("getMember returns null for an unknown id", async () => {
    expect(await getMember(db, "999")).toBeNull();
  });

  test("listMembers sorts by name", async () => {
    await createMember(db, {
      email: "zoe@example.com",
      name: "Zoe",
      role: "member",
    });
    await createMember(db, {
      email: "ana@example.com",
      name: "Ana",
      role: "member",
    });

    expect((await listMembers(db)).map((m) => m.name)).toEqual(["Ana", "Zoe"]);
  });

  test("updateMemberRole changes the role", async () => {
    const member = await createMember(db, {
      email: "ana@example.com",
      name: "Ana",
      role: "member",
    });

    expect((await updateMemberRole(db, member.id, "admin"))?.role).toBe(
      "admin"
    );
  });
});
