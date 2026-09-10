// Initial creation: Role-aware navigation item definitions shared by bottom nav (mobile) and sidebar (desktop).
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  Wallet,
  Camera,
  ImageIcon,
  FolderKanban,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "crew", "client"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "crew"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["admin", "crew", "client"] },
  { href: "/todos", label: "Tasks", icon: ListChecks, roles: ["admin", "crew"] },
  { href: "/equipment", label: "Equipment", icon: Camera, roles: ["admin", "crew"] },
  { href: "/gallery", label: "Gallery", icon: ImageIcon, roles: ["client"] },
  { href: "/finance", label: "Finance", icon: Wallet, roles: ["admin"] },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
