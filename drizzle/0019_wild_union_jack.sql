ALTER TABLE "chat_title_submission" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD COLUMN "game_db_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD COLUMN "game_db_file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD COLUMN "game_db_metadata" jsonb DEFAULT '{"width":"100px","scale":0.7,"marginTop":-3,"marginRight":-10,"marginBottom":0,"marginLeft":-10}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD COLUMN "game_db_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD COLUMN "game_db_file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD COLUMN "game_db_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "chat_title_code_idx" ON "chat_title_submission" USING btree ("code");--> statement-breakpoint
CREATE INDEX "killfeed_code_idx" ON "killfeed_submission" USING btree ("code");--> statement-breakpoint
ALTER TABLE "chat_title_submission" DROP COLUMN "meta_data";--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD CONSTRAINT "chat_title_submission_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD CONSTRAINT "killfeed_submission_code_unique" UNIQUE("code");