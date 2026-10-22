# packages/services (`@repo/services`)

Service template and entry points: [README.md](README.md). `src/notes.ts` is the reference service.

- Business rules and zod input schemas live here, exported per module. Reason: this is the only layer with rule tests, and scripts reuse services without tRPC.
- Parse input again inside the service with `schema.safeParse(input)`; on failure throw `new ValidationError(parsed.error.issues.map((issue) => issue.message).join(" "))`. Reason: a caller that skips tRPC still gets validated input, and the error maps to 400.
- Fail only with `ServiceError` subclasses from `src/errors.ts`: `NotFoundError` 404, `ConflictError` 409, `ForbiddenError` 403, `ValidationError` 400. Reason: `apps/web/src/server/trpc/init.ts` maps them by code; anything else becomes a 500.
- Mutations take the acting member's id and check it with `requireMember` / `requireAdmin` from `src/members.ts`. Reason: there is no sign-in, so the service is the permission boundary.
- Never read `env`, bindings or the request. Reason: the same service runs on the Worker, in tests and in scripts.
- Every new rule gets a test in `src/<module>.test.ts`, using the team and rooms from `src/fixtures.ts`. Reason: fixtures keep tests short and consistent.
