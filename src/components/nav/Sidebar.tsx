// Latest change: active tab now shows a filled colored background, and icons/rows are bigger for easier clicking.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Aperture } from "lucide-react";
import { navItemsForRole } from "./nav-items";
import type { UserRole } from "@/types";

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItemsForRole(role);

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 md:flex ${
        collapsed ? "w-[76px]" : "w-64"
      } transition-[width] duration-200`}
    >
      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5">
        <Aperture className="shrink-0 text-section-dashboard" size={28} />
        {!collapsed && (
          <span className="truncate text-lg font-bold text-stone-900 dark:text-stone-100">Studio</span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-base font-semibold ${
                active
                  ? "bg-section-dashboard/15 text-section-dashboard"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Icon size={24} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="m-3 flex items-center justify-center gap-2 rounded-xl border-2 border-stone-200 py-2.5 text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
      >
        {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
      </button>
    </aside>
  );
}
