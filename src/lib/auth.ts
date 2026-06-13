import crypto from "node:crypto";

export const AUTH_COOKIE = "pp_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Build a signed `<expiry>.<hmac>` cookie value. */
export function createAuthCookieValue(secret: string): string {
  const payload = String(Date.now() + AUTH_MAX_AGE * 1000);
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a signed cookie value (constant-time) and that it hasn't expired. */
export function verifyAuthCookieValue(
  value: string | undefined,
  secret: string | undefined,
): boolean {
  if (!value || !secret) return false;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}
