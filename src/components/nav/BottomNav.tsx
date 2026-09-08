// Initial creation: Mobile bottom navigation bar, role-filtered with a "More" overflow for >4 items.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { navItemsForRole } from "./nav-items";
import type { UserRole } from "@/types";

const MAX_PRIMARY_ITEMS = 4;

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navItemsForRole(role);

  const primaryItems = items.slice(0, MAX_PRIMARY_ITEMS);
  const overflowItems = items.slice(MAX_PRIMARY_ITEMS);
  const hasOverflow = overflowItems.length > 0;

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl border-t border-zinc-800 bg-zinc-900 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {overflowItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-100 active:bg-zinc-800"
                >
                  <Icon size={22} />
                  <span className="text-base font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch justify-around">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-16 flex-1 flex-col items-center gap-1 py-2.5 ${
                  active ? "text-amber-500" : "text-zinc-500"
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {hasOverflow && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex min-w-16 flex-1 flex-col items-center gap-1 py-2.5 ${
                moreOpen ? "text-amber-500" : "text-zinc-500"
              }`}
            >
              {moreOpen ? <X size={24} /> : <MoreHorizontal size={24} />}
              <span className="text-[11px] font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
