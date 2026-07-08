"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface Msg {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}
interface RosterMember {
  id: string;
  name: string;
  username: string;
  role: string;
}

export function ChatRoom({
  initial,
  me,
  roster,
}: {
  initial: Msg[];
  me: { id: string; name: string; role: string };
  roster: RosterMember[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | null>(initial.length ? initial[initial.length - 1].createdAt : null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages while visible + on focus.
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const after = lastAt.current;
        const res = await fetch("/api/chat" + (after ? `?after=${encodeURIComponent(after)}` : ""));
        if (!res.ok) return;
        const data = await res.json();
        const incoming: Msg[] = data.messages ?? [];
        if (!incoming.length) return;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !ids.has(m.id));
          if (!fresh.length) return prev;
          lastAt.current = fresh[fresh.length - 1].createdAt;
          return [...prev, ...fresh];
        });
      } catch {
        /* ignore transient poll errors */
      }
    };
    const id = setInterval(tick, 4000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send.");
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        lastAt.current = data.message.createdAt;
        return [...prev, data.message];
      });
      setText("");
    } catch {
      toast.error("Could not send.");
    } finally {
      setSending(false);
    }
  }

  function insertTag(username: string) {
    setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}@${username} `);
    inputRef.current?.focus();
  }

  const usernames = new Set(roster.map((r) => r.username.toLowerCase()));
  function renderBody(body: string) {
    return body.split(/(\s+)/).map((part, i) => {
      const m = /^@([a-zA-Z0-9_]+)$/.exec(part);
      if (m && usernames.has(m[1].toLowerCase())) {
        return (
          <span key={i} className="rounded bg-primary-50 px-1 font-medium text-primary-700">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet — say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.authorId === me.id;
            return (
              <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                <UserAvatar name={m.authorName} className="h-8 w-8 shrink-0" />
                <div className={cn("max-w-[78%]", mine && "flex flex-col items-end")}>
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-foreground">{mine ? "You" : m.authorName}</span>
                    <span className="text-muted-foreground">
                      · {ROLE_LABELS[m.authorRole as Role] ?? m.authorRole}
                    </span>
                    <span className="text-muted-foreground/70">· {timeAgo(m.createdAt)}</span>
                  </div>
                  <div
                    className={cn(
                      "inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {renderBody(m.body)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        {roster.filter((r) => r.id !== me.id).length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <AtSign className="h-3 w-3" /> Tag:
            </span>
            {roster
              .filter((r) => r.id !== me.id)
              .slice(0, 14)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => insertTag(r.username)}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-primary-50 hover:text-primary-700"
                >
                  {r.name.split(" ")[0]}
                </button>
              ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message the team…  (Enter to send, Shift+Enter for a new line)"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
          />
          <Button
            onClick={send}
            disabled={sending || !text.trim()}
            className="h-[42px] w-[42px] shrink-0 p-0"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
