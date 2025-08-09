CREATE TABLE "auth_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"discord_id" text NOT NULL,
	"attempt_type" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_attempts" ADD CONSTRAINT "auth_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_attempts_user_idx" ON "auth_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_attempts_discord_idx" ON "auth_attempts" USING btree ("discord_id");--> statement-breakpoint
CREATE INDEX "auth_attempts_created_at_idx" ON "auth_attempts" USING btree ("created_at");