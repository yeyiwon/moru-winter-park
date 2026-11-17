CREATE TABLE `operational_errors` (
	`id` text PRIMARY KEY NOT NULL,
	`route` text NOT NULL,
	`code` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `world_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `visitors` ADD `region` text DEFAULT 'outdoors' NOT NULL;