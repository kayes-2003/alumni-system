import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Send, Search, Loader2, Bell, BellOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message { id:string; sender_id:string; receiver_id:string; content:string; is_read:boolean; created_at:string; }
interface Conversation { partner_id:string; partner_name:string; partner_avatar:string|null; last_message:string; last_time:string; unread:number; }
interface Notification { id:string; title:string; message:string; link:string|null; is_read:boolean; created_at:string; }

export default function MessagingPage() {
  const {user}=useAuth();
  const [tab,setTab]=useState<"messages"|"notifications">("messages");
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [activePartner,setActivePartner]=useState<Conversation|null>(null);
  const [newMsg,setNewMsg]=useState("");
  const [notifications,setNotifications]=useState<Notification[]>([]);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [searchUser,setSearchUser]=useState("");
  const [searchResults,setSearchResults]=useState<{id:string;full_name:string;avatar_url:string|null}[]>([]);
  const bottomRef=useRef<HTMLDivElement>(null);

  const fetchConversations=useCallback(async()=>{
    if(!user)return;
    const {data:msgs}=await (supabase.from("messages") as any)
      .select("*,sender:sender_id(full_name,avatar_url),receiver:receiver_id(full_name,avatar_url)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at",{ascending:false});
    if(!msgs){setLoading(false);return;}
    const convMap:Record<string,Conversation>={};
    msgs.forEach((m:any)=>{
      const isMe=m.sender_id===user.id;
      const partnerId=isMe?m.receiver_id:m.sender_id;
      const partner=isMe?m.receiver:m.sender;
      if(!convMap[partnerId]) convMap[partnerId]={partner_id:partnerId,partner_name:partner?.full_name??"Unknown",partner_avatar:partner?.avatar_url??null,last_message:m.content,last_time:m.created_at,unread:0};
      if(!isMe&&!m.is_read) convMap[partnerId].unread++;
    });
    setConversations(Object.values(convMap));
    setLoading(false);
  },[user]);

  const fetchNotifications=useCallback(async()=>{
    if(!user)return;
    const {data}=await (supabase.from("notifications") as any).select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
    setNotifications(data??[]);
  },[user]);

  useEffect(()=>{fetchConversations();fetchNotifications();},[fetchConversations,fetchNotifications]);

  useEffect(()=>{
    if(!user)return;
    const channel=supabase.channel("messages_"+user.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`receiver_id=eq.${user.id}`},()=>{fetchConversations();if(activePartner)fetchMessages(activePartner.partner_id);})
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},()=>fetchNotifications())
      .subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[user,activePartner,fetchConversations,fetchNotifications]);

  const fetchMessages=async(partnerId:string)=>{
    if(!user)return;
    const {data}=await (supabase.from("messages") as any).select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order("created_at");
    setMessages(data??[]);
    await (supabase.from("messages") as any).update({is_read:true}).eq("receiver_id",user.id).eq("sender_id",partnerId);
    setConversations(p=>p.map(c=>c.partner_id===partnerId?{...c,unread:0}:c));
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  const openConversation=async(conv:Conversation)=>{setActivePartner(conv);await fetchMessages(conv.partner_id);};

  const sendMessage=async()=>{
    if(!newMsg.trim()||!user||!activePartner)return;
    setSending(true);
    await (supabase.from("messages") as any).insert({sender_id:user.id,receiver_id:activePartner.partner_id,content:newMsg});
    setNewMsg(""); setSending(false); fetchMessages(activePartner.partner_id); fetchConversations();
  };

  const searchUsers=async(q:string)=>{
    setSearchUser(q);
    if(q.length<2){setSearchResults([]);return;}
    const {data}=await (supabase.from("profiles") as any).select("id,full_name,avatar_url").ilike("full_name",`%${q}%`).neq("id",user?.id).limit(5);
    setSearchResults(data??[]);
  };

  const startConv=(p:{id:string;full_name:string;avatar_url:string|null})=>{
    const exists=conversations.find(c=>c.partner_id===p.id);
    if(exists){openConversation(exists);}
    else {
      const newConv:Conversation={partner_id:p.id,partner_name:p.full_name,partner_avatar:p.avatar_url,last_message:"",last_time:new Date().toISOString(),unread:0};
      setConversations(prev=>[newConv,...prev]);
      openConversation(newConv);
    }
    setSearchUser(""); setSearchResults([]);
  };

  const markAllRead=async()=>{
    if(!user)return;
    await (supabase.from("notifications") as any).update({is_read:true}).eq("user_id",user.id).eq("is_read",false);
    fetchNotifications();
  };

  const unreadNotifs=notifications.filter(n=>!n.is_read).length;

  if(!user) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Please log in to access messages.</div>;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Inbox</h1>
            <div className="flex gap-1 border rounded-lg overflow-hidden">
              <button onClick={()=>setTab("messages")} className={`px-3 py-1.5 text-sm transition-colors ${tab==="messages"?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>Messages</button>
              <button onClick={()=>setTab("notifications")} className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${tab==="notifications"?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>
                <Bell className="h-3.5 w-3.5"/>Notifications{unreadNotifs>0&&<Badge className="h-4 min-w-4 text-xs px-1">{unreadNotifs}</Badge>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {tab==="messages"&&(
        <div className="container py-0 h-[calc(100vh-120px)] flex">
          {/* Sidebar */}
          <div className="w-72 border-r bg-background flex flex-col shrink-0">
            <div className="p-3 border-b relative">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><Input className="pl-8 h-8 text-sm" placeholder="New conversation…" value={searchUser} onChange={e=>searchUsers(e.target.value)}/></div>
              {searchResults.length>0&&(
                <div className="absolute z-10 left-3 right-3 top-14 bg-card border rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map(p=>(
                    <button key={p.id} onClick={()=>startConv(p)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm">
                      <Avatar src={p.avatar_url} fallback={p.full_name} size="sm"/>{p.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading?<div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>:conversations.length===0?<p className="text-center py-8 text-sm text-muted-foreground">No conversations yet.</p>:
                conversations.map(c=>(
                  <button key={c.partner_id} onClick={()=>openConversation(c)} className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-muted transition-colors text-left border-b ${activePartner?.partner_id===c.partner_id?"bg-primary/5":""}`}>
                    <div className="relative"><Avatar src={c.partner_avatar} fallback={c.partner_name} size="md"/>{c.unread>0&&<div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">{c.unread}</div>}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${c.unread>0?"font-semibold":""}`}>{c.partner_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-background">
            {!activePartner?<div className="flex-1 flex items-center justify-center text-muted-foreground"><div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>Select a conversation</p></div></div>:(
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <Avatar src={activePartner.partner_avatar} fallback={activePartner.partner_name} size="md"/>
                  <p className="font-semibold text-sm">{activePartner.partner_name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m=>{
                    const isMe=m.sender_id===user.id;
                    return (
                      <div key={m.id} className={`flex ${isMe?"justify-end":""}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm ${isMe?"bg-primary text-primary-foreground rounded-br-sm":"bg-muted rounded-bl-sm"}`}>
                          <p>{m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe?"text-primary-foreground/60":"text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef}/>
                </div>
                <div className="border-t p-3 flex gap-2">
                  <Textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Type a message…" className="min-h-[40px] max-h-24 resize-none text-sm" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}/>
                  <Button size="icon" onClick={sendMessage} disabled={sending||!newMsg.trim()} className="self-end shrink-0">{sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab==="notifications"&&(
        <div className="container py-6 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{unreadNotifs} unread</p>
            {unreadNotifs>0&&<Button size="sm" variant="outline" onClick={markAllRead}><BellOff className="h-3.5 w-3.5 mr-1.5"/>Mark all read</Button>}
          </div>
          <div className="space-y-2">
            {notifications.length===0?<p className="text-center py-16 text-muted-foreground">No notifications yet.</p>:
              notifications.map(n=>(
                <div key={n.id} className={`p-4 rounded-xl border cursor-pointer transition-colors hover:bg-muted/50 ${!n.is_read?"bg-primary/5 border-primary/20":""}`}>
                  <div className="flex items-start gap-3">
                    {!n.is_read&&<div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
