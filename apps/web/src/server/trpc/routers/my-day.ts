import { myDayInput } from "@repo/services/my-day";
import { z } from "zod";
import { publicProcedure, router } from "../init.ts";

export const myDayRouter = router({
  get: publicProcedure
    .input(myDayInput.extend({ memberId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.services.myDay.get(input.memberId, {
        dayEnd: input.dayEnd,
        dayStart: input.dayStart,
        today: input.today,
      })
    ),
});
