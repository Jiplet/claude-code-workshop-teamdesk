import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { type Minifig, minifigFor } from "#/lib/minifig";

// The Team page's 3D scene: each member is a minifig head on a studded brick,
// the bricks step down through space, and a glowing orb drops in and bounces
// from head to head on a steady beat. Every head it lands on lights up,
// squashes and looks surprised, and all the heads turn to watch it. After the
// last head the orb falls away and the next run starts in a new colour.

export interface CastMember {
  name: string;
  seed: string;
}

const BEAT = 0.46;
const DROP = BEAT * 1.6;
const FALL = 1.3;
const REST = 0.5;
const SKIN = "#f2cd37";
const BALL_COLOURS = ["#6fe7ff", "#ffb347", "#ff5ad1", "#9dff6a"] as const;
const BALL_RADIUS = 0.2;
const HEAD_TOP = 0.98;

interface Actor {
  brick: MeshStandardMaterial;
  faces: { calm: CanvasTexture; surprised: CanvasTexture };
  group: Group;
  head: Mesh<CylinderGeometry, MeshStandardMaterial>;
  hitAt: number;
  spot: Vector3;
}

// The face is painted onto the head's whole wrap; the middle of the canvas
// sits at the front of the cylinder.
const paintFace = (look: Minifig, surprised: boolean) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 288;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new CanvasTexture(canvas);
  }
  ctx.fillStyle = SKIN;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1b1b1b";
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineCap = "round";
  const eyeR = surprised ? 19 : 15;
  for (const x of [470, 554]) {
    ctx.beginPath();
    ctx.arc(x, 128, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + 5, 122, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b1b1b";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 20, surprised ? 86 : 96);
    ctx.quadraticCurveTo(x, surprised ? 70 : 84, x + 20, surprised ? 86 : 96);
    ctx.stroke();
  }
  if (look.glasses) {
    ctx.lineWidth = 6;
    for (const x of [470, 554]) {
      ctx.beginPath();
      ctx.roundRect(x - 30, 104, 60, 46, 14);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(500, 124);
    ctx.lineTo(524, 124);
    ctx.stroke();
  }
  ctx.lineWidth = 9;
  ctx.beginPath();
  if (surprised) {
    ctx.ellipse(512, 210, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.mouth === "smirk") {
    ctx.moveTo(478, 206);
    ctx.quadraticCurveTo(512, 220, 552, 192);
    ctx.stroke();
  } else {
    ctx.moveTo(470, 196);
    ctx.quadraticCurveTo(512, 240, 554, 196);
    if (look.mouth === "grin") {
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

const label = (name: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 30px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 128, 42);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(
    new SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
};

const studs = (columns: number, rows: number, colour: string, y: number) => {
  const group = new Group();
  const geometry = new CylinderGeometry(0.2, 0.2, 0.14, 24);
  const material = new MeshStandardMaterial({ color: colour, roughness: 0.35 });
  for (let c = 0; c < columns; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const stud = new Mesh(geometry, material);
      stud.position.set(
        (c - (columns - 1) / 2) * 0.8,
        y,
        (r - (rows - 1) / 2) * 0.8
      );
      group.add(stud);
    }
  }
  return group;
};

const buildActor = (member: CastMember, index: number): Actor => {
  const look = minifigFor(member.seed);
  const group = new Group();
  group.position.set(index * 1.5, -index * 0.85, index % 2 === 0 ? 0.3 : -0.5);

  const brick = new MeshStandardMaterial({
    color: look.torsoColour,
    emissive: new Color(0),
    roughness: 0.35,
  });
  const base = new Mesh(new BoxGeometry(1.6, 0.48, 1.6), brick);
  group.add(base, studs(2, 2, look.torsoColour, 0.31));

  const faces = {
    calm: paintFace(look, false),
    surprised: paintFace(look, true),
  };
  const head = new Mesh(
    new CylinderGeometry(0.42, 0.42, 0.72, 48, 1, false, -Math.PI, Math.PI * 2),
    new MeshStandardMaterial({
      emissive: new Color(0),
      map: faces.calm,
      roughness: 0.3,
    })
  );
  head.position.y = 0.6;
  const top = new Mesh(
    new CylinderGeometry(0.2, 0.2, 0.14, 24),
    new MeshStandardMaterial({ color: SKIN, roughness: 0.3 })
  );
  top.position.y = 0.43;
  head.add(top);
  if (look.hairStyle !== "bald") {
    const hair = new Mesh(
      new SphereGeometry(0.47, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.3),
      new MeshStandardMaterial({ color: look.hairColour, roughness: 0.6 })
    );
    hair.position.y = 0.12;
    hair.scale.y = look.hairStyle === "bob" ? 1.25 : 0.95;
    head.add(hair);
  }
  group.add(head);

  const name = label(member.name.split(" ")[0] ?? member.name);
  name.position.set(0, -0.55, 0.9);
  group.add(name);

  return {
    brick,
    faces,
    group,
    head,
    hitAt: -10,
    spot: new Vector3(),
  };
};

const starfield = () => {
  const positions: number[] = [];
  for (let i = 0; i < 700; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 30 + Math.random() * 20;
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      -Math.abs(r * Math.cos(phi))
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#ffffff", size: 0.12, sizeAttenuation: true })
  );
};

const planet = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const bands = [
      "#f6d6a8",
      "#d8894b",
      "#e9b07a",
      "#b8693a",
      "#f0c592",
      "#9c5530",
    ];
    for (let y = 0; y < 256; y += 16) {
      ctx.fillStyle = bands[(y / 16) % bands.length] ?? "#d8894b";
      ctx.fillRect(0, y, 512, 16 + Math.random() * 6);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(
    new SphereGeometry(7, 64, 32),
    new MeshStandardMaterial({ map: texture, roughness: 0.9 })
  );
  mesh.position.set(15, -10, -30);
  mesh.rotation.z = 0.25;
  return mesh;
};

const arc = (from: Vector3, to: Vector3, t: number, height: number) =>
  new Vector3()
    .lerpVectors(from, to, t)
    .setY(from.y + (to.y - from.y) * t + height * 4 * t * (1 - t));

export function startBounceScene(
  container: HTMLElement,
  members: readonly CastMember[]
): () => void {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor("#05060d");
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 2, 0.1, 100);
  scene.add(new AmbientLight("#8fa6c8", 0.55));
  const key = new DirectionalLight("#ffffff", 1.6);
  key.position.set(4, 8, 6);
  scene.add(key, starfield(), planet());

  const stage = new Group();
  const actors = members.map(buildActor);
  for (const actor of actors) {
    stage.add(actor.group);
  }
  const span = Math.max(actors.length - 1, 1);
  scene.add(stage);
  // Wide panels keep the staircase right of the title; narrow ones drop it
  // below the text. The orb's landing spots follow the stage.
  const frameStage = (narrow: boolean) => {
    stage.position.set(
      -span * 0.75 + (narrow ? 0.6 : 3.2),
      span * 0.42 - (narrow ? 1.6 : 0.2),
      0
    );
    stage.updateMatrixWorld(true);
    for (const actor of actors) {
      actor.group.getWorldPosition(actor.spot);
      actor.spot.y += HEAD_TOP + BALL_RADIUS;
    }
  };

  const ballMaterial = new MeshStandardMaterial({
    color: BALL_COLOURS[0],
    emissive: BALL_COLOURS[0],
    emissiveIntensity: 3.2,
  });
  const ball = new Mesh(new SphereGeometry(BALL_RADIUS, 32, 16), ballMaterial);
  const glow = new PointLight(BALL_COLOURS[0], 8, 6, 1.6);
  ball.add(glow);
  scene.add(ball);
  const trail = Array.from({ length: 10 }, (_, i) => {
    const mesh = new Mesh(
      new SphereGeometry(BALL_RADIUS * (1 - i / 12), 16, 8),
      new MeshStandardMaterial({
        color: BALL_COLOURS[0],
        emissive: BALL_COLOURS[0],
        emissiveIntensity: 2,
        opacity: 0.45 * (1 - i / 10),
        transparent: true,
      })
    );
    scene.add(mesh);
    return mesh;
  });
  const history: Vector3[] = [];

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.95, 0.55, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    // Narrow screens pull the camera back so the whole staircase fits.
    const narrow = width < 640;
    camera.position.set(0, 0.6, narrow ? 13 : 9.5);
    frameStage(narrow);
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const loopLength = DROP + Math.max(actors.length - 1, 0) * BEAT + FALL + REST;
  const origin = new Vector3();
  const start = performance.now() / 1000;
  let loop = -1;
  let lastHit = -1;

  // Where the orb is `t` seconds into a run, and which head it just hit.
  const place = (t: number): { at: Vector3; hit: number } => {
    const first = actors[0]?.spot ?? origin;
    const last = actors.at(-1)?.spot ?? first;
    if (t < DROP) {
      const k = t / DROP;
      return {
        at: new Vector3(first.x - 0.6, first.y + 4.5 - 4.5 * k * k, first.z),
        hit: -1,
      };
    }
    const hopping = t - DROP;
    const hop = Math.floor(hopping / BEAT);
    if (hop < actors.length - 1) {
      const from = actors[hop]?.spot ?? first;
      const to = actors[hop + 1]?.spot ?? first;
      return { at: arc(from, to, (hopping % BEAT) / BEAT, 1.1), hit: hop };
    }
    const falling = Math.min((hopping - (actors.length - 1) * BEAT) / FALL, 1);
    const out = new Vector3(last.x + 2.2, last.y - 7, last.z + 1);
    return { at: arc(last, out, falling, 1.4), hit: actors.length - 1 };
  };

  const recolour = (colour: string) => {
    ballMaterial.color.set(colour);
    ballMaterial.emissive.set(colour);
    glow.color.set(colour);
    for (const mesh of trail) {
      mesh.material.color.set(colour);
      mesh.material.emissive.set(colour);
    }
  };

  let frame = 0;
  let visible = true;
  const render = () => {
    const now = performance.now() / 1000;
    const elapsed = now - start;
    const run = Math.floor(elapsed / loopLength);
    if (run !== loop) {
      loop = run;
      lastHit = -1;
      recolour(BALL_COLOURS[run % BALL_COLOURS.length] ?? BALL_COLOURS[0]);
    }
    const { at, hit } = place(elapsed % loopLength);
    if (hit !== lastHit && hit >= 0) {
      lastHit = hit;
      const actor = actors[hit];
      if (actor) {
        actor.hitAt = now;
      }
    }
    ball.position.copy(at);
    history.unshift(at.clone());
    history.length = Math.min(history.length, trail.length * 2);
    for (const [i, mesh] of trail.entries()) {
      mesh.position.copy(history[i * 2] ?? at);
    }

    for (const actor of actors) {
      const since = now - actor.hitAt;
      const flash = Math.exp(-since * 5);
      actor.head.material.emissive
        .copy(ballMaterial.color)
        .multiplyScalar(flash * 0.9);
      actor.brick.emissive.copy(ballMaterial.color).multiplyScalar(flash * 0.6);
      actor.head.material.map =
        since < 0.4 ? actor.faces.surprised : actor.faces.calm;
      // A damped spring: squashed on impact, wobbling back to round.
      const squash = Math.exp(-since * 7) * Math.cos(since * 24) * 0.24;
      actor.head.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
      // Every head turns to watch the orb.
      const turn = Math.atan2(ball.position.x - actor.spot.x, 3.5);
      actor.head.rotation.y += (turn * 0.8 - actor.head.rotation.y) * 0.12;
    }

    camera.lookAt(
      0.3 + Math.sin(elapsed * 0.25) * 0.4,
      0.2 + (ball.position.y - (actors[0]?.spot.y ?? 0)) * 0.04,
      0
    );
    composer.render();
    frame = visible ? requestAnimationFrame(render) : 0;
  };

  let intersecting = false;
  const update = () => {
    visible = intersecting && !document.hidden;
    if (visible && !frame) {
      frame = requestAnimationFrame(render);
    }
  };
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = Boolean(entry?.isIntersecting);
    update();
  });
  intersectionObserver.observe(container);
  document.addEventListener("visibilitychange", update);

  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", update);
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    scene.traverse((object) => {
      if (
        object instanceof Mesh ||
        object instanceof Points ||
        object instanceof Sprite
      ) {
        object.geometry.dispose();
        const materials: Material[] = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          if ("map" in material && material.map instanceof CanvasTexture) {
            material.map.dispose();
          }
          material.dispose();
        }
      }
    });
    for (const actor of actors) {
      actor.faces.calm.dispose();
      actor.faces.surprised.dispose();
    }
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
