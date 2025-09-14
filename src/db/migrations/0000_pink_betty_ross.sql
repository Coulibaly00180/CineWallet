CREATE TABLE `cinemas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`website` text,
	`logo_uri` text,
	`primary_color` text,
	`secondary_color` text,
	`qr_format` text,
	`city` text,
	`country` text,
	`phone` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cinemas_slug_unique` ON `cinemas` (`slug`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`qr_payload` text NOT NULL,
	`cinema_id` text NOT NULL,
	`source_file_uri` text NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text NOT NULL,
	`used_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cinema_id`) REFERENCES `cinemas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_code_unique` ON `tickets` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_qr_payload_unique` ON `tickets` (`qr_payload`);