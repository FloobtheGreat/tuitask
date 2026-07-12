CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "projects_name_check" CHECK(length(trim("projects"."name")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_projects_name_unique` ON `projects` (lower("name"));--> statement-breakpoint
INSERT INTO `projects` (`id`, `name`, `created_at`, `updated_at`)
VALUES (1, 'Inbox', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` integer,
	`due_date` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "tasks_title_check" CHECK(length(trim("title")) > 0),
	CONSTRAINT "tasks_priority_check" CHECK("priority" IS NULL OR "priority" IN (1, 2, 3)),
	CONSTRAINT "tasks_due_date_check" CHECK("due_date" IS NULL OR "due_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);--> statement-breakpoint
INSERT INTO `__new_tasks` (`id`, `project_id`, `title`, `description`, `priority`, `due_date`, `completed_at`, `created_at`, `updated_at`)
SELECT `id`, 1, `title`, `description`, `priority`, `due_date`, `completed_at`, `created_at`, `updated_at` FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE INDEX `idx_tasks_completed_due` ON `tasks` (`completed_at`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_priority` ON `tasks` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_tasks_project` ON `tasks` (`project_id`);
