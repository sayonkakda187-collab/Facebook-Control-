import Link from "next/link";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const gated = Boolean(getEnv().DASHBOARD_PASSWORD);
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/";
  const showError = sp.error === "1";

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-emerald-400 ring-1 ring-zinc-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l2-6 4 12 2-6h4" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">PagePulse</span>
        </div>

        {gated ? (
          <form
            method="post"
            action="/api/auth/login"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <input type="hidden" name="next" value={next} />
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Dashboard password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
            {showError && (
              <p className="mt-2 text-sm text-rose-400">Incorrect password.</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Sign in
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-400">
            <p>
              The access gate is disabled (no <code className="text-zinc-300">DASHBOARD_PASSWORD</code> set).
            </p>
            <Link href="/" className="mt-3 inline-block text-emerald-400 hover:underline">
              Go to dashboard →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
