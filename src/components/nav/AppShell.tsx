// Initial creation: App shell combining desktop sidebar + mobile bottom nav around page content.
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RoleBadge from "@/components/ui/RoleBadge";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar role={user.role} />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{user.displayName}</span>
            <RoleBadge role={user.role} />
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-6">{children}</main>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
