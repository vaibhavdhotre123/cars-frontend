"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveUser, requestPasswordReset } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      saveUser(user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back to Cars.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-base text-black outline-none focus:border-black dark:border-white/20 dark:text-zinc-50 dark:focus:border-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center justify-between">
              Password
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-black hover:underline dark:hover:text-white"
              >
                Forgot password?
              </button>
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-base text-black outline-none focus:border-black dark:border-white/20 dark:text-zinc-50 dark:focus:border-white"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-black underline dark:text-zinc-50">
            Create one
          </Link>
        </p>
      </div>

      {forgotOpen && (
        <ForgotPasswordModal
          initialEmail={email}
          onClose={() => setForgotOpen(false)}
        />
      )}
    </main>
  );
}

// ---- Forgot-password popup -------------------------------------------------
function ForgotPasswordModal({
  initialEmail,
  onClose,
}: {
  initialEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const message = await requestPasswordReset(email.trim());
      setSentMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm [animation:overlayFadeIn_120ms_ease-out]"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-2xl [animation:popupIn_160ms_cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Reset password</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              We&apos;ll email you a link to set a new password.
            </p>
          </div>
          <button
            onClick={() => !busy && onClose()}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sentMessage ? (
          <div className="mt-6">
            <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {sentMessage}
            </div>
            <button
              onClick={onClose}
              className="mt-5 h-11 w-full rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-base text-black outline-none focus:border-black dark:border-white/20 dark:text-zinc-50 dark:focus:border-white"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="h-11 flex-1 rounded-full border border-black/15 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-11 flex-1 rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
