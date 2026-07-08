import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/components/admin/settings-view";
import { getStatusesForSettings, getContentTypes, seedContentTypesIfEmpty } from "@/lib/settings";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  await seedContentTypesIfEmpty();
  const [statuses, contentTypes] = await Promise.all([getStatusesForSettings(), getContentTypes()]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Rename or recolour any status, add your own, and manage content types."
      />
      <SettingsView statuses={statuses} contentTypes={contentTypes} />
    </div>
  );
}
