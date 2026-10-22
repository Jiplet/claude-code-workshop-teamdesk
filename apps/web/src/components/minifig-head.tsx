import { type HairStyle, type Mouth, minifigFor } from "#/lib/minifig";

// A Lego minifigure head, after the figure in the brand header: yellow
// cylinder, stud on top, dot eyes, and hair or glasses picked per member.

const SKIN = "#f2cd37";
const SKIN_SHADE = "#d9ae1f";
const INK = "#1b1b1b";

const HAIR_PATHS: Record<Exclude<HairStyle, "bald">, string> = {
  bob: "M11 40 C9 14 18 5 32 5 C46 5 55 14 53 40 L48 40 C48 26 46 20 40 18 C32 22 22 22 16 19 C16 28 16 34 16 40 Z",
  bun: "M12 26 C12 11 20 6 32 6 C44 6 52 11 52 26 C48 20 40 17 32 17 C24 17 16 20 12 26 Z M25 6 a7 6 0 1 1 14 0 a7 6 0 1 1 -14 0 Z",
  short:
    "M12 25 C12 11 20 6 32 6 C44 6 52 11 52 25 C50 19 44 16 38 16 C34 18 28 18 24 16 C18 16 14 19 12 25 Z",
  swept:
    "M11 28 C9 15 15 4 28 4 C33 2 40 3 44 6 C50 7 55 14 53 27 C51 20 47 18 44 21 C42 16 36 15 32 18 C28 14 21 15 19 20 C16 18 12 21 11 28 Z",
};

const MOUTH_PATHS: Record<Mouth, string> = {
  grin: "M24 37 C27 44 37 44 40 37 Z",
  smile: "M25 38 C28 42 36 42 39 38",
  smirk: "M26 39 C30 41 35 40 39 36",
};

interface MinifigHeadProps {
  className?: string;
  name: string;
  seed: string;
}

export default function MinifigHead({
  className,
  name,
  seed,
}: MinifigHeadProps) {
  const { glasses, hairColour, hairStyle, mouth } = minifigFor(seed);

  return (
    <svg
      aria-label={`${name} as a minifigure`}
      className={className}
      role="img"
      viewBox="0 0 64 64"
    >
      <rect fill={SKIN_SHADE} height="7" rx="2" width="18" x="23" y="3" />
      <rect fill={SKIN_SHADE} height="7" rx="2" width="22" x="21" y="52" />
      <rect fill={SKIN} height="44" rx="10" width="40" x="12" y="9" />
      <rect
        fill="#fff"
        height="30"
        opacity="0.25"
        rx="3"
        width="5"
        x="16"
        y="16"
      />
      <g fill="none" stroke={INK} strokeLinecap="round" strokeWidth="1.6">
        <path d="M22 25 Q25.5 23 29 25" />
        <path d="M35 25 Q38.5 23 42 25" />
      </g>
      <circle cx="25.5" cy="30" fill={INK} r="2.6" />
      <circle cx="38.5" cy="30" fill={INK} r="2.6" />
      <circle cx="26.3" cy="29.2" fill="#fff" r="0.8" />
      <circle cx="39.3" cy="29.2" fill="#fff" r="0.8" />
      {mouth === "grin" ? (
        <path d={MOUTH_PATHS.grin} fill="#fff" stroke={INK} strokeWidth="1.6" />
      ) : (
        <path
          d={MOUTH_PATHS[mouth]}
          fill="none"
          stroke={INK}
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      )}
      {glasses ? (
        <g fill="none" stroke={INK} strokeWidth="1.4">
          <rect height="8" rx="3" width="10" x="20.5" y="26" />
          <rect height="8" rx="3" width="10" x="33.5" y="26" />
          <path d="M30.5 29 L33.5 29" />
        </g>
      ) : null}
      {hairStyle === "bald" ? null : (
        <path d={HAIR_PATHS[hairStyle]} fill={hairColour} />
      )}
    </svg>
  );
}
