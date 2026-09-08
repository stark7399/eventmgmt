// Initial creation: Desktop collapsible sidebar navigation, role-filtered, hidden below md breakpoint.
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
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 md:flex ${
        collapsed ? "w-[76px]" : "w-64"
      } transition-[width] duration-200`}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <Aperture className="shrink-0 text-amber-500" size={28} />
        {!collapsed && (
          <span className="truncate text-lg font-bold text-zinc-100">Studio</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active
                  ? "bg-zinc-800 text-amber-500"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="m-2 flex items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  );
}
