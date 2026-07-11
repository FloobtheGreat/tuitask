CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` integer,
	`due_date` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "tasks_title_check" CHECK(length(trim("tasks"."title")) > 0),
	CONSTRAINT "tasks_priority_check" CHECK("tasks"."priority" IS NULL OR "tasks"."priority" IN (1, 2, 3)),
	CONSTRAINT "tasks_due_date_check" CHECK("tasks"."due_date" IS NULL OR "tasks"."due_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_completed_due` ON `tasks` (`completed_at`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_priority` ON `tasks` (`priority`);