// Latest change: theme-aware colors (light/dark variants) - the old dark-only tints were too pale to read on a white background.
import type { UserRole } from "@/types";

const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-400",
  },
  crew: {
    label: "Crew",
    className: "bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:text-blue-400",
  },
  client: {
    label: "Client",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-400",
  },
};

export default function RoleBadge({ role }: { role: UserRole }) {
  const style = ROLE_STYLES[role];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}
