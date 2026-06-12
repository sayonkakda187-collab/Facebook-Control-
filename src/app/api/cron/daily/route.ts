// Phase 4 will implement this: the Vercel Cron target that pulls all tracked
// pages once daily and stores the history in Postgres. It will verify the
// CRON_SECRET bearer token before running. Stubbed until Phase 4.
export async function GET() {
  return Response.json(
    {
      error: "Not implemented",
      phase: 4,
      message: "The daily cron pull + history storage is built in Phase 4.",
    },
    { status: 501 },
  );
}
