// Phase 3 will implement this: pull a single page's insights via the Graph API
// v25.0 engine (lib/facebook.ts) and return the normalized result for testing
// against a real token. Stubbed until Phase 3 is approved.
export async function GET() {
  return Response.json(
    {
      error: "Not implemented",
      phase: 3,
      message:
        "The insights test endpoint is built in Phase 3 (single-page pull, normalized output).",
    },
    { status: 501 },
  );
}
