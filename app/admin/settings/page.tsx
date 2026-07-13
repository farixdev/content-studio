import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/components/admin/settings-view";
import { getStatusesForSettings, getContentTypes } from "@/lib/settings";
import { getChatPolicy } from "@/lib/chat";

export default async function AdminSettingsPage() {
  const me = await requireRole("ADMIN");
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
        description="Your account, statuses, content types, and who can chat."
      />
      <SettingsView
        statuses={statuses}
        contentTypes={contentTypes}
        chatPolicy={chatPolicy}
        account={{ name: me.name, username: me.username }}
      />
    </div>
  );
}
