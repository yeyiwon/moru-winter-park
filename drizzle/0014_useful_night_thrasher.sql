CREATE TABLE `quiz_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_generation_runs` (
	`day` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`usage` text
);
