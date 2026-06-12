import { defineConfig } from "drizzle-kit";

// Drizzle Kit config. The schema and migrations are implemented in Phase 4.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
