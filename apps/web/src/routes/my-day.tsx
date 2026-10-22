import type { Booking, Room, Task } from "@repo/db/shared";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import PageError from "#/components/page-error";
import { Button } from "#/components/ui/button";
import { useActingMember } from "#/hooks/use-acting-member";
import { getTrpc } from "#/integrations/trpc/client";
import { formatLocalTime, localDayBounds } from "#/lib/datetime";

export const Route = createFileRoute("/my-day")({
  loader: async () => {
    const trpc = getTrpc();
    const [members, rooms] = await Promise.all([
      trpc.members.list.query(),
      trpc.rooms.list.query(),
    ]);
    return { members, rooms };
  },
  component: MyDayPage,
  errorComponent: PageError,
});

interface Day {
  bookings: Booking[];
  tasks: Task[];
  today: string;
}

function MyDayPage() {
  const { members, rooms } = Route.useLoaderData();
  const { actingMember, setActingMemberId } = useActingMember(members);
  const actorId = actingMember?.id ?? "";
  const [day, setDay] = useState<Day | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // The server does not know the browser's timezone, so the day is fetched
  // here rather than in the loader.
  const load = useCallback(async (memberId: string) => {
    const bounds = localDayBounds();
    const result = await getTrpc().myDay.get.query({ memberId, ...bounds });
    setDay({ ...result, today: bounds.today });
  }, []);

  useEffect(() => {
    if (!actorId) {
      return;
    }
    setDay(null);
    setError(null);
    load(actorId).catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Could not load your day.")
    );
  }, [actorId, load]);

  const handleDone = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const taskId = event.currentTarget.value;
      setPending(true);
      setError(null);
      try {
        await getTrpc().tasks.complete.mutate({ actorId, taskId });
        await load(actorId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPending(false);
      }
    },
    [actorId, load]
  );

  return (
    <main className="page-wrap px-4 py-12">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Teamdesk</p>
        <h1 className="display-title m-0 text-4xl text-foreground sm:text-5xl">
          My day
        </h1>
        <p className="m-0 text-base text-muted-foreground leading-8">
          Where you need to be today and what is due.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <FormError message={error} />

      <section className="island-shell mt-10 p-6 sm:p-8">
        <p className="island-kicker mb-3">Bookings</p>
        <BookingList bookings={day?.bookings} rooms={rooms} />
      </section>

      <section className="island-shell mt-6 p-6 sm:p-8">
        <p className="island-kicker mb-3">Due</p>
        <DueList
          onDone={handleDone}
          pending={pending}
          tasks={day?.tasks}
          today={day?.today ?? ""}
        />
      </section>
    </main>
  );
}

function Muted({ children }: { children: string }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

function BookingList({
  bookings,
  rooms,
}: {
  bookings: Booking[] | undefined;
  rooms: Room[];
}) {
  const roomName = (roomId: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "Unknown room";

  if (bookings === undefined) {
    return <Muted>Loading…</Muted>;
  }
  if (bookings.length === 0) {
    return <Muted>No bookings today.</Muted>;
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {bookings.map((booking) => (
        <li className="border-border border-t pt-4" key={booking.id}>
          <p className="m-0 text-foreground">
            <Link to="/bookings">{booking.title}</Link>
          </p>
          <p className="m-0 text-muted-foreground text-xs">
            {formatLocalTime(booking.startsAt)} to{" "}
            {formatLocalTime(booking.endsAt)}, {roomName(booking.roomId)},{" "}
            {booking.attendees} {booking.attendees === 1 ? "person" : "people"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function DueList({
  onDone,
  pending,
  tasks,
  today,
}: {
  onDone: (event: MouseEvent<HTMLButtonElement>) => void;
  pending: boolean;
  tasks: Task[] | undefined;
  today: string;
}) {
  if (tasks === undefined) {
    return <Muted>Loading…</Muted>;
  }
  if (tasks.length === 0) {
    return <Muted>Nothing due today.</Muted>;
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {tasks.map((task) => (
        <li
          className="flex items-center justify-between gap-3 border-border border-t pt-4"
          key={task.id}
        >
          <div>
            <p className="m-0 text-foreground">{task.title}</p>
            <p className="m-0 text-muted-foreground text-xs">
              {task.dueOn !== null && task.dueOn < today
                ? `Overdue, was due ${task.dueOn}`
                : "Due today"}
            </p>
          </div>
          <Button
            disabled={pending}
            onClick={onDone}
            size="sm"
            value={task.id}
            variant="outline"
          >
            Done
          </Button>
        </li>
      ))}
    </ul>
  );
}
