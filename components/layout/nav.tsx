import {
  LayoutDashboard,
  FileText,
  Users,
  PenLine,
  ClipboardCheck,
  Palette,
  FolderKanban,
  Code2,
  Settings,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { ROLE_HOME, type Role } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Projects", href: "/admin/projects", icon: FolderKanban },
        { label: "Content", href: "/admin/tasks", icon: FileText },
        { label: "Design", href: "/admin/design", icon: Palette },
        { label: "Development", href: "/admin/development", icon: Code2 },
        { label: "Team", href: "/admin/team", icon: Users },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ];
    case "WRITER":
      return [
        { label: "My Work", href: "/writer", icon: PenLine },
        { label: "My Projects", href: "/writer/projects", icon: FolderKanban },
        { label: "Monthly", href: "/writer/history", icon: CalendarRange },
      ];
    case "REVIEWER":
      return [
        { label: "Review Queue", href: "/reviewer", icon: ClipboardCheck },
        { label: "Projects", href: "/admin/projects", icon: FolderKanban },
        { label: "Content", href: "/admin/tasks", icon: FileText },
        { label: "Design", href: "/admin/design", icon: Palette },
      ];
    case "DESIGNER":
      return [
        { label: "Design Board", href: "/designer", icon: Palette },
        { label: "My Projects", href: "/designer/projects", icon: FolderKanban },
        { label: "Monthly", href: "/designer/history", icon: CalendarRange },
      ];
    case "DEVELOPER":
      return [
        { label: "Dev Board", href: "/developer", icon: Code2 },
        { label: "My Projects", href: "/developer/projects", icon: FolderKanban },
        { label: "Monthly", href: "/developer/history", icon: CalendarRange },
      ];
    default:
      return [];
  }
}

export function isNavActive(pathname: string, href: string, role: Role): boolean {
  if (href === ROLE_HOME[role]) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
