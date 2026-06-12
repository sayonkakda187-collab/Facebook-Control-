import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyAuthCookieValue } from "@/lib/auth";

/**
 * Access gate. Disabled entirely when DASHBOARD_PASSWORD is unset (so the app
 * runs and looks complete before any credentials are added). Once a password is
 * set, unauthenticated page requests are redirected to /login.
 *
 * (Next.js 16 renamed Middleware → Proxy; runtime is nodejs.)
 */
export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const secret = process.env.AUTH_SECRET || password;
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (verifyAuthCookieValue(cookie, secret)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Gate page routes only — never /api (cron has its own CRON_SECRET), static
  // assets, the service worker, manifest, icons, or the login page itself.
  matcher: [
    "/((?!api|_next/static|_next/image|login|sw\\.js|manifest\\.webmanifest|favicon\\.ico|.*\\.(?:png|svg|ico|webmanifest|js|map)).*)",
  ],
};
