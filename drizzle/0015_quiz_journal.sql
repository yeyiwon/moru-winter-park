CREATE TABLE `quiz_journal` (
	`visitor` text NOT NULL,
	`record_id` text NOT NULL,
	`question_id` text NOT NULL,
	`revision` text NOT NULL,
	`snapshot` text NOT NULL,
	`choice` integer NOT NULL,
	`correct` integer NOT NULL,
	`ever_correct` integer NOT NULL,
	`saved` integer DEFAULT 0 NOT NULL,
	`first_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_attempt` text NOT NULL,
	PRIMARY KEY(`visitor`, `record_id`)
);
--> statement-breakpoint
CREATE INDEX `quiz_journal_visitor_updated` ON `quiz_journal` (`visitor`,`updated_at`);