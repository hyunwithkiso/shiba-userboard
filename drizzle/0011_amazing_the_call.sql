CREATE TABLE "chat_title_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewer_id" text,
	"admin_notes" text,
	"margin_x" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "killfeed_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewer_id" text,
	"admin_notes" text,
	"margin_x" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "category" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "file_submission" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "category" CASCADE;--> statement-breakpoint
DROP TABLE "file_submission" CASCADE;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD CONSTRAINT "chat_title_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_title_submission" ADD CONSTRAINT "chat_title_submission_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD CONSTRAINT "killfeed_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "killfeed_submission" ADD CONSTRAINT "killfeed_submission_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_title_user_idx" ON "chat_title_submission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_title_status_idx" ON "chat_title_submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "killfeed_user_idx" ON "killfeed_submission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "killfeed_status_idx" ON "killfeed_submission" USING btree ("status");