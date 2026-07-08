import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { shellNotifications } from "@/lib/tasks";
import { loadStatusSettings } from "@/lib/settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reviewers may use the shared admin pages (projects/content) — the
  // middleware limits exactly which /admin paths they can reach.
  const user = await requireRole(["ADMIN", "REVIEWER"]);
  const notifications = await shellNotifications(user.id);
  const statusSettings = await loadStatusSettings();
  return (
    <AppShell
      user={{ id: user.id, name: user.name, username: user.username, role: user.role }}
      notifications={notifications}
      statusSettings={statusSettings}
    >
      {children}
    </AppShell>
  );
}
