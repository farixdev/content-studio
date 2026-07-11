import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/components/admin/settings-view";
import { getStatusesForSettings, getContentTypes } from "@/lib/settings";
import { getChatPolicy } from "@/lib/chat";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  // getContentTypes seeds the defaults once (marker-tracked) on first use.
  const [statuses, contentTypes, chatPolicy] = await Promise.all([
    getStatusesForSettings(),
    getContentTypes(),
    getChatPolicy(),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Rename or recolour any status, add your own, manage content types, and set who can chat."
      />
      <SettingsView statuses={statuses} contentTypes={contentTypes} chatPolicy={chatPolicy} />
    </div>
  );
}
