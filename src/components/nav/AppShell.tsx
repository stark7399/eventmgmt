// Latest change: added the light/dark theme toggle button to the header, plus theme-aware colors throughout the shell.
"use client";

import { Sun, Moon } from "lucide-react";
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
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800 md:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{user.displayName}</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => signOut()}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
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
