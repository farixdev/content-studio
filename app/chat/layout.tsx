import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { shellNotifications } from "@/lib/tasks";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const notifications = await shellNotifications(user.id);
  return (
    <AppShell
      user={{ id: user.id, name: user.name, username: user.username, role: user.role }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
