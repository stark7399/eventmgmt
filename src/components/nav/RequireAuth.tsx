// Latest change: theme-aware loading screen (light/dark) replacing the old hardcoded dark-only colors.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "./AppShell";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-stone-500 dark:text-stone-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
