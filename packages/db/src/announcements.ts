import { desc, eq } from "drizzle-orm";
import { announcements, type Database } from "./schema.ts";
import type { Announcement } from "./shared.ts";

type AnnouncementRow = typeof announcements.$inferSelect;

function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    authorId: String(row.authorId),
    body: row.body,
    createdAt: row.createdAt,
    id: String(row.id),
    pinned: row.pinned === 1,
  };
}

/** Pinned first, then newest first. */
export async function listAnnouncements(
  db: Database,
  limit: number
): Promise<Announcement[]> {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.pinned), desc(announcements.id))
    .limit(limit);
  return rows.map(toAnnouncement);
}

export async function insertAnnouncement(
  db: Database,
  input: { authorId: string; body: string; pinned: boolean }
): Promise<Announcement> {
  const [row] = await db
    .insert(announcements)
    .values({
      authorId: Number(input.authorId),
      body: input.body,
      createdAt: new Date().toISOString(),
      pinned: input.pinned ? 1 : 0,
    })
    .returning();
  if (!row) {
    throw new Error("Announcement was inserted but could not be read back.");
  }
  return toAnnouncement(row);
}

export async function setAnnouncementPinned(
  db: Database,
  id: string,
  pinned: boolean
): Promise<Announcement | null> {
  const [row] = await db
    .update(announcements)
    .set({ pinned: pinned ? 1 : 0 })
    .where(eq(announcements.id, Number(id)))
    .returning();
  return row ? toAnnouncement(row) : null;
}
