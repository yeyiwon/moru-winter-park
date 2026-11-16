CREATE TABLE `tree_decorations` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`author` text NOT NULL,
	`kind` text NOT NULL,
	`color` text NOT NULL,
	`angle` real NOT NULL,
	`height` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tree_decorations_room` ON `tree_decorations` (`room`);