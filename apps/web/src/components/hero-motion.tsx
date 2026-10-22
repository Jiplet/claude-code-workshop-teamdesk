import { useEffect, useRef, useState } from "react";

// A particle showreel for the front page: a few thousand points of teal light
// that settle into one picture per Teamdesk page, then scatter into the next.

const PARTICLE_COUNT = 2200;
const SCENE_MS = 3800;
const FIELD_WIDTH = 480;
const FIELD_HEIGHT = 300;

interface Point {
  x: number;
  y: number;
}

interface Particle extends Point {
  vx: number;
  vy: number;
}

interface Scene {
  caption: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
  label: string;
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

const SCENES: readonly [Scene, ...Scene[]] = [
  {
    caption: "Every room, mapped.",
    draw: (ctx) => {
      // A floor plan: four rooms of different sizes.
      ctx.lineWidth = 10;
      for (const [x, y, w, h] of [
        [70, 50, 170, 110],
        [250, 50, 160, 110],
        [70, 170, 110, 90],
        [190, 170, 220, 90],
      ] as const) {
        roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();
      }
    },
    label: "Rooms",
  },
  {
    caption: "Book a slot without the back and forth.",
    draw: (ctx) => {
      // A week of slots, three of them taken.
      const taken = new Set([3, 9, 16]);
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 7; col += 1) {
          const index = row * 7 + col;
          roundRect(ctx, 70 + col * 50, 50 + row * 52, 40, 42, 6);
          if (taken.has(index)) {
            ctx.fill();
          } else {
            ctx.lineWidth = 5;
            ctx.stroke();
          }
        }
      }
    },
    label: "Bookings",
  },
  {
    caption: "Tasks move from to do to done.",
    draw: (ctx) => {
      // Three kanban columns, the cards thinning out towards done.
      for (const [column, cards] of [4, 3, 2].entries()) {
        const x = 75 + column * 115;
        ctx.lineWidth = 4;
        roundRect(ctx, x, 40, 100, 220, 12);
        ctx.stroke();
        for (let card = 0; card < cards; card += 1) {
          roundRect(ctx, x + 12, 56 + card * 50, 76, 38, 6);
          ctx.fill();
        }
      }
    },
    label: "Tasks",
  },
  {
    caption: "Your day, at a glance.",
    draw: (ctx) => {
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(240, 150, 105, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(190, 152);
      ctx.lineTo(228, 190);
      ctx.lineTo(296, 116);
      ctx.stroke();
    },
    label: "My day",
  },
];

// Draws a scene off screen and picks PARTICLE_COUNT points inside its ink.
const sampleScene = (scene: Scene): Point[] => {
  const canvas = document.createElement("canvas");
  canvas.width = FIELD_WIDTH;
  canvas.height = FIELD_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return [];
  }
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  scene.draw(ctx);
  const { data } = ctx.getImageData(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  const inked: Point[] = [];
  for (let y = 0; y < FIELD_HEIGHT; y += 2) {
    for (let x = 0; x < FIELD_WIDTH; x += 2) {
      if ((data[(y * FIELD_WIDTH + x) * 4 + 3] ?? 0) > 128) {
        inked.push({ x, y });
      }
    }
  }
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const pick = inked[Math.floor(Math.random() * inked.length)] ?? {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 2,
    };
    return {
      x: pick.x + (Math.random() - 0.5) * 2,
      y: pick.y + (Math.random() - 0.5) * 2,
    };
  });
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HeroMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      return;
    }
    const { canvas } = ctx;

    const targets = SCENES.map(sampleScene);
    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      () => ({
        vx: 0,
        vy: 0,
        x: Math.random() * FIELD_WIDTH,
        y: Math.random() * FIELD_HEIGHT,
      })
    );

    const render = (glow: number) => {
      const scale = Math.min(
        canvas.width / FIELD_WIDTH,
        canvas.height / FIELD_HEIGHT
      );
      const offsetX = (canvas.width - FIELD_WIDTH * scale) / 2;
      const offsetY = (canvas.height - FIELD_HEIGHT * scale) / 2;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(25, 28, 31, 0.32)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(111, 178, 189, ${0.35 + glow * 0.35})`;
      const size = Math.max(1, scale * 1.3);
      for (const particle of particles) {
        ctx.fillRect(
          offsetX + particle.x * scale,
          offsetY + particle.y * scale,
          size,
          size
        );
      }
    };

    // Reduced motion gets the first picture, still. Resizing wipes a canvas,
    // so the still is painted again after each resize.
    const still = prefersReducedMotion();
    if (still) {
      for (const [i, point] of (targets[0] ?? []).entries()) {
        Object.assign(particles[i] ?? {}, point);
      }
    }
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      if (still) {
        for (let pass = 0; pass < 8; pass += 1) {
          render(1);
        }
      }
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (still) {
      return () => resizeObserver.disconnect();
    }

    let frame = 0;
    let visible = true;
    let scene = 0;
    let sceneStart = performance.now();

    const step = (now: number) => {
      if (now - sceneStart > SCENE_MS) {
        scene = (scene + 1) % SCENES.length;
        sceneStart = now;
        setSceneIndex(scene);
        // Burst outwards so the change reads as a scatter, not a slide.
        for (const particle of particles) {
          const angle = Math.random() * Math.PI * 2;
          const force = 2 + Math.random() * 5;
          particle.vx += Math.cos(angle) * force;
          particle.vy += Math.sin(angle) * force;
        }
      }
      const elapsed = (now - sceneStart) / SCENE_MS;
      const target = targets[scene] ?? [];
      const pull = Math.min(0.06, 0.012 + elapsed * 0.08);
      for (const [i, particle] of particles.entries()) {
        const point = target[i] ?? particle;
        // A slow drift keeps a settled shape breathing.
        const drift = Math.sin(now / 900 + i) * 0.15;
        particle.vx =
          (particle.vx + (point.x - particle.x) * pull + drift) * 0.86;
        particle.vy = (particle.vy + (point.y - particle.y) * pull) * 0.86;
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      render(Math.min(1, elapsed * 2));
      frame = visible ? requestAnimationFrame(step) : 0;
    };

    // Only animate while the panel is on screen and the tab is in front.
    let intersecting = false;
    const update = () => {
      visible = intersecting && !document.hidden;
      if (visible && !frame) {
        sceneStart = performance.now();
        frame = requestAnimationFrame(step);
      }
    };
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting);
      update();
    });
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", update);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", update);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const scene = SCENES[sceneIndex] ?? SCENES[0];

  return (
    <figure className="relative m-0 aspect-[8/5] w-full overflow-hidden rounded-2xl bg-[#191c1f] shadow-[0_24px_60px_-28px_rgba(25,28,31,0.6)] ring-1 ring-white/10">
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#191c1f] via-[#191c1f]/80 to-transparent" />
      <div className="pointer-events-none absolute top-4 right-5 text-right font-mono text-[#6fb2bd] text-[11px] uppercase tracking-[0.18em]">
        {String(sceneIndex + 1).padStart(2, "0")} /{" "}
        {String(SCENES.length).padStart(2, "0")}
        <span className="block text-white/50">{scene.label}</span>
      </div>
      <figcaption
        aria-live="polite"
        className="motion-caption pointer-events-none absolute bottom-5 left-5 max-w-[80%] font-heading text-white text-xl leading-tight sm:text-2xl"
        key={sceneIndex}
      >
        {scene.caption}
      </figcaption>
    </figure>
  );
}
