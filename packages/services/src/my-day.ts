import type { Database } from "@repo/db";
import { listMemberBookingsBetween } from "@repo/db/bookings";
import type { Booking, Task } from "@repo/db/shared";
import { listOpenTasksDueBy } from "@repo/db/tasks";
import { z } from "zod";
import { ValidationError } from "./errors.ts";
import { requireMember } from "./members.ts";

/** Longest day the page may ask for: 24 hours plus one for DST changes. */
const MAX_DAY_MS = 25 * 60 * 60 * 1000;

export const myDayInput = z.object({
  dayEnd: z.iso.datetime(),
  dayStart: z.iso.datetime(),
  today: z.iso.date(),
});

export type MyDayInput = z.input<typeof myDayInput>;

export interface MyDay {
  /** Active bookings overlapping [dayStart, dayEnd), earliest first. */
  bookings: Booking[];
  /** Open assigned tasks due on or before today, overdue first. */
  tasks: Task[];
}

export interface MyDayService {
  /** Throws NotFoundError for an unknown member, ValidationError for bad bounds. */
  get: (memberId: string, input: MyDayInput) => Promise<MyDay>;
}

export const createMyDayService = (db: Database): MyDayService => ({
  get: async (memberId, input) => {
    await requireMember(db, memberId);
    const parsed = myDayInput.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((issue) => issue.message).join(" ")
      );
    }
    const { dayEnd, dayStart, today } = parsed.data;
    const span = Date.parse(dayEnd) - Date.parse(dayStart);
    if (span <= 0) {
      throw new ValidationError("dayEnd must be after dayStart.");
    }
    if (span > MAX_DAY_MS) {
      throw new ValidationError("A day may span at most 25 hours.");
    }
    const [bookings, tasks] = await Promise.all([
      listMemberBookingsBetween(db, memberId, dayStart, dayEnd),
      listOpenTasksDueBy(db, memberId, today),
    ]);
    return { bookings, tasks };
  },
});
