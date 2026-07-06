import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare, Send, Search, Loader2, Bell, BellOff,
  CheckCheck, Check, Users, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Message {
  id: string; sender_id: string; receiver_id: string;
  content: string; is_read: boolean; created_at: string;
}
interface Conversation {
  partner_id: string; partner_name: string; partner_avatar: string | null;
  partner_role: string; last_message: string; last_time: string; unread: number;
}
interface Notification {
  id: string; title: string; message: string; link: string | null;
  is_read: boolean; created_at: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString();
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"messages" | "notifications">("messages");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activePartner, setActivePartner] = useState<Conversation | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; avatar_url: string | null; role: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await (supabase.from("messages") as any)
      .select("*, sender:sender_id(full_name, avatar_url, role), receiver:receiver_id(full_name, avatar_url, role)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!msgs) { setLoading(false); return; }

    const convMap: Record<string, Conversation> = {};
    msgs.forEach((m: any) => {
      const isMe = m.sender_id === user.id;
      const partnerId = isMe ? m.receiver_id : m.sender_id;
      const partner = isMe ? m.receiver : m.sender;
      if (!convMap[partnerId]) {
        convMap[partnerId] = {
          partner_id: partnerId,
          partner_name: partner?.full_name ?? "Unknown",
          partner_avatar: partner?.avatar_url ?? null,
          partner_role: partner?.role ?? "student",
          last_message: m.content,
          last_time: m.created_at,
          unread: 0,
        };
      }
      if (!isMe && !m.is_read) convMap[partnerId].unread++;
    });
    setConversations(Object.values(convMap));
    setLoading(false);
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("notifications") as any)
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(100);
    setNotifications(data ?? []);
  }, [user]);

  useEffect(() => { fetchConversations(); fetchNotifications(); }, [fetchConversations, fetchNotifications]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => { fetchConversations(); if (activePartner) fetchMessages(activePartner.partner_id); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activePartner, fetchConversations, fetchNotifications]);

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await (supabase.from("messages") as any).select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order("created_at");
    setMessages(data ?? []);
    // Mark as read
    await (supabase.from("messages") as any)
      .update({ is_read: true }).eq("receiver_id", user.id).eq("sender_id", partnerId);
    setConversations(p => p.map(c => c.partner_id === partnerId ? { ...c, unread: 0 } : c));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const openConversation = async (conv: Conversation) => {
    setActivePartner(conv);
    await fetchMessages(conv.partner_id);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !activePartner) return;
    setSending(true);
    await (supabase.from("messages") as any).insert({
      sender_id: user.id, receiver_id: activePartner.partner_id, content: newMsg,
    });
    setNewMsg("");
    setSending(false);
    fetchMessages(activePartner.partner_id);
    fetchConversations();
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select("id, full_name, avatar_url, role")
      .ilike("full_name", `%${q}%`)
      .neq("id", user?.id).limit(8);
    setSearchResults(data ?? []);
    setSearchLoading(false);
  };

  const startConversation = (p: { id: string; full_name: string; avatar_url: string | null; role: string }) => {
    const existing = conversations.find(c => c.partner_id === p.id);
    const conv: Conversation = existing ?? {
      partner_id: p.id, partner_name: p.full_name,
      partner_avatar: p.avatar_url, partner_role: p.role,
      last_message: "", last_time: new Date().toISOString(), unread: 0,
    };
    if (!existing) setConversations(prev => [conv, ...prev]);
    openConversation(conv);
    setSearchQuery(""); setSearchResults([]);
  };

  const markAllRead = async () => {
    if (!user) return;
    await (supabase.from("notifications") as any)
      .update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await (supabase.from("notifications") as any).delete().eq("id", id);
    setNotifications(p => p.filter(n => n.id !== id));
  };

  const unreadNotifs = notifications.filter(n => !n.is_read).length;
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <MessageSquare className="h-14 w-14 text-muted-foreground/20 mx-auto" />
        <p className="font-semibold">Please log in to access messages</p>
        <Link to="/login"><Button>Log In</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />Inbox
            </h1>
            <div className="flex gap-1 border rounded-lg overflow-hidden bg-background">
              <button onClick={() => setTab("messages")}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${tab === "messages" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <MessageSquare className="h-3.5 w-3.5" />Messages
                {totalUnread > 0 && <Badge className="h-4 min-w-4 text-[10px] px-1">{totalUnread}</Badge>}
              </button>
              <button onClick={() => setTab("notifications")}
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${tab === "notifications" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Bell className="h-3.5 w-3.5" />Notifications
                {unreadNotifs > 0 && <Badge className="h-4 min-w-4 text-[10px] px-1">{unreadNotifs}</Badge>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {tab === "messages" && (
        <div className="flex h-[calc(100vh-130px)]">
          {/* Sidebar */}
          <div className="w-80 border-r bg-background flex flex-col shrink-0">
            {/* Search / New conversation */}
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 h-8 text-sm" placeholder="Search people…"
                  value={searchQuery} onChange={e => searchUsers(e.target.value)} />
              </div>
              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="border rounded-xl bg-card shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {searchLoading && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => startConversation(p)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                      <Avatar src={p.avatar_url} fallback={p.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  <p className="text-xs text-muted-foreground">Search for someone above to start chatting.</p>
                </div>
              ) : (
                conversations.map(c => (
                  <button key={c.partner_id} onClick={() => openConversation(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-muted transition-colors text-left border-b last:border-b-0 ${activePartner?.partner_id === c.partner_id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <div className="relative">
                      <Avatar src={c.partner_avatar} fallback={c.partner_name} size="md" />
                      {c.unread > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                          {c.unread > 9 ? "9+" : c.unread}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${c.unread > 0 ? "font-bold" : "font-medium"}`}>{c.partner_name}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0 ml-1">{timeAgo(c.last_time)}</p>
                      </div>
                      <p className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {c.last_message || "Start a conversation…"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-background">
            {!activePartner ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-16 w-16 text-muted-foreground/10 mx-auto" />
                  <p className="text-lg font-semibold text-muted-foreground">Select a conversation</p>
                  <p className="text-sm text-muted-foreground">or search for someone to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <Link to={`/profile/${activePartner.partner_id}`}>
                    <Avatar src={activePartner.partner_avatar} fallback={activePartner.partner_name} size="md" />
                  </Link>
                  <div>
                    <Link to={`/profile/${activePartner.partner_id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                      {activePartner.partner_name}
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">{activePartner.partner_role}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m, idx) => {
                    const isMe = m.sender_id === user.id;
                    const isLast = idx === messages.length - 1;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"}`}>
                            <p className="leading-relaxed">{m.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {isMe && isLast && (
                              m.is_read
                                ? <CheckCheck className="h-3 w-3 text-primary" />
                                : <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3 flex gap-2 items-end">
                  <Textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    placeholder={`Message ${activePartner.partner_name}…`}
                    className="min-h-[42px] max-h-32 resize-none text-sm flex-1"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !newMsg.trim()} className="h-10 w-10 shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <div className="container py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">{unreadNotifs} unread · {notifications.length} total</p>
            {unreadNotifs > 0 && (
              <Button size="sm" variant="outline" onClick={markAllRead}>
                <BellOff className="h-3.5 w-3.5 mr-1.5" />Mark all read
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <Bell className="h-14 w-14 text-muted-foreground/20 mx-auto" />
                <p className="font-semibold text-muted-foreground">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-xl border transition-colors hover:bg-muted/30 ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    {n.link && <Link to={n.link} className="text-xs text-primary hover:underline mt-1 inline-block">View →</Link>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteNotification(n.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Plus className="h-4 w-4 rotate-45" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}