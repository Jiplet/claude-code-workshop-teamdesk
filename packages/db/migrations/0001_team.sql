CREATE TABLE `announcements` (
	`author_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pinned` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`attendees` integer NOT NULL,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`room_id` integer NOT NULL,
	`starts_at` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_room_start_active` ON `bookings` (`room_id`,`starts_at`) WHERE "bookings"."cancelled_at" is null;--> statement-breakpoint
CREATE INDEX `bookings_member_start` ON `bookings` (`member_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`email` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`joined_at` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`archived` integer DEFAULT 0 NOT NULL,
	`capacity` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_name_unique` ON `rooms` (`name`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`assignee_id` integer,
	`completed_at` text,
	`created_at` text NOT NULL,
	`created_by_id` integer NOT NULL,
	`due_on` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`assignee_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
