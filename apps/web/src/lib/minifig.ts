// Picks the look of a member's minifigure head from their id, so the same
// member always gets the same head and a new member gets one straight away.

export const HAIR_STYLES = ["swept", "short", "bob", "bun", "bald"] as const;
export const HAIR_COLOURS = [
  "#1b1b1b",
  "#5a3a22",
  "#c98a2c",
  "#a33a1e",
  "#8a8d91",
] as const;
export const MOUTHS = ["grin", "smile", "smirk"] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type Mouth = (typeof MOUTHS)[number];

export interface Minifig {
  glasses: boolean;
  hairColour: string;
  hairStyle: HairStyle;
  mouth: Mouth;
}

// A small multiplicative hash: stable, and spreads short ids like "1" and "2"
// apart. Math.imul keeps it in 32-bit integers.
const hash = (seed: string) => {
  let value = 7;
  for (const char of seed) {
    value = Math.imul(value + char.charCodeAt(0), 2_654_435_761);
  }
  return Math.abs(value);
};

const pick = <T>(options: readonly [T, ...T[]], value: number): T =>
  options[value % options.length] ?? options[0];

export const minifigFor = (seed: string): Minifig => {
  const value = hash(seed);
  return {
    glasses: Math.floor(value / 991) % 4 === 0,
    hairColour: pick(HAIR_COLOURS, Math.floor(value / 7)),
    hairStyle: pick(HAIR_STYLES, value),
    mouth: pick(MOUTHS, Math.floor(value / 97)),
  };
};
