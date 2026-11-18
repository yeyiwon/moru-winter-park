CREATE TABLE `world_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `world_invites_token_hash_unique` ON `world_invites` (`token_hash`);--> statement-breakpoint
ALTER TABLE `visitors` ADD `invite_id` text;--> statement-breakpoint
ALTER TABLE `visitors` ADD `admitted_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `visitors` ADD `kicked_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `visitors` ADD `auth_type` text DEFAULT 'legacy' NOT NULL;