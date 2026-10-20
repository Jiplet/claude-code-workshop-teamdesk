import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";

/**
 * Runs a mutation, reloads the route's loader data when it succeeds and keeps
 * the server's error message when it fails. Resolves to whether it succeeded.
 */
export function useAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        await action();
        await router.invalidate();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [router]
  );

  return { error, pending, run };
}
