import {
  type Block,
  FLOOR_DEPTH,
  FLOOR_WIDTH,
  layoutRoom,
  paintOrder,
  type RoomStyle,
} from "#/lib/room-layout";

// A room as an isometric brick build: a studded baseplate, two brick walls
// with a window and a screen, and the table and chairs from its capacity.

const WALL_HEIGHT = 4;

interface Theme {
  accent: [string, string, string];
  wall: [string, string];
}

// Wall colours (lit, shaded) and furniture colours (top, right, left face).
const THEMES: readonly [Theme, ...Theme[]] = [
  { accent: ["#f2a541", "#d0852a", "#b06f1f"], wall: ["#e9e4d8", "#d6d0c2"] },
  { accent: ["#c4281c", "#a32116", "#851a11"], wall: ["#dfe8ea", "#c8d5d8"] },
  { accent: ["#38808c", "#2e6d78", "#245a63"], wall: ["#efe6da", "#ddd1c2"] },
  { accent: ["#2c3e8c", "#243377", "#1c2861"], wall: ["#e6e8ec", "#d2d6dc"] },
];

const TABLE: [string, string, string] = ["#8a5a3c", "#734a31", "#5e3c27"];

const point = (x: number, y: number, z = 0): [number, number] => [
  (x - y) * 13 + 127,
  (x + y) * 7.5 - z * 15 + 72,
];

const project = (x: number, y: number, z = 0) => point(x, y, z).join(",");

function Edge({ from, to }: { from: [number, number]; to: [number, number] }) {
  return <line x1={from[0]} x2={to[0]} y1={from[1]} y2={to[1]} />;
}

const polygon = (...points: [number, number, number][]) =>
  points.map(([x, y, z]) => project(x, y, z)).join(" ");

function Box({
  block,
  colours,
}: {
  block: Block;
  colours: [string, string, string];
}) {
  const { d, h, w, x, y } = block;
  const [top, right, left] = colours;
  return (
    <g>
      <polygon
        fill={right}
        points={polygon(
          [x + w, y, 0],
          [x + w, y + d, 0],
          [x + w, y + d, h],
          [x + w, y, h]
        )}
      />
      <polygon
        fill={left}
        points={polygon(
          [x, y + d, 0],
          [x + w, y + d, 0],
          [x + w, y + d, h],
          [x, y + d, h]
        )}
      />
      <polygon
        fill={top}
        points={polygon(
          [x, y, h],
          [x + w, y, h],
          [x + w, y + d, h],
          [x, y + d, h]
        )}
      />
    </g>
  );
}

function Walls({ style, theme }: { style: RoomStyle; theme: Theme }) {
  const [lit, shade] = theme.wall;
  const screenFrom = style === "theatre" ? 2 : 4;
  const screenTo = style === "theatre" ? 10 : 8;
  return (
    <g>
      <polygon
        fill={shade}
        points={polygon(
          [0, 0, 0],
          [0, FLOOR_DEPTH, 0],
          [0, FLOOR_DEPTH, WALL_HEIGHT],
          [0, 0, WALL_HEIGHT]
        )}
      />
      <polygon
        fill={lit}
        points={polygon(
          [0, 0, 0],
          [FLOOR_WIDTH, 0, 0],
          [FLOOR_WIDTH, 0, WALL_HEIGHT],
          [0, 0, WALL_HEIGHT]
        )}
      />
      <g opacity="0.25" stroke="#000" strokeWidth="0.5">
        {[1, 2, 3].map((z) => (
          <g key={z}>
            <Edge from={point(0, 0, z)} to={point(FLOOR_WIDTH, 0, z)} />
            <Edge from={point(0, 0, z)} to={point(0, FLOOR_DEPTH, z)} />
          </g>
        ))}
      </g>
      <polygon
        fill="#9fd8ff"
        points={polygon([0, 3, 1.4], [0, 6.5, 1.4], [0, 6.5, 3.2], [0, 3, 3.2])}
        stroke="#fff"
        strokeWidth="1.5"
      />
      {style === "booth" ? (
        <polygon
          fill="#6fb2bd"
          points={polygon(
            [5, 0, 1.6],
            [7.5, 0, 1.6],
            [7.5, 0, 3.2],
            [5, 0, 3.2]
          )}
          stroke="#f4f1ea"
          strokeWidth="2"
        />
      ) : (
        <polygon
          fill="#191c1f"
          points={polygon(
            [screenFrom, 0, 1.2],
            [screenTo, 0, 1.2],
            [screenTo, 0, 3.3],
            [screenFrom, 0, 3.3]
          )}
          stroke="#6fb2bd"
          strokeWidth="1"
        />
      )}
    </g>
  );
}

function Baseplate() {
  return (
    <g>
      <polygon
        fill="#b9c0c6"
        points={polygon(
          [FLOOR_WIDTH, 0, 0],
          [FLOOR_WIDTH, FLOOR_DEPTH, 0],
          [FLOOR_WIDTH, FLOOR_DEPTH, -0.4],
          [FLOOR_WIDTH, 0, -0.4]
        )}
      />
      <polygon
        fill="#a2a9b0"
        points={polygon(
          [0, FLOOR_DEPTH, 0],
          [FLOOR_WIDTH, FLOOR_DEPTH, 0],
          [FLOOR_WIDTH, FLOOR_DEPTH, -0.4],
          [0, FLOOR_DEPTH, -0.4]
        )}
      />
      <polygon
        fill="#d3d8dc"
        points={polygon(
          [0, 0, 0],
          [FLOOR_WIDTH, 0, 0],
          [FLOOR_WIDTH, FLOOR_DEPTH, 0],
          [0, FLOOR_DEPTH, 0]
        )}
      />
      <g fill="#e4e8eb">
        {Array.from({ length: FLOOR_WIDTH * FLOOR_DEPTH }, (_, index) => {
          const [cx, cy] = point(
            (index % FLOOR_WIDTH) + 0.5,
            Math.floor(index / FLOOR_WIDTH) + 0.5
          );
          // biome-ignore lint/suspicious/noArrayIndexKey: studs are fixed grid positions
          return <ellipse cx={cx} cy={cy} key={index} rx="3.4" ry="1.9" />;
        })}
      </g>
    </g>
  );
}

const themeFor = (id: string) => {
  let value = 0;
  for (const char of id) {
    value = (value * 31 + char.charCodeAt(0)) % 9973;
  }
  return THEMES[value % THEMES.length] ?? THEMES[0];
};

export default function RoomDesign({
  capacity,
  id,
  name,
}: {
  capacity: number;
  id: string;
  name: string;
}) {
  const theme = themeFor(id);
  const { blocks, hiddenSeats, style } = layoutRoom(capacity);
  return (
    <svg
      aria-label={`${name}: a ${style} for ${capacity}`}
      className="h-auto w-full"
      role="img"
      viewBox="0 0 300 240"
    >
      <Baseplate />
      <Walls style={style} theme={theme} />
      {paintOrder(blocks).map((block, index) => (
        <Box
          block={block}
          colours={block.kind === "table" ? TABLE : theme.accent}
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks are a fixed layout for this capacity
          key={index}
        />
      ))}
      {hiddenSeats > 0 ? (
        <text
          fill="#191c1f"
          fontSize="11"
          fontWeight="600"
          textAnchor="end"
          x="290"
          y="232"
        >
          +{hiddenSeats} more seats
        </text>
      ) : null}
    </svg>
  );
}
