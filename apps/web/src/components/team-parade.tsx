import type { Member } from "@repo/db/shared";
import type { CSSProperties } from "react";
import { MinifigHeadShape } from "#/components/minifig-head";
import { minifigFor } from "#/lib/minifig";

// The team as walking minifigures: each member strolls back and forth along
// a floor behind the Team page header, turning at each end. The look of each
// figure comes from the member's id, like their head on the members list.

const MAX_WALKERS = 8;
const SKIN = "#f2cd37";

// Stable per-member numbers from the id, so a member keeps the same pace.
const spread = (id: string, salt: number, size: number) => {
  let value = salt;
  for (const char of id) {
    value = (value * 31 + char.charCodeAt(0)) % 9973;
  }
  return value % size;
};

function Minifig({ seed }: { seed: string }) {
  const { legColour, torsoColour } = minifigFor(seed);
  return (
    <svg
      aria-hidden="true"
      className="parade-lean h-full w-auto overflow-visible"
      viewBox="0 0 64 132"
    >
      <ellipse cx="32" cy="130" fill="#191c1f" opacity="0.12" rx="22" ry="3" />
      <g className="parade-bob">
        <g className="parade-swing-b">
          <rect fill={torsoColour} height="26" rx="4" width="9" x="8" y="60" />
          <circle cx="12.5" cy="88" fill={SKIN} r="4.5" />
        </g>
        <g className="parade-swing-a">
          <rect fill={legColour} height="30" rx="2" width="17" x="14" y="96" />
          <rect
            fill="#000"
            height="4"
            opacity="0.2"
            width="17"
            x="14"
            y="122"
          />
        </g>
        <g className="parade-swing-b">
          <rect fill={legColour} height="30" rx="2" width="17" x="33" y="96" />
          <rect
            fill="#000"
            height="4"
            opacity="0.2"
            width="17"
            x="33"
            y="122"
          />
        </g>
        <rect fill={legColour} height="7" rx="1.5" width="38" x="13" y="91" />
        <path d="M19 57 H45 L51 93 H13 Z" fill={torsoColour} />
        <path d="M19 57 H45 L46 63 H18 Z" fill="#000" opacity="0.12" />
        <g transform="translate(5 2) scale(0.84)">
          <MinifigHeadShape seed={seed} />
        </g>
        <g className="parade-swing-a">
          <rect fill={torsoColour} height="26" rx="4" width="9" x="47" y="60" />
          <circle cx="51.5" cy="88" fill={SKIN} r="4.5" />
        </g>
      </g>
    </svg>
  );
}

export default function TeamParade({
  members,
}: {
  members: readonly Member[];
}) {
  const walkers = members.slice(0, MAX_WALKERS);
  const lane = 100 / Math.max(walkers.length, 1);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 bottom-0 hidden h-44 w-[min(48%,560px)] lg:block"
    >
      <div className="absolute inset-x-0 bottom-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      {walkers.map((member, index) => {
        // Three depth lanes: walkers further back stand higher, smaller and
        // fainter, so figures pass behind each other instead of colliding.
        const depth = index % 3;
        const style = {
          "--delay": `${-spread(member.id, 3, 9)}s`,
          "--range": `${110 + spread(member.id, 7, 120)}px`,
          "--stroll": `${10 + spread(member.id, 11, 7)}s`,
          bottom: `${depth * 18}px`,
          left: `${(index * lane * 0.6 + depth * 7) % 60}%`,
          opacity: 1 - depth * 0.18,
          scale: `${1 - depth * 0.14}`,
          transformOrigin: "50% 100%",
          zIndex: 3 - depth,
        } as CSSProperties;
        return (
          <div className="parade-walker" key={member.id} style={style}>
            <div className="parade-facing h-28">
              <Minifig seed={member.id} />
            </div>
            <p className="m-0 mt-0.5 text-center font-medium text-[11px] text-muted-foreground">
              {member.name.split(" ")[0]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
