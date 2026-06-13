CREATE TABLE "daily_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"date" date NOT NULL,
	"metric" text NOT NULL,
	"value" integer,
	"breakdown" jsonb,
	"available" boolean DEFAULT true NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"tracked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"page_id" text NOT NULL,
	"created_time" timestamp with time zone,
	"message" text,
	"metric" text NOT NULL,
	"value" integer,
	"breakdown" jsonb,
	"available" boolean DEFAULT true NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_insights" ADD CONSTRAINT "daily_insights_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_insights" ADD CONSTRAINT "post_insights_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_insights_page_metric_date_uniq" ON "daily_insights" USING btree ("page_id","metric","date");--> statement-breakpoint
CREATE INDEX "daily_insights_page_date_idx" ON "daily_insights" USING btree ("page_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "post_insights_post_metric_uniq" ON "post_insights" USING btree ("post_id","metric");--> statement-breakpoint
CREATE INDEX "post_insights_page_idx" ON "post_insights" USING btree ("page_id");