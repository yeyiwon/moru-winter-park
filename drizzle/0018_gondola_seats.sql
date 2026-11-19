PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ride_seats` (
	`room` text NOT NULL,
	`kind` text NOT NULL,
	`cabin` integer NOT NULL,
	`seat` integer NOT NULL,
	`visitor` text NOT NULL,
	`started_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`room`, `kind`, `cabin`, `seat`),
	CONSTRAINT "ride_seats_kind_seat" CHECK(("__new_ride_seats"."kind" = 'dining' AND "__new_ride_seats"."seat" IN (0,1,2)) OR ("__new_ride_seats"."kind" = 'gondola' AND "__new_ride_seats"."seat" IN (0,1,2,3,4,5)) OR ("__new_ride_seats"."kind" NOT IN ('dining','gondola') AND "__new_ride_seats"."seat" IN (0,1)))
);
--> statement-breakpoint
INSERT INTO `__new_ride_seats`("room", "kind", "cabin", "seat", "visitor", "started_at", "expires_at") SELECT "room", "kind", "cabin", "seat", "visitor", "started_at", "expires_at" FROM `ride_seats`;--> statement-breakpoint
DROP TABLE `ride_seats`;--> statement-breakpoint
ALTER TABLE `__new_ride_seats` RENAME TO `ride_seats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `ride_seats_visitor_unique` ON `ride_seats` (`visitor`);