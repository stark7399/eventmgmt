// Latest change: bigger app-name logo and header controls (theme toggle, sign out) for easier tapping.
"use client";

import Link from "next/link";
import { Sun, Moon, Aperture } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import RoleBadge from "@/components/ui/RoleBadge";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Sidebar role={user.role} />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b-2 border-stone-200 px-4 py-3.5 dark:border-stone-800 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 md:hidden">
            <Aperture className="text-section-dashboard" size={26} />
            <span className="text-lg font-bold text-stone-900 dark:text-stone-100">Studio</span>
          </Link>
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="text-base font-bold">{user.displayName}</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => signOut()}
              className="rounded-xl px-3.5 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-6">{children}</main>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
