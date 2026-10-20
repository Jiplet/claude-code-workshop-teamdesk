import type { Database } from "@repo/db";
import {
  insertAnnouncement,
  listAnnouncements,
  setAnnouncementPinned,
} from "@repo/db/announcements";
import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  type Announcement,
} from "@repo/db/shared";
import { z } from "zod";
import { NotFoundError } from "./errors.ts";
import { requireAdmin } from "./members.ts";

const LATEST_LIMIT = 10;

export const postAnnouncementInput = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Announcement must not be empty.")
    .max(
      ANNOUNCEMENT_BODY_MAX_LENGTH,
      `Announcement must be at most ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters.`
    ),
  pinned: z.boolean().default(false),
});

export type PostAnnouncementInput = z.input<typeof postAnnouncementInput>;

export interface AnnouncementsService {
  /** Pinned first, then the latest few. */
  latest: () => Promise<Announcement[]>;
  /** Admins only. */
  pin: (actorId: string, id: string, pinned: boolean) => Promise<Announcement>;
  /** Admins only. */
  post: (
    actorId: string,
    input: PostAnnouncementInput
  ) => Promise<Announcement>;
}

export const createAnnouncementsService = (
  db: Database
): AnnouncementsService => ({
  latest: () => listAnnouncements(db, LATEST_LIMIT),
  pin: async (actorId, id, pinned) => {
    await requireAdmin(db, actorId);
    const announcement = await setAnnouncementPinned(db, id, pinned);
    if (!announcement) {
      throw new NotFoundError("Announcement", id);
    }
    return announcement;
  },
  post: async (actorId, input) => {
    await requireAdmin(db, actorId);
    const data = postAnnouncementInput.parse(input);
    return await insertAnnouncement(db, { ...data, authorId: actorId });
  },
});
