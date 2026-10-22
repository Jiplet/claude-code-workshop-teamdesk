# My day

One page that shows the acting member what their day holds: today's room bookings and the tasks they need to finish.

## Who it is for

A team member opening Teamdesk in the morning who wants one answer to "where do I need to be, and what is due?" without visiting Bookings and Tasks separately.

## Behaviour

- Route `/my-day`, linked from the header nav and as a card on the home page.
- The member is chosen with the existing `MemberPicker` and remembered through `useActingMember` (localStorage), same as Bookings and Tasks.
- "Today" is the browser's local day. The page sends the UTC instants of local midnight and the next local midnight (`dayStart`, `dayEnd`) plus the local date (`today`, `YYYY-MM-DD`).
- **Bookings section:** the member's active (not cancelled) bookings that overlap `[dayStart, dayEnd)`, ordered by start time. Each row shows local start-end time, title, room name and attendees, and links to `/bookings`.
- **Tasks section:** the member's open tasks (not completed) assigned to them with `dueOn <= today`, overdue first then due today. Undated tasks are not shown. Overdue tasks are marked "Overdue".
- Each task has a **Done** button that calls the existing `tasks.complete` with the acting member as `actorId`, then refreshes the page data. The existing rule applies (assignee, creator or admin).
- Empty states: "No bookings today." and "Nothing due today."
- Read-only otherwise: no cancel, reschedule or assign from this page.

## Rules (service layer)

- `myDay.get(memberId, { dayStart, dayEnd, today })` in `@repo/services/my-day`.
- Unknown member: `NotFoundError`.
- `dayStart`/`dayEnd` must be ISO datetimes with `dayEnd > dayStart` and a span of at most 25 hours (covers DST days); otherwise `ValidationError`.
- `today` must be an ISO date.
- A booking that starts before `dayStart` but ends after it counts (overlap, not start-in-day). Ends are exclusive: a booking ending exactly at `dayStart` does not count.

## Out of scope

Sign-in, notifications, other members' days, a date picker for other days, undated tasks.

## Done when

- The page works locally and on the deployed Worker for each seeded member.
- Service tests cover: overlap edges, cancelled bookings excluded, other members' bookings excluded, completed and undated tasks excluded, overdue ordering, bad bounds rejected, unknown member rejected.
- `bun test` and `bun run check` pass.
