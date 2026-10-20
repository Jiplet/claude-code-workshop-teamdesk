import type { ErrorComponentProps } from "@tanstack/react-router";

/** Route error fallback for the Teamdesk pages. */
export default function PageError({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell max-w-3xl p-6 sm:p-8">
        <p className="island-kicker mb-3">Teamdesk</p>
        <h1 className="display-title mb-4 text-3xl text-foreground">
          Could not load this page
        </h1>
        <p className="m-0 text-muted-foreground text-sm leading-7">
          Locally this usually means the migrations or seed data have not been
          applied: <code>bun run dev</code> does both on start.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">
          {message}
        </pre>
      </section>
    </main>
  );
}
