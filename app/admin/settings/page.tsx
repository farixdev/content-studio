import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/components/admin/settings-view";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const rows = await prisma.customStatus.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const statuses = rows.map((r) => ({ id: r.id, label: r.label, color: r.color }));

  return (
    <div>
      <PageHeader title="Settings" description="Custom statuses and workspace options." />
      <SettingsView initial={statuses} />
    </div>
  );
}
