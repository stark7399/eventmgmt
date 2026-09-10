// Latest change: bolder, stronger-fill badge (was a faint tint, now reads clearly at a glance).
import type { UserRole } from "@/types";

const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-amber-500/15 text-amber-700 ring-amber-500/40 dark:text-amber-400",
  },
  crew: {
    label: "Crew",
    className: "bg-blue-500/15 text-blue-700 ring-blue-500/40 dark:text-blue-400",
  },
  client: {
    label: "Client",
    className: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/40 dark:text-emerald-400",
  },
};

export default function RoleBadge({ role }: { role: UserRole }) {
  const style = ROLE_STYLES[role];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-2 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}
