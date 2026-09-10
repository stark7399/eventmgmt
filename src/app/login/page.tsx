// Latest change: bolder, bigger fields and buttons for consistency with the rest of the app's redesign.
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
        <div className="mb-9 flex flex-col items-center gap-2.5">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-section-dashboard/15 text-section-dashboard">
            <Aperture size={36} />
          </span>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Studio</h1>
          <p className="text-base text-stone-500 dark:text-stone-400">
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
              className="rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base text-stone-900 placeholder-stone-400 outline-none focus:border-section-dashboard dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
          />

          {error && <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-xl bg-section-dashboard py-3.5 text-base font-bold text-white shadow-sm disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span className="text-xs font-bold text-stone-400 dark:text-stone-600">OR</span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full rounded-xl border-2 border-stone-200 bg-white py-3.5 text-base font-bold text-stone-900 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm font-semibold text-stone-500 dark:text-stone-400"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
