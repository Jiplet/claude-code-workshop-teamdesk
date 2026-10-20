import { postAnnouncementInput } from "@repo/services/announcements";
import { z } from "zod";
import { publicProcedure, router } from "../init.ts";

export const announcementsRouter = router({
  latest: publicProcedure.query(({ ctx }) =>
    ctx.services.announcements.latest()
  ),
  pin: publicProcedure
    .input(
      z.object({ actorId: z.string(), id: z.string(), pinned: z.boolean() })
    )
    .mutation(({ ctx, input }) =>
      ctx.services.announcements.pin(input.actorId, input.id, input.pinned)
    ),
  post: publicProcedure
    .input(
      z.object({ actorId: z.string(), announcement: postAnnouncementInput })
    )
    .mutation(({ ctx, input }) =>
      ctx.services.announcements.post(input.actorId, input.announcement)
    ),
});
