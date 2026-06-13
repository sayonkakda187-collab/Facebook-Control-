import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  jsonb,
  boolean,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Pages we track (the Facebook Pages the user administers). */
export const pages = pgTable("pages", {
  id: text("id").primaryKey(), // Facebook Page ID
  name: text("name"),
  tracked: boolean("tracked").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per (page, metric, day). The unique index makes a re-run of the same
 * day an UPDATE, never a duplicate.
 */
export const dailyInsights = pgTable(
  "daily_insights",
  {
    id: serial("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    date: date("date").notNull(), // the day the metric covers (YYYY-MM-DD)
    metric: text("metric").notNull(),
    value: integer("value"), // null when not available from the API
    breakdown: jsonb("breakdown").$type<Record<string, number> | null>(),
    available: boolean("available").notNull().default(true),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_insights_page_metric_date_uniq").on(t.pageId, t.metric, t.date),
    index("daily_insights_page_date_idx").on(t.pageId, t.date),
  ],
);

/** Per-post metrics. Deduped by (post, metric) — re-pulls update the value. */
export const postInsights = pgTable(
  "post_insights",
  {
    id: serial("id").primaryKey(),
    postId: text("post_id").notNull(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    createdTime: timestamp("created_time", { withTimezone: true }),
    message: text("message"),
    metric: text("metric").notNull(),
    value: integer("value"),
    breakdown: jsonb("breakdown").$type<Record<string, number> | null>(),
    available: boolean("available").notNull().default(true),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("post_insights_post_metric_uniq").on(t.postId, t.metric),
    index("post_insights_page_idx").on(t.pageId),
  ],
);

export type Page = typeof pages.$inferSelect;
export type DailyInsight = typeof dailyInsights.$inferSelect;
export type PostInsight = typeof postInsights.$inferSelect;
