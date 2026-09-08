// Initial creation: Small colored badge showing a user's role - reused across the app as the role color signature.
import type { UserRole } from "@/types";

const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  crew: { label: "Crew", className: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  client: { label: "Client", className: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
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
