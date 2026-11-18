CREATE TABLE `decoration_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`actor` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
