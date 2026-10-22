import type { Member } from "@repo/db/shared";
import type { CSSProperties, ReactNode } from "react";
import { MinifigHeadShape } from "#/components/minifig-head";
import { minifigFor } from "#/lib/minifig";

// The Team page header as a brickfilm in space: a gas giant, a brick-built
// capital ship drifting past, members flying starfighters with their head in
// the cockpit, and members duelling with laser swords on an asteroid. Every
// animation steps like stop-motion (about 12 frames a second) and the whole
// set wobbles a fraction between frames, the way a hand-animated film does.

const SKIN = "#f2cd37";
const BLADES = ["#5fd4ff", "#62f07a", "#ff4d4d", "#c77dff", "#ffd84d"] as const;
const MAX_CAST = 8;

// Stable per-member numbers from the id, so each member keeps their part.
const spread = (id: string, salt: number, size: number) => {
  let value = salt;
  for (const char of id) {
    value = (value * 31 + char.charCodeAt(0)) % 9973;
  }
  return value % size;
};

const seeded = (index: number, salt: number) =>
  Math.abs(Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453) % 1;

const STARS = Array.from({ length: 110 }, (_, index) => ({
  r: 0.4 + seeded(index, 3) * 1.1,
  twinkle: seeded(index, 4) < 0.25,
  x: seeded(index, 1) * 800,
  y: seeded(index, 2) * 320,
}));

// A plate of studs along the top edge of a brick, the detail that makes a
// shape read as LEGO rather than a flat drawing.
function Studs({
  count,
  fill,
  x,
  y,
}: {
  count: number;
  fill: string;
  x: number;
  y: number;
}) {
  return (
    <g fill={fill}>
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: studs are fixed positions on a brick
        <rect height="3" key={i} rx="0.8" width="6" x={x + i * 9} y={y - 3} />
      ))}
    </g>
  );
}

function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 320"
    >
      <defs>
        <radialGradient cx="0.35" cy="0.35" id="universe-planet" r="0.75">
          <stop offset="0" stopColor="#f6d6a8" />
          <stop offset="0.45" stopColor="#d8894b" />
          <stop offset="1" stopColor="#3a1c12" />
        </radialGradient>
        <radialGradient cx="0.7" cy="0.4" id="universe-nebula" r="0.6">
          <stop offset="0" stopColor="#38808c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#05060d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect fill="url(#universe-nebula)" height="320" width="800" />
      {STARS.map((star, index) => (
        <circle
          className={star.twinkle ? "universe-twinkle" : undefined}
          cx={star.x}
          cy={star.y}
          fill="#fff"
          // biome-ignore lint/suspicious/noArrayIndexKey: stars are a fixed, seeded field
          key={index}
          opacity={0.4 + star.r / 2}
          r={star.r}
          style={{ animationDelay: `${-index * 0.37}s` }}
        />
      ))}
      <g className="universe-planet">
        <circle cx="610" cy="250" fill="url(#universe-planet)" r="150" />
        <g fill="#000" opacity="0.12">
          <ellipse cx="610" cy="200" rx="150" ry="9" />
          <ellipse cx="610" cy="245" rx="150" ry="6" />
          <ellipse cx="610" cy="290" rx="150" ry="12" />
        </g>
        <ellipse
          cx="610"
          cy="250"
          fill="none"
          opacity="0.5"
          rx="230"
          ry="34"
          stroke="#f6d6a8"
          strokeWidth="4"
          transform="rotate(-12 610 250)"
        />
      </g>
    </svg>
  );
}

