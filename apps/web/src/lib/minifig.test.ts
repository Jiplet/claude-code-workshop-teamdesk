import { describe, expect, test } from "bun:test";
import { HAIR_STYLES, minifigFor } from "./minifig.ts";

describe("minifigFor", () => {
  test("gives the same member the same head every time", () => {
    expect(minifigFor("42")).toEqual(minifigFor("42"));
  });

  test("varies the head across members", () => {
    const styles = new Set(
      Array.from({ length: 40 }, (_, i) => minifigFor(String(i)).hairStyle)
    );
    expect(styles.size).toBe(HAIR_STYLES.length);
  });
});
