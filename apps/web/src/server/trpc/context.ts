// What every tRPC procedure receives as `ctx`: the services, built on this
// request's D1 binding, and who is calling. There is no sign-in yet, so
// `userId` is always null and every `protectedProcedure` answers UNAUTHORIZED.
// Team procedures take the acting member's id as input instead.
import { env } from "cloudflare:workers";
import type { Database } from "@repo/db";
import { createAnnouncementsService } from "@repo/services/announcements";
import { createAvailabilityService } from "@repo/services/availability";
import { createBookingsService } from "@repo/services/bookings";
import { createMembersService } from "@repo/services/members";
import { createMyDayService } from "@repo/services/my-day";
import { createNotesService } from "@repo/services/notes";
import { createRoomsService } from "@repo/services/rooms";
import { createTasksService } from "@repo/services/tasks";
import { drizzle } from "drizzle-orm/d1";
import type { Context as HonoContext } from "hono";

const createServices = (db: Database) => ({
  announcements: createAnnouncementsService(db),
  availability: createAvailabilityService(db),
  bookings: createBookingsService(db),
  members: createMembersService(db),
  myDay: createMyDayService(db),
  notes: createNotesService(db),
  rooms: createRoomsService(db),
  tasks: createTasksService(db),
});

// A type, not an interface: see the biome-ignore. Over HTTP,
// @hono/trpc-server also adds `env` to ctx, but the SSR path does not, so
// procedures use `ctx.services` and never `ctx.env`.
// biome-ignore lint/style/useConsistentTypeDefinitions: @hono/trpc-server needs a Record<string, unknown>, which an interface is not
export type Context = {
  services: ReturnType<typeof createServices>;
  /** Signed-in user, or null for anonymous callers. */
  userId: string | null;
};

const createContext = (bindings: Env, userId: string | null): Context => ({
  services: createServices(drizzle(bindings.DB)),
  userId,
});

/** Calls over HTTP: /api/trpc, mounted in src/server.ts. */
export const createHonoContext = (
  c: HonoContext<{ Bindings: Env }>
): Promise<Context> => Promise.resolve(createContext(c.env, null));

/** In-process calls from route loaders during SSR (src/integrations/trpc). */
export const createSsrContext = (): Promise<Context> =>
  Promise.resolve(createContext(env, null));
