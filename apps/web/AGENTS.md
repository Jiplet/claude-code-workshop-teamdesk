# apps/web

Architecture (Hono entry, tRPC mount, D1 binding, deploy): [README.md](README.md).

- Routes in `src/routes/` fetch through `getTrpc()` from `#/integrations/trpc/client`, in loaders and event handlers. Reason: during SSR it runs the router in-process, so loaders never fetch their own Worker.
- tRPC routers in `src/server/trpc/routers/` stay thin: the service's input schema in `.input()`, then one service call. Reason: rules hidden here are not reached by service tests.
- A new router needs a line in `router.ts`; a new service needs a line in `context.ts`. Reason: `ctx.services` is built there, once per call.
- Browser code imports only `@repo/db/shared`, never another `@repo/db` or `@repo/services` entry. Reason: those pull drizzle into the client bundle.
- Anything that depends on the viewer's timezone (today's bounds, local times) is computed in the browser, in a `useEffect`, not in the loader. Reason: the loader also runs on the Worker during SSR, which is in UTC. Helpers live in `src/lib/datetime.ts`.
- Mutating pages use `MemberPicker` and `useActingMember`, and send the member as `actorId`.
- Biome rejects nested ternaries. Extract a small component for loading/empty/list states.