// A wedge of grey bricks with engine glow, crossing the scene very slowly.
function CapitalShip() {
  return (
    <div className="absolute inset-y-0 right-0 w-3/5 overflow-hidden">
      <div className="universe-capital absolute top-5 left-0 w-1/2">
        <svg aria-hidden="true" className="w-full" viewBox="0 0 260 90">
          <path d="M0 52 L200 20 H250 V78 H200 Z" fill="#7d838a" />
          <path d="M0 52 L200 50 H250 V78 H200 Z" fill="#5b6066" />
          <rect fill="#9aa1a8" height="12" width="44" x="170" y="10" />
          <rect fill="#9aa1a8" height="10" width="22" x="185" y="0" />
          <Studs count={4} fill="#a9b0b7" x={172} y={10} />
          <Studs count={2} fill="#a9b0b7" x={187} y={0} />
          <g fill="#c7ccd1" opacity="0.6">
            <rect height="2" width="60" x="90" y="40" />
            <rect height="2" width="90" x="120" y="62" />
          </g>
          <g className="universe-engine" fill="#7fe3ff">
            <rect height="10" rx="3" width="8" x="250" y="28" />
            <rect height="10" rx="3" width="8" x="250" y="46" />
            <rect height="10" rx="3" width="8" x="250" y="64" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Starfighter({ seed }: { seed: string }) {
  const { torsoColour } = minifigFor(seed);
  return (
    <svg
      aria-hidden="true"
      className="w-full overflow-visible"
      viewBox="0 0 120 64"
    >
      <rect
        className="universe-bolt"
        fill="#ff5a4d"
        height="2"
        rx="1"
        width="16"
        x="112"
        y="33"
      />
      <path d="M30 6 H62 L72 22 H40 Z" fill="#d7dbe0" />
      <path d="M30 58 H62 L72 42 H40 Z" fill="#d7dbe0" />
      <rect fill={torsoColour} height="4" width="26" x="34" y="8" />
      <rect fill={torsoColour} height="4" width="26" x="34" y="52" />
      <Studs count={3} fill="#eef0f2" x={36} y={6} />
      <path d="M14 24 H96 L114 32 L96 40 H14 Z" fill="#eef0f2" />
      <path d="M14 34 H96 L114 32 L96 40 H14 Z" fill="#b9bfc5" />
      <g className="universe-engine" fill="#ffb347">
        <rect height="10" rx="3" width="10" x="2" y="27" />
      </g>
      <path d="M50 24 a18 14 0 0 1 36 0 Z" fill="#9fd8ff" opacity="0.55" />
      <g transform="translate(57 7) scale(0.27)">
        <MinifigHeadShape seed={seed} />
      </g>
      <path
        d="M50 24 a18 14 0 0 1 36 0"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
    </svg>
  );
}

// A full minifigure with a laser sword in its raised right hand.
function Duelist({ blade, seed }: { blade: string; seed: string }) {
  const { legColour, torsoColour } = minifigFor(seed);
  return (
    <svg
      aria-hidden="true"
      className="h-full w-auto overflow-visible"
      viewBox="0 0 90 132"
    >
      <rect fill={legColour} height="30" rx="2" width="17" x="14" y="96" />
      <rect fill={legColour} height="30" rx="2" width="17" x="33" y="96" />
      <rect fill={legColour} height="7" rx="1.5" width="38" x="13" y="91" />
      <rect fill={torsoColour} height="26" rx="4" width="9" x="8" y="60" />
      <circle cx="12.5" cy="88" fill={SKIN} r="4.5" />
      <path d="M19 57 H45 L51 93 H13 Z" fill={torsoColour} />
      <path d="M19 57 H45 L46 63 H18 Z" fill="#000" opacity="0.12" />
      <g transform="translate(5 2) scale(0.84)">
        <MinifigHeadShape seed={seed} />
      </g>
      <g className="universe-swing">
        <rect fill={torsoColour} height="24" rx="4" width="9" x="47" y="58" />
        <circle cx="51.5" cy="84" fill={SKIN} r="4.5" />
        <rect fill="#9aa1a8" height="12" rx="1" width="5" x="49" y="74" />
        <rect
          className="universe-blade"
          fill="#fff"
          height="58"
          rx="2.5"
          style={{
            filter: `drop-shadow(0 0 4px ${blade}) drop-shadow(0 0 8px ${blade})`,
          }}
          width="5"
          x="49"
          y="16"
        />
      </g>
    </svg>
  );
}

function Asteroid({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-[6%] bottom-4 flex w-[44%] flex-col items-center">
      <div className="flex items-end justify-center gap-6">{children}</div>
      <svg aria-hidden="true" className="-mt-1 w-full" viewBox="0 0 200 26">
        <path d="M8 4 H192 L176 22 L120 26 L40 24 L18 18 Z" fill="#6b5a4e" />
        <path d="M8 4 H192 L188 9 H12 Z" fill="#8a776a" />
        <Studs count={21} fill="#9b877a" x={12} y={4} />
      </svg>
    </div>
  );
}

export default function TeamUniverse({
  members,
}: {
  members: readonly Member[];
}) {
  const cast = members.slice(0, MAX_CAST);
  const pilots = cast.filter((_, index) => index % 2 === 0);
  const duelists = cast.filter((_, index) => index % 2 === 1);

  return (
    <div aria-hidden="true" className="universe-boil absolute inset-0">
      <Backdrop />
      <CapitalShip />
      {pilots.map((member, index) => {
        const style = {
          "--delay": `${-spread(member.id, 3, 7) - index * 2.3}s`,
          "--flight": `${7 + spread(member.id, 5, 4)}s`,
          top: `${30 + ((index * 23 + spread(member.id, 9, 12)) % 40)}%`,
        } as CSSProperties;
        return (
          <div
            className="universe-pilot absolute left-0 w-28"
            key={member.id}
            style={style}
          >
            <Starfighter seed={member.id} />
            <p className="m-0 text-center font-medium text-[10px] text-white/70">
              {member.name.split(" ")[0]}
            </p>
          </div>
        );
      })}
      {duelists.length > 0 ? (
        <Asteroid>
          {duelists.map((member, index) => (
            <div
              className={`flex h-32 flex-col items-center ${index % 2 === 1 ? "universe-facing-left" : ""}`}
              key={member.id}
              style={{ animationDelay: `${-index * 0.6}s` } as CSSProperties}
            >
              <div className="universe-figure h-full">
                <Duelist
                  blade={
                    BLADES[spread(member.id, 13, BLADES.length)] ?? BLADES[0]
                  }
                  seed={member.id}
                />
              </div>
              <p className="m-0 text-center font-medium text-[10px] text-white/70">
                {member.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </Asteroid>
      ) : null}
    </div>
  );
}
