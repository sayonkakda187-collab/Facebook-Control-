import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
