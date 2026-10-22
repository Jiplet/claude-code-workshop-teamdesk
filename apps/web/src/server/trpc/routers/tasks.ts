import { createTaskInput, moveTaskInput } from "@repo/services/tasks";
import { z } from "zod";
import { publicProcedure, router } from "../init.ts";

/** Today's date in UTC, YYYY-MM-DD. */
const todayUtc = () => new Date().toISOString().slice(0, 10);

export const tasksRouter = router({
  assign: publicProcedure
    .input(
      z.object({
        actorId: z.string(),
        assigneeId: z.string().nullable(),
        taskId: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.services.tasks.assign(input.actorId, input.taskId, input.assigneeId)
    ),
  complete: publicProcedure
    .input(z.object({ actorId: z.string(), taskId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.services.tasks.complete(input.actorId, input.taskId)
    ),
  create: publicProcedure
    .input(z.object({ actorId: z.string(), task: createTaskInput }))
    .mutation(({ ctx, input }) =>
      ctx.services.tasks.create(input.actorId, input.task, todayUtc())
    ),
  list: publicProcedure
    .input(z.object({ assigneeId: z.string().optional() }).optional())
    .query(({ ctx, input }) => ctx.services.tasks.list(input)),
  move: publicProcedure
    .input(moveTaskInput.extend({ actorId: z.string() }))
    .mutation(({ ctx, input: { actorId, ...move } }) =>
      ctx.services.tasks.move(actorId, move)
    ),
});
