// Lays out the furniture for a room's isometric preview from its capacity.
// Units are studs on a 12 by 9 baseplate; x runs to the back-right wall's
// length, y away from it, z up.

export const FLOOR_WIDTH = 12;
export const FLOOR_DEPTH = 9;
/** Larger rooms draw this many chairs and label the rest. */
export const MAX_DRAWN_SEATS = 32;

export type RoomStyle = "booth" | "boardroom" | "theatre";

export interface Block {
  d: number;
  h: number;
  kind: "chair" | "table";
  w: number;
  x: number;
  y: number;
}

export interface RoomLayout {
  blocks: Block[];
  hiddenSeats: number;
  style: RoomStyle;
}

const CHAIR = 0.8;

const chair = (x: number, y: number): Block => ({
  d: CHAIR,
  h: 0.7,
  kind: "chair",
  w: CHAIR,
  x,
  y,
});

const booth = (capacity: number): RoomLayout => {
  const blocks: Block[] = [
    { d: 1.4, h: 1, kind: "table", w: 1.4, x: 5.3, y: 3.8 },
    chair(5.6, 2.6),
  ];
  if (capacity > 1) {
    blocks.push(chair(5.6, 5.6));
  }
  return { blocks, hiddenSeats: 0, style: "booth" };
};

// A long table with chairs down both sides, and one at each end from six up.
const boardroom = (capacity: number): RoomLayout => {
  const ends = capacity >= 6 ? 2 : 0;
  const perSide = Math.ceil((capacity - ends) / 2);
  const length = Math.max(2.4, perSide * 1.2);
  const x = (FLOOR_WIDTH - length) / 2;
  const y = 3.6;
  const blocks: Block[] = [{ d: 1.8, h: 1, kind: "table", w: length, x, y }];
  for (let i = 0; i < capacity - ends; i += 1) {
    const side = i % 2 === 0 ? y - 1.1 : y + 2.1;
    blocks.push(chair(x + 0.2 + Math.floor(i / 2) * 1.2, side));
  }
  if (ends) {
    blocks.push(chair(x - 1.1, y + 0.5), chair(x + length + 0.3, y + 0.5));
  }
  return { blocks, hiddenSeats: 0, style: "boardroom" };
};

// Rows of chairs facing the screen on the back-right wall.
const theatre = (capacity: number): RoomLayout => {
  const drawn = Math.min(capacity, MAX_DRAWN_SEATS);
  const perRow = 8;
  const blocks = Array.from({ length: drawn }, (_, i) =>
    chair(1.6 + (i % perRow) * 1.2, 2.4 + Math.floor(i / perRow) * 1.5)
  );
  return { blocks, hiddenSeats: capacity - drawn, style: "theatre" };
};

export const layoutRoom = (capacity: number): RoomLayout => {
  if (capacity <= 2) {
    return booth(capacity);
  }
  if (capacity <= 12) {
    return boardroom(capacity);
  }
  return theatre(capacity);
};

/** Back to front, so nearer blocks paint over further ones. */
export const paintOrder = (blocks: readonly Block[]): Block[] =>
  [...blocks].sort((a, b) => a.x + a.y - (b.x + b.y));
