import { beforeEach, describe, expect, test } from "bun:test";
import { BOOKING_MAX_MINUTES } from "@repo/db/shared";
import { type BookingsService, createBookingsService } from "./bookings.ts";
import { at, createTeam, type Team } from "./fixtures.ts";

let team: Team;
let bookings: BookingsService;

beforeEach(async () => {
  team = await createTeam();
  bookings = createBookingsService(team.db);
});

const standUp = (
  roomId: string,
  startsAt = at("09:00"),
  endsAt = at("09:30")
) => ({
  attendees: 2,
  endsAt,
  roomId,
  startsAt,
  title: "Stand-up",
});

describe("bookings service", () => {
  test("create stores the booking for the acting member", async () => {
    const booking = await bookings.create(
      team.ana.id,
      standUp(team.bigRoom.id)
    );

    expect(booking).toMatchObject({
      memberId: team.ana.id,
      roomId: team.bigRoom.id,
    });
    expect(await bookings.listForRoom(team.bigRoom.id, at("00:00"))).toEqual([
      booking,
    ]);
  });

  test("create refuses an overlapping slot but allows a touching one", async () => {
    await bookings.create(
      team.ana.id,
      standUp(team.bigRoom.id, at("09:00"), at("10:00"))
    );

    await expect(
      bookings.create(
        team.ben.id,
        standUp(team.bigRoom.id, at("09:30"), at("10:30"))
      )
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await bookings.create(
      team.ben.id,
      standUp(team.bigRoom.id, at("10:00"), at("10:30"))
    );
  });

  test("create checks the room's capacity", async () => {
    await expect(
      bookings.create(team.ana.id, {
        ...standUp(team.smallRoom.id),
        attendees: 3,
      })
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("create enforces the minimum and maximum length", async () => {
    await expect(
      bookings.create(
        team.ana.id,
        standUp(team.bigRoom.id, at("09:00"), at("09:10"))
      )
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const tooLong = new Date(
      Date.parse(at("09:00")) + (BOOKING_MAX_MINUTES + 1) * 60_000
    );
    await expect(
      bookings.create(
        team.ana.id,
        standUp(team.bigRoom.id, at("09:00"), tooLong.toISOString())
      )
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("create rejects an unknown room", async () => {
    await expect(
      bookings.create(team.ana.id, standUp("999"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("only the owner or an admin can cancel", async () => {
    const booking = await bookings.create(
      team.ana.id,
      standUp(team.bigRoom.id)
    );

    await expect(
      bookings.cancel(team.ben.id, booking.id)
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(
      (await bookings.cancel(team.admin.id, booking.id)).cancelledAt
    ).not.toBeNull();
    expect(await bookings.listUpcoming(team.ana.id, at("00:00"))).toEqual([]);
  });
});
