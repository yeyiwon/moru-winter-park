CREATE TABLE `moderation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `moderation_audit_created` ON `moderation_audit` (`created_at`);--> statement-breakpoint
ALTER TABLE `operational_errors` ADD `revision` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
CREATE INDEX `operational_errors_created` ON `operational_errors` (`created_at`);