import type { Member } from "@repo/db/shared";
import { type ReactElement, useEffect, useState } from "react";

// Mounts the 3D bouncing-orb scene from `#/lib/bounce-scene` over the Team
// header. Three.js loads only in the browser, after the page is up. Until the
// scene is ready, and for reduced motion or a browser without WebGL, the
// `fallback` shows instead.

const MAX_CAST = 8;

export default function TeamBounce({
  fallback,
  members,
}: {
  fallback: ReactElement;
  members: readonly Member[];
}) {
  // A callback ref in state, so the effect runs once the element exists.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const cast = members
    .slice(0, MAX_CAST)
    .map((member) => `${member.id}:${member.name}`)
    .join("|");

  useEffect(() => {
    if (
      !(container && cast) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let stop: (() => void) | undefined;
    let cancelled = false;
    import("#/lib/bounce-scene")
      .then(({ startBounceScene }) => {
        if (cancelled) {
          return;
        }
        stop = startBounceScene(
          container,
          cast.split("|").map((entry) => {
            const [seed = "", ...name] = entry.split(":");
            return { name: name.join(":"), seed };
          })
        );
        setReady(true);
      })
      // No WebGL or a failed load: the flat fallback stays.
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      stop?.();
      setReady(false);
    };
  }, [cast, container]);

  return (
    <>
      {/* Hidden rather than unmounted: display none also stops its CSS loops. */}
      <div className={ready ? "hidden" : "contents"}>{fallback}</div>
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        ref={setContainer}
      />
    </>
  );
}
