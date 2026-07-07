"use client";

import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { TaskDetail } from "@/lib/detail";

export function Comments({
  taskId,
  initial,
}: {
  taskId: string;
  initial: TaskDetail["comments"];
}) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to post comment.");
      } else {
        setComments((c) => [
          ...c,
          {
            id: data.id,
            body: data.body,
            authorName: data.authorName,
            authorRole: "",
            createdAt: data.createdAt,
          },
        ]);
        setBody("");
      }
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="h-4 w-4 text-primary" />
        Discussion
        {comments.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {comments.length}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <UserAvatar name={c.authorName} className="h-8 w-8" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground/90">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="min-h-[44px] flex-1"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={loading || !body.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}
