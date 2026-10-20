import type { Member } from "@repo/db/shared";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "teamdesk.actingMember";

/**
 * The member the UI acts as. There is no sign-in, so the choice lives in
 * localStorage. It is read in an effect, so the server render and the first
 * client render both use the first member and hydration matches.
 */
export function useActingMember(members: readonly Member[]) {
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStoredId(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // Storage can be blocked (private windows). Fall back to the default.
    }
  }, []);

  const setActingMemberId = useCallback((id: string) => {
    setStoredId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can be blocked. The choice then lasts until the page reloads.
    }
  }, []);

  const actingMember =
    members.find((member) => member.id === storedId) ?? members[0] ?? null;

  return { actingMember, setActingMemberId };
}
