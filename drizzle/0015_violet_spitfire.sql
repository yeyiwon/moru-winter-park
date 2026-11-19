CREATE TABLE `owner_login_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `owner_sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
