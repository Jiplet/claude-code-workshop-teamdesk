import { describe, expect, test } from "bun:test";
import {
  FLOOR_DEPTH,
  FLOOR_WIDTH,
  layoutRoom,
  MAX_DRAWN_SEATS,
} from "./room-layout.ts";

const seats = (capacity: number) =>
  layoutRoom(capacity).blocks.filter((block) => block.kind === "chair").length;

describe("layoutRoom", () => {
  test("draws one chair per seat up to the drawing limit", () => {
    for (const capacity of [1, 2, 3, 6, 10, 12, 20, MAX_DRAWN_SEATS]) {
      expect(seats(capacity)).toBe(capacity);
    }
  });

  test("picks a style from the capacity", () => {
    expect(layoutRoom(2).style).toBe("booth");
    expect(layoutRoom(6).style).toBe("boardroom");
    expect(layoutRoom(40).style).toBe("theatre");
  });

  test("labels the seats a big room cannot draw", () => {
    expect(layoutRoom(200)).toMatchObject({
      hiddenSeats: 200 - MAX_DRAWN_SEATS,
    });
    expect(seats(200)).toBe(MAX_DRAWN_SEATS);
  });

  test("keeps every block on the baseplate", () => {
    for (const capacity of [1, 2, 5, 12, 13, 200]) {
      for (const block of layoutRoom(capacity).blocks) {
        expect(block.x).toBeGreaterThanOrEqual(0);
        expect(block.y).toBeGreaterThanOrEqual(0);
        expect(block.x + block.w).toBeLessThanOrEqual(FLOOR_WIDTH);
        expect(block.y + block.d).toBeLessThanOrEqual(FLOOR_DEPTH);
      }
    }
  });
});
