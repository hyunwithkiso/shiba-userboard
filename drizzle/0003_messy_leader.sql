ALTER TABLE "user" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "roles" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp NOT NULL;