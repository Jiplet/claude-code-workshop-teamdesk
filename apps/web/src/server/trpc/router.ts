import { protectedProcedure, router } from "./init.ts";
import { announcementsRouter } from "./routers/announcements.ts";
import { bookingsRouter } from "./routers/bookings.ts";
import { membersRouter } from "./routers/members.ts";
import { notesRouter } from "./routers/notes.ts";
import { roomsRouter } from "./routers/rooms.ts";
import { tasksRouter } from "./routers/tasks.ts";

export const appRouter = router({
  announcements: announcementsRouter,
  bookings: bookingsRouter,
  /** The caller's user id. The example protected procedure. */
  me: protectedProcedure.query(({ ctx }) => ({ userId: ctx.userId })),
  members: membersRouter,
  notes: notesRouter,
  rooms: roomsRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;
