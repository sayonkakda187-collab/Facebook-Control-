import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { AUTH_COOKIE, AUTH_MAX_AGE, createAuthCookieValue } from "@/lib/auth";

export async function POST(request: Request) {
  const env = getEnv();
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const nextParam = String(form.get("next") ?? "/");
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  // Gate disabled — nothing to log into.
  if (!env.DASHBOARD_PASSWORD) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  if (password !== env.DASHBOARD_PASSWORD) {
    return NextResponse.redirect(
      new URL(`/login?error=1&next=${encodeURIComponent(safeNext)}`, request.url),
      303,
    );
  }

  const secret = env.AUTH_SECRET || env.DASHBOARD_PASSWORD;
  const res = NextResponse.redirect(new URL(safeNext, request.url), 303);
  res.cookies.set(AUTH_COOKIE, createAuthCookieValue(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
