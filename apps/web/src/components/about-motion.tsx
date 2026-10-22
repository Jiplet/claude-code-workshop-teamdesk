import { useEffect, useState } from "react";

// A Bauhaus tile wall for the About page: a grid of quarter circles, circles,
// squares and triangles that keep turning and swapping, a light line that
// sweeps across, and a headline whose last word cycles behind a mask.

const COLUMNS = 12;
const ROWS = 5;
const TICK_MS = 1400;
const TILES_PER_TICK = 9;
const WORDS = ["rooms.", "bookings.", "tasks.", "your team."] as const;

const SHAPES = ["quarter", "half", "circle", "square", "triangle"] as const;
const COLOURS = [
  "#38808c",
  "#6fb2bd",
  "#f2a541",
  "#c4281c",
  "#f4f1ea",
] as const;

type Shape = (typeof SHAPES)[number];

interface Tile {
  colour: string;
  rotation: number;
  shape: Shape;
}

// Seeded, so the server and the browser draw the same first frame.
const seeded = (index: number, salt: number) =>
  Math.abs(Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453) % 1;

const pickFrom = <T,>(options: readonly [T, ...T[]], roll: number): T =>
  options[Math.floor(roll * options.length)] ?? options[0];

const INITIAL_TILES: Tile[] = Array.from(
  { length: COLUMNS * ROWS },
  (_, index) => ({
    colour: pickFrom(COLOURS, seeded(index, 1)),
    rotation: Math.floor(seeded(index, 2) * 4) * 90,
    shape: pickFrom(SHAPES, seeded(index, 3)),
  })
);

function TileShape({ colour, shape }: { colour: string; shape: Shape }) {
  switch (shape) {
    case "quarter":
      return <path d="M0 0 H100 A100 100 0 0 1 0 100 Z" fill={colour} />;
    case "half":
      return <path d="M0 0 H100 A50 50 0 0 1 0 0 Z" fill={colour} />;
    case "circle":
      return <circle cx="50" cy="50" fill={colour} r="38" />;
    case "square":
      return <rect fill={colour} height="64" width="64" x="18" y="18" />;
    default:
      return <path d="M0 100 L50 8 L100 100 Z" fill={colour} />;
  }
}

// Turns a handful of random tiles a quarter turn; with `reshape` they also
// take a new shape and colour.
const shuffleTiles = (previous: readonly Tile[], reshape: boolean): Tile[] => {
  const next = [...previous];
  for (let i = 0; i < TILES_PER_TICK; i += 1) {
    const index = Math.floor(Math.random() * next.length);
    const tile = next[index];
    if (tile) {
      next[index] = {
        colour: reshape ? pickFrom(COLOURS, Math.random()) : tile.colour,
        rotation: tile.rotation + (Math.random() < 0.5 ? 90 : -90),
        shape: reshape ? pickFrom(SHAPES, Math.random()) : tile.shape,
      };
    }
  }
  return next;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AboutMotion() {
  const [tiles, setTiles] = useState(INITIAL_TILES);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    let tick = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      tick += 1;
      // Every other tick the turned tiles also change shape and colour.
      setTiles((previous) => shuffleTiles(previous, tick % 2 === 0));
      if (tick % 2 === 0) {
        setWordIndex((index) => (index + 1) % WORDS.length);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <figure className="relative m-0 overflow-hidden rounded-2xl bg-[#191c1f] ring-1 ring-white/10">
      <div
        aria-hidden="true"
        className="grid"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile, index) => (
          <svg
            aria-hidden="true"
            className="about-tile block aspect-square w-full"
            // biome-ignore lint/suspicious/noArrayIndexKey: tiles are fixed grid cells; the index is their position
            key={index}
            style={{ transform: `rotate(${tile.rotation}deg)` }}
            viewBox="0 0 100 100"
          >
            <TileShape colour={tile.colour} shape={tile.shape} />
          </svg>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="about-sweep pointer-events-none absolute inset-x-0 top-1/2 h-px"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#191c1f] via-[#191c1f]/85 to-transparent px-6 pt-16 pb-6 sm:px-10 sm:pb-8">
        <p className="m-0 font-heading text-3xl text-white leading-tight sm:text-5xl">
          One desk for{" "}
          <span className="inline-block overflow-hidden align-bottom">
            <span
              className="about-word inline-block text-[#6fb2bd]"
              key={wordIndex}
            >
              {WORDS[wordIndex]}
            </span>
          </span>
        </p>
      </figcaption>
    </figure>
  );
}
