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
// Torso and leg pairs, after classic minifig outfits.
export const OUTFITS = [
  { legs: "#1b1b1b", torso: "#38808c" },
  { legs: "#2c3e8c", torso: "#c4281c" },
  { legs: "#5a3a22", torso: "#2f7d4f" },
  { legs: "#1b1b1b", torso: "#f2a541" },
  { legs: "#4b4f54", torso: "#7a4fd1" },
  { legs: "#2c3e8c", torso: "#e8e8e8" },
] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type Mouth = (typeof MOUTHS)[number];

export interface Minifig {
  glasses: boolean;
  hairColour: string;
  hairStyle: HairStyle;
  legColour: string;
  mouth: Mouth;
  torsoColour: string;
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
  const outfit = pick<{ legs: string; torso: string }>(
    OUTFITS,
    Math.floor(value / 11)
  );
  return {
    glasses: Math.floor(value / 991) % 4 === 0,
    hairColour: pick(HAIR_COLOURS, Math.floor(value / 7)),
    hairStyle: pick(HAIR_STYLES, value),
    legColour: outfit.legs,
    mouth: pick(MOUTHS, Math.floor(value / 97)),
    torsoColour: outfit.torso,
  };
};
