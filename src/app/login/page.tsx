// Initial creation: Login page with email/password + Google sign-in.
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Aperture className="text-amber-500" size={40} />
          <h1 className="text-xl font-bold text-zinc-100">Studio</h1>
          <p className="text-sm text-zinc-500">
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
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-amber-500 py-3 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-500">OR</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-3 font-medium text-zinc-100 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-zinc-500"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
