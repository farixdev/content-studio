import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { shellNotifications } from "@/lib/tasks";
import { loadStatusSettings } from "@/lib/settings";

export default async function WriterLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("WRITER");
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
