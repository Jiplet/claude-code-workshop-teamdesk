import { useEffect } from "react";

/**
 * Shift+Enter submits the form that has focus, on every page: posts an
 * announcement from its textarea, adds a task from its title, and so on.
 * Plain Enter keeps its usual job, a new line in a textarea.
 */
export function useSubmitShortcut() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        !event.shiftKey ||
        event.isComposing ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const form = event.target.closest("form");
      if (form) {
        event.preventDefault();
        form.requestSubmit();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
