// Simple liveness probe. Useful for uptime checks and verifying a deploy.
export async function GET() {
  return Response.json({
    ok: true,
    app: "pagepulse",
    phase: 2,
    time: new Date().toISOString(),
  });
}
