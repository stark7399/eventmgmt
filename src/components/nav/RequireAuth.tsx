// Initial creation: Redirects to /login if not authenticated; otherwise renders children inside AppShell.
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
