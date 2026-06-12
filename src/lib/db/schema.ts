/**
 * Drizzle schema for PagePulse history storage.
 *
 * IMPLEMENTED IN PHASE 4. Planned tables:
 *   - pages          (id, name, tracked, created_at)
 *   - daily_insights (page_id, date, metric, value, breakdown_json)
 *   - post_insights  (post_id, page_id, created_time, metric, value)
 *
 * Left empty on purpose — database storage is built in Phase 4.
 */

export {};
