// Room bookings: who may book what, when. Times are UTC ISO strings and every
// slot is [startsAt, endsAt), so back-to-back bookings do not clash.
import type { Database } from "@repo/db";
import {
  cancelBooking,
  findOverlappingBookings,
  getBooking,
  insertBooking,
  listMemberBookings,
  listRoomBookings,
} from "@repo/db/bookings";
import { getRoom } from "@repo/db/rooms";
import {
  BOOKING_MAX_MINUTES,
  BOOKING_MIN_MINUTES,
  BOOKING_TITLE_MAX_LENGTH,
  type Booking,
  type Member,
} from "@repo/db/shared";
import { z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors.ts";
import { requireMember } from "./members.ts";
import { minutesBetween, toUtcIso, utcDayBounds } from "./time.ts";

export const createBookingInput = z.object({
  attendees: z.int().min(1, "At least one person must attend."),
  endsAt: z.iso.datetime(),
  roomId: z.string().min(1),
  startsAt: z.iso.datetime(),
  title: z
    .string()
    .trim()
    .min(1, "Give the booking a title.")
    .max(
      BOOKING_TITLE_MAX_LENGTH,
      `Title must be at most ${BOOKING_TITLE_MAX_LENGTH} characters.`
    ),
});

export type CreateBookingInput = z.input<typeof createBookingInput>;

export interface BookingsService {
  /** Throws ForbiddenError unless the actor owns the booking or is an admin. */
  cancel: (actorId: string, bookingId: string) => Promise<Booking>;
  create: (actorId: string, input: CreateBookingInput) => Promise<Booking>;
  /** A room's active bookings on the UTC day `day` falls on. */
  listForRoom: (roomId: string, day: string) => Promise<Booking[]>;
  /** The member's active bookings that have not ended by `now`. */
  listUpcoming: (memberId: string, now: string) => Promise<Booking[]>;
}

function canManage(actor: Member, booking: Booking): boolean {
  return actor.role === "admin" || booking.memberId === actor.id;
}

function checkSlot(startsAt: string, endsAt: string): void {
  const minutes = minutesBetween(startsAt, endsAt);
  if (minutes < BOOKING_MIN_MINUTES) {
    throw new ValidationError(
      `Bookings must be at least ${BOOKING_MIN_MINUTES} minutes.`
    );
  }
  if (minutes > BOOKING_MAX_MINUTES) {
    throw new ValidationError(
      `Bookings can be at most ${BOOKING_MAX_MINUTES} minutes.`
    );
  }
}

export const createBookingsService = (db: Database): BookingsService => ({
  cancel: async (actorId, bookingId) => {
    const actor = await requireMember(db, actorId);
    const booking = await getBooking(db, bookingId);
    if (!booking || booking.cancelledAt) {
      throw new NotFoundError("Booking", bookingId);
    }
    if (!canManage(actor, booking)) {
      throw new ForbiddenError(
        "Only the person who booked or an admin can cancel."
      );
    }
    const cancelled = await cancelBooking(db, bookingId);
    if (!cancelled) {
      throw new NotFoundError("Booking", bookingId);
    }
    return cancelled;
  },
  create: async (actorId, input) => {
    await requireMember(db, actorId);
    const data = createBookingInput.parse(input);
    const startsAt = toUtcIso(data.startsAt);
    const endsAt = toUtcIso(data.endsAt);
    checkSlot(startsAt, endsAt);

    const room = await getRoom(db, data.roomId);
    if (!room || room.archived) {
      throw new NotFoundError("Room", data.roomId);
    }
    if (data.attendees > room.capacity) {
      throw new ValidationError(
        `${room.name} holds at most ${room.capacity} people.`
      );
    }

    const clashes = await findOverlappingBookings(db, {
      endsAt,
      roomId: room.id,
      startsAt,
    });
    if (clashes.length > 0) {
      throw new ConflictError(
        `${room.name} is already booked for part of that time.`
      );
    }

    return await insertBooking(db, {
      attendees: data.attendees,
      endsAt,
      memberId: actorId,
      roomId: room.id,
      startsAt,
      title: data.title,
    });
  },
  listForRoom: (roomId, day) => {
    const { end, start } = utcDayBounds(day);
    return listRoomBookings(db, roomId, { from: start, to: end });
  },
  listUpcoming: (memberId, now) => listMemberBookings(db, memberId, now),
});
