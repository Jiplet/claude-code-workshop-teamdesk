import type { Booking } from "@repo/db/shared";
import { useCallback } from "react";
import { Button } from "#/components/ui/button";
import { formatUtcRange } from "#/lib/datetime";

interface BookingCardProps {
  booking: Booking;
  /** Who booked it or where it is, depending on the list. */
  detail: string;
  disabled: boolean;
  onCancel: (bookingId: string) => void;
}

export default function BookingCard({
  booking,
  detail,
  disabled,
  onCancel,
}: BookingCardProps) {
  const handleCancel = useCallback(
    () => onCancel(booking.id),
    [booking.id, onCancel]
  );

  return (
    <li className="flex items-center justify-between gap-4 border-border border-t pt-4">
      <div>
        <p className="m-0 font-semibold text-foreground">{booking.title}</p>
        <p className="m-0 text-muted-foreground text-sm">
          <time dateTime={booking.startsAt}>
            {formatUtcRange(booking.startsAt, booking.endsAt)}
          </time>
          , {detail}, {booking.attendees}{" "}
          {booking.attendees === 1 ? "person" : "people"}
        </p>
      </div>
      <Button
        disabled={disabled}
        onClick={handleCancel}
        size="sm"
        variant="outline"
      >
        Cancel
      </Button>
    </li>
  );
}
