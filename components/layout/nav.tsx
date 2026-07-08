import {
  LayoutDashboard,
  FileText,
  Users,
  PenLine,
  ClipboardCheck,
  Palette,
  FolderKanban,
  Code2,
  MessagesSquare,
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
        { label: "Team", href: "/admin/team", icon: Users },
        { label: "Team Chat", href: "/chat", icon: MessagesSquare },
      ];
    case "WRITER":
      return [
        { label: "My Work", href: "/writer", icon: PenLine },
        { label: "My Projects", href: "/writer/projects", icon: FolderKanban },
        { label: "Team Chat", href: "/chat", icon: MessagesSquare },
      ];
    case "REVIEWER":
      return [
        { label: "Review Queue", href: "/reviewer", icon: ClipboardCheck },
        { label: "Projects", href: "/admin/projects", icon: FolderKanban },
        { label: "Content", href: "/admin/tasks", icon: FileText },
        { label: "Team Chat", href: "/chat", icon: MessagesSquare },
      ];
    case "DESIGNER":
      return [
        { label: "Design Board", href: "/designer", icon: Palette },
        { label: "Team Chat", href: "/chat", icon: MessagesSquare },
      ];
    case "DEVELOPER":
      return [
        { label: "Dev Board", href: "/developer", icon: Code2 },
        { label: "Team Chat", href: "/chat", icon: MessagesSquare },
      ];
    default:
      return [];
  }
}

export function isNavActive(pathname: string, href: string, role: Role): boolean {
  if (href === ROLE_HOME[role]) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
