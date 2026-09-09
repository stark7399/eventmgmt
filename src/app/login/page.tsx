// Latest change: theme-aware redesign (light/dark) replacing the old hardcoded dark-only login screen.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aperture } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Aperture className="text-section-dashboard" size={40} />
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Studio</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
          />

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-section-dashboard py-3 font-semibold text-white disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span className="text-xs text-stone-400 dark:text-stone-600">OR</span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full rounded-lg border border-stone-200 bg-white py-3 font-medium text-stone-900 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-stone-500 dark:text-stone-400"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
