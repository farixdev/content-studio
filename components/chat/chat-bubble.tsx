"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Send, Loader2, X, Trash2, ChevronLeft, Search, Paperclip } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Linkify } from "@/components/linkify";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { OPEN_CHAT_EVENT } from "@/lib/notify-link";
import { cn, timeAgo, formatDate } from "@/lib/utils";
import { toast } from "sonner";

/** Compact timestamp for the contact list: time today, date otherwise. */
function shortTime(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? formatDate(iso, "h:mm a") : formatDate(iso, "MMM d");
}

interface Msg {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  file: { id: string; name: string } | null;
  createdAt: string;
}
interface Contact {
  id: string;
  name: string;
  username: string;
  role: string;
  online: boolean;
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
  lastFromMe: boolean;
}

export function ChatBubble({ me }: { me: { id: string; name: string; role: string } }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingFile, setPendingFile] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeRef = useRef<Contact | null>(null);
  activeRef.current = active;
  const contactsRef = useRef<Contact[]>([]);
  contactsRef.current = contacts;
  const mutating = useRef(0); // in-flight send/delete count — pauses poll reconcile
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CHAT_FILE_MAX = 1024 * 1024; // 1 MB

  async function attach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (file.size > CHAT_FILE_MAX) {
      toast.error("Attachments must be under 1 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Upload failed.");
      else setPendingFile({ id: data.id, name: data.originalName });
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Poll the contact list (unread + presence) continuously — doubles as the
  // presence heartbeat and keeps the bubble's unread badge live.
  useEffect(() => {
    let live = true;
    async function pull() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/chat");
        if (!res.ok || !live) return;
        const data = await res.json();
        setContacts(data.contacts ?? []);
      } catch {
        /* ignore */
      }
    }
    pull();
    const id = setInterval(pull, 6000);
    const onVis = () => document.visibilityState === "visible" && pull();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  // Jump straight into a conversation when a notification (bell or popup) is clicked.
  useEffect(() => {
    async function onOpenChat(e: Event) {
      const userId = (e as CustomEvent).detail?.userId as string | undefined;
      if (!userId) return;
      setOpen(true);
      let target = contactsRef.current.find((c) => c.id === userId) ?? null;
      if (!target) {
        // First message from someone not in the cached list yet — refetch.
        try {
          const res = await fetch("/api/chat");
          if (res.ok) {
            const data = await res.json();
            const list: Contact[] = data.contacts ?? [];
            setContacts(list);
            target = list.find((c) => c.id === userId) ?? null;
          }
        } catch {
          /* ignore */
        }
      }
      if (target) setActive(target);
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpenChat as EventListener);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpenChat as EventListener);
  }, []);

  // Poll the open conversation.
  useEffect(() => {
    if (!active) return;
    let live = true;
    let first = true;
    async function pull() {
      if (!first && document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/chat/${active!.id}`);
        if (!res.ok || !live) return;
        const data = await res.json();
        // Don't overwrite local state while a send/delete is in flight — a stale
        // snapshot would make the just-sent message vanish (or a deleted one return).
        if (mutating.current > 0) return;
        const incoming: Msg[] = data.messages ?? [];
        setMessages((prev) => {
          const same =
            prev.length === incoming.length &&
            prev[0]?.id === incoming[0]?.id &&
            prev[prev.length - 1]?.id === incoming[incoming.length - 1]?.id;
          return same ? prev : incoming;
        });
        setMsgsLoading(false);
        // Opening/reading clears this contact's unread locally.
        setContacts((cs) => cs.map((c) => (c.id === active!.id ? { ...c, unread: 0 } : c)));
      } catch {
        /* ignore */
      } finally {
        first = false;
      }
    }
    setMsgsLoading(true);
    setMessages([]);
    pull();
    const id = setInterval(pull, 4000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [active]);

  useEffect(() => {
    if (active) endRef.current?.scrollIntoView();
  }, [active]);
  useEffect(() => {
    if (active) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active]);

  async function send() {
    const body = text.trim();
    if ((!body && !pendingFile) || !active) return;
    setSending(true);
    mutating.current += 1;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: active.id, body, fileId: pendingFile?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send.");
        return;
      }
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setText("");
      setPendingFile(null);
    } catch {
      toast.error("Could not send.");
    } finally {
      setSending(false);
      mutating.current -= 1;
    }
  }

  async function del(id: string) {
    const removed = messages.find((m) => m.id === id);
    setMessages((list) => list.filter((m) => m.id !== id));
    mutating.current += 1;
    const restore = () => {
      if (removed) {
        setMessages((list) =>
          list.some((m) => m.id === id)
            ? list
            : [...list, removed].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        );
      }
      toast.error("Could not delete.");
    };
    try {
      const res = await fetch(`/api/chat/message/${id}`, { method: "DELETE" });
      if (!res.ok) restore();
    } catch {
      restore();
    } finally {
      mutating.current -= 1;
    }
  }

  const unreadTotal = contacts.reduce((n, c) => n + c.unread, 0);
  const onlineCount = contacts.filter((c) => c.online).length;
  const isAdmin = me.role === "ADMIN";

  const q = search.trim().toLowerCase();
  // The server returns contacts newest-conversation-first; search only narrows.
  const filtered = q
    ? contacts.filter((c) =>
        `${c.name} ${ROLE_LABELS[c.role as Role] ?? c.role} ${c.lastMessage ?? ""}`
          .toLowerCase()
          .includes(q)
      )
    : contacts;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          {!active ? (
            <>
              {/* Contacts header */}
              <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Messages</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {onlineCount} online
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Search */}
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search people…"
                    className="w-full rounded-lg border border-border bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              {/* Contacts list */}
              <div className="thin-scrollbar flex-1 overflow-y-auto p-2">
                {contacts.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No contacts available.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No matches.
                  </div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setContacts((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
                        setActive(c);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-muted"
                    >
                      <div className="relative shrink-0">
                        <UserAvatar name={c.name} className="h-10 w-10" />
                        {c.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={cn(
                              "truncate text-sm text-foreground",
                              c.unread > 0 ? "font-semibold" : "font-medium"
                            )}
                          >
                            {c.name}
                          </span>
                          {c.lastAt && (
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                              {shortTime(c.lastAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate text-[11px]",
                              c.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {c.lastMessage
                              ? `${c.lastFromMe ? "You: " : ""}${c.lastMessage}`
                              : ROLE_LABELS[c.role as Role] ?? c.role}
                          </span>
                          {c.unread > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          )}
                        </div>
                        {c.lastMessage && (
                          <div className="truncate text-[10px] text-muted-foreground/70">
                            {ROLE_LABELS[c.role as Role] ?? c.role}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-2 border-b border-border bg-white px-3 py-2.5">
                <button
                  onClick={() => setActive(null)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="relative">
                  <UserAvatar name={active.name} className="h-8 w-8" />
                  {active.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{active.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[active.role as Role] ?? active.role} · {active.online ? "online" : "offline"}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Messages */}
              <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
                {msgsLoading ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Say hi to {active.name.split(" ")[0]} 👋
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.authorId === me.id;
                    const canDelete = mine || isAdmin;
                    return (
                      <div key={m.id} className={cn("group flex gap-2", mine && "flex-row-reverse")}>
                        <div className={cn("max-w-[80%]", mine && "flex flex-col items-end")}>
                          <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>{timeAgo(m.createdAt)}</span>
                            {canDelete && (
                              <button
                                onClick={() => del(m.id)}
                                className="ml-0.5 rounded p-0.5 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                                aria-label="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {m.body && (
                            <div
                              className={cn(
                                "inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm",
                                mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                              )}
                            >
                              <Linkify text={m.body} />
                            </div>
                          )}
                          {m.file && (
                            <a
                              href={`/api/uploads/${m.file.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "mt-1 inline-flex max-w-full items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium",
                                mine
                                  ? "border-primary-200 bg-primary-50 text-primary-700"
                                  : "border-border bg-white text-foreground"
                              )}
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{m.file.name}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              {/* Composer */}
              <div className="border-t border-border p-2.5">
                {pendingFile && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{pendingFile.name}</span>
                    </span>
                    <button
                      onClick={() => setPendingFile(null)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                    aria-label="Attach file"
                    title="Attach a file (max 1 MB)"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
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
                    placeholder={`Message ${active.name.split(" ")[0]}…`}
                    className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                  />
                  <button
                    onClick={send}
                    disabled={sending || (!text.trim() && !pendingFile)}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition disabled:opacity-50"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={attach} />
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="brand-gradient fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-elevated transition hover:scale-105"
        aria-label="Messages"
      >
        {open ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>
    </>
  );
}
