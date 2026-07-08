"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Send, Loader2, AtSign, X, Trash2 } from "lucide-react";
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
  online: boolean;
}

export function ChatBubble({ me }: { me: { id: string; name: string; role: string } }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const lastAt = useRef<string | null>(null);
  const openRef = useRef(open);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  openRef.current = open;

  // Initial load + polling (poll doubles as a presence heartbeat).
  useEffect(() => {
    let active = true;

    async function full() {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok || !active) return;
        const data = await res.json();
        const msgs: Msg[] = data.messages ?? [];
        setMessages(msgs);
        setRoster(data.roster ?? []);
        lastAt.current = msgs.length ? msgs[msgs.length - 1].createdAt : new Date(0).toISOString();
        setLoaded(true);
      } catch {
        /* ignore */
      }
    }

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const after = lastAt.current;
        const res = await fetch("/api/chat" + (after ? `?after=${encodeURIComponent(after)}` : ""));
        if (!res.ok || !active) return;
        const data = await res.json();
        setRoster(data.roster ?? []);
        const incoming: Msg[] = data.messages ?? [];
        if (!incoming.length) return;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !ids.has(m.id));
          if (!fresh.length) return prev;
          lastAt.current = fresh[fresh.length - 1].createdAt;
          if (!openRef.current) {
            const notMine = fresh.filter((m) => m.authorId !== me.id).length;
            if (notMine) setUnread((u) => u + notMine);
          }
          return [...prev, ...fresh];
        });
      } catch {
        /* ignore */
      }
    }

    full();
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      // Every ~minute do a full reconcile so messages deleted by others disappear too.
      if (ticks % 6 === 0) full();
      else poll();
    }, 10000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [me.id]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      endRef.current?.scrollIntoView();
    }
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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

  async function del(id: string) {
    const removed = messages.find((m) => m.id === id);
    setMessages((list) => list.filter((m) => m.id !== id));
    const restore = () => {
      if (removed) {
        // Re-insert only the removed message so we don't clobber messages that
        // arrived while the request was in flight.
        setMessages((list) =>
          list.some((m) => m.id === id)
            ? list
            : [...list, removed].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        );
      }
      toast.error("Could not delete.");
    };
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "DELETE" });
      if (!res.ok) restore();
    } catch {
      restore();
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

  const onlineCount = roster.filter((r) => r.online).length;
  const isAdmin = me.role === "ADMIN";

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Team chat</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {onlineCount} online
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
            {!loaded ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No messages yet — say hi 👋
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.authorId === me.id;
                const canDelete = mine || isAdmin;
                return (
                  <div key={m.id} className={cn("group flex gap-2", mine && "flex-row-reverse")}>
                    <UserAvatar name={m.authorName} className="h-7 w-7 shrink-0" />
                    <div className={cn("max-w-[80%]", mine && "flex flex-col items-end")}>
                      <div className="mb-0.5 flex items-center gap-1 text-[11px]">
                        <span className="font-medium text-foreground">{mine ? "You" : m.authorName}</span>
                        <span className="text-muted-foreground">
                          · {ROLE_LABELS[m.authorRole as Role] ?? m.authorRole}
                        </span>
                        <span className="text-muted-foreground/70">· {timeAgo(m.createdAt)}</span>
                        {canDelete && (
                          <button
                            onClick={() => del(m.id)}
                            className="ml-0.5 rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          "inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm",
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

          <div className="border-t border-border p-2.5">
            {roster.filter((r) => r.id !== me.id).length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <AtSign className="h-3 w-3 text-muted-foreground" />
                {roster
                  .filter((r) => r.id !== me.id)
                  .slice(0, 10)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => insertTag(r.username)}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-primary-50 hover:text-primary-700"
                    >
                      {r.online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
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
                placeholder="Message the team…"
                className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="brand-gradient fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-elevated transition hover:scale-105"
        aria-label="Team chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
