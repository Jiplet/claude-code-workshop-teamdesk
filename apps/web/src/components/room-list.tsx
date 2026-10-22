import type { Room } from "@repo/db/shared";
import { type MouseEvent, useCallback } from "react";
import RoomDesign from "#/components/room-design";
import { Button } from "#/components/ui/button";
import { layoutRoom, type RoomStyle } from "#/lib/room-layout";

const STYLE_NAMES: Record<RoomStyle, string> = {
  boardroom: "boardroom table",
  booth: "two-seat booth",
  theatre: "theatre rows",
};

interface RoomListProps {
  disabled: boolean;
  onArchive: (roomId: string) => void;
  rooms: readonly Room[];
}

export default function RoomList({
  disabled,
  onArchive,
  rooms,
}: RoomListProps) {
  const handleArchive = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onArchive(event.currentTarget.value),
    [onArchive]
  );

  if (rooms.length === 0) {
    return <p className="text-muted-foreground text-sm">No rooms yet.</p>;
  }
  return (
    <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li
          className="island-shell group overflow-hidden transition-[box-shadow,transform] hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(25,28,31,0.45)]"
          key={room.id}
        >
          <div className="bg-gradient-to-b from-muted to-background px-4 pt-4">
            <RoomDesign
              capacity={room.capacity}
              id={room.id}
              name={room.name}
            />
          </div>
          <div className="flex items-center justify-between gap-4 border-border border-t p-4">
            <div>
              <p className="m-0 font-heading text-foreground text-xl">
                {room.name}
              </p>
              <p className="m-0 text-muted-foreground text-sm">
                Seats {room.capacity},{" "}
                {STYLE_NAMES[layoutRoom(room.capacity).style]}
              </p>
            </div>
            <Button
              disabled={disabled}
              onClick={handleArchive}
              size="sm"
              value={room.id}
              variant="outline"
            >
              Archive
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
