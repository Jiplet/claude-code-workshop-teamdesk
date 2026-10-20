import { MEMBER_ROLES } from "@repo/db/shared";
import { addMemberInput } from "@repo/services/members";
import { z } from "zod";
import { publicProcedure, router } from "../init.ts";

// No sign-in yet: the acting member comes from the member picker in the UI.
export const membersRouter = router({
  add: publicProcedure
    .input(z.object({ actorId: z.string(), member: addMemberInput }))
    .mutation(({ ctx, input }) =>
      ctx.services.members.add(input.actorId, input.member)
    ),
  list: publicProcedure.query(({ ctx }) => ctx.services.members.list()),
  setRole: publicProcedure
    .input(
      z.object({
        actorId: z.string(),
        memberId: z.string(),
        role: z.enum(MEMBER_ROLES),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.services.members.setRole(input.actorId, input.memberId, input.role)
    ),
});
