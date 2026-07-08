import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRecentMessages } from "@/lib/chat";
import { PageHeader } from "@/components/layout/page-header";
import { ChatRoom } from "@/components/chat/chat-room";

export default async function ChatPage() {
  const user = await requireUser();
  const [messages, roster] = await Promise.all([
    getRecentMessages(100),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true, role: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Team chat"
        description="One room for the whole team — ask a question, tag anyone, share an update."
      />
      <ChatRoom
        initial={messages}
        me={{ id: user.id, name: user.name, role: user.role }}
        roster={roster}
      />
    </div>
  );
}
