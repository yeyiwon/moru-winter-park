CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`accessory` text NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`yaw` real NOT NULL,
	`seen` integer NOT NULL,
	`gesture` text NOT NULL,
	`gesture_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitors_room_seen` ON `visitors` (`room`,`seen`);