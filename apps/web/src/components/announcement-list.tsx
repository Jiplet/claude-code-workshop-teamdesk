import type { Announcement } from "@repo/db/shared";
import { formatUtc } from "#/lib/datetime";

interface AnnouncementListProps {
  announcements: readonly Announcement[];
  memberNames: ReadonlyMap<string, string>;
}

export default function AnnouncementList({
  announcements,
  memberNames,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No announcements yet.</p>
    );
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {announcements.map((announcement) => (
        <li className="border-border border-t pt-4" key={announcement.id}>
          <p className="m-0 whitespace-pre-line text-foreground">
            {announcement.pinned ? (
              <span className="island-kicker mr-2">Pinned</span>
            ) : null}
            {announcement.body}
          </p>
          <p className="m-0 text-muted-foreground text-xs">
            {memberNames.get(announcement.authorId) ?? "Unknown member"},{" "}
            <time dateTime={announcement.createdAt}>
              {formatUtc(announcement.createdAt)}
            </time>
          </p>
        </li>
      ))}
    </ul>
  );
}
