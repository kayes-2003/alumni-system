import { useRef } from "react";
import { Send, Loader2, Check, CheckCheck, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string; sender_id: string; receiver_id: string;
  content: string; is_read: boolean; created_at: string;
}

interface Conversation {
  partner_id: string; partner_name: string; partner_avatar: string | null; partner_role: string;
}

interface ChatWindowProps {
  activePartner: Conversation | null;
  messages: Message[];
  newMsg: string;
  sending: boolean;
  userId: string;
  onMsgChange: (v: string) => void;
  onSend: () => void;
}

export function ChatWindow({ activePartner, messages, newMsg, sending, userId, onMsgChange, onSend }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  if (!activePartner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <MessageSquare className="h-16 w-16 text-muted-foreground/10 mx-auto" />
          <p className="text-lg font-semibold text-muted-foreground">Select a conversation</p>
          <p className="text-sm text-muted-foreground">or search for someone to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Link to={`/profile/${activePartner.partner_id}`}>
          <Avatar src={activePartner.partner_avatar} fallback={activePartner.partner_name} size="md" />
        </Link>
        <div>
          <Link
            to={`/profile/${activePartner.partner_id}`}
            className="font-semibold text-sm hover:text-primary transition-colors"
          >
            {activePartner.partner_name}
          </Link>
          <p className="text-xs text-muted-foreground capitalize">{activePartner.partner_role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No messages yet. Say hello! 👋
          </div>
        )}
        {messages.map((m, idx) => {
          const isMe = m.sender_id === userId;
          const isLast = idx === messages.length - 1;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
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
        <Textarea
          value={newMsg}
          onChange={e => onMsgChange(e.target.value)}
          placeholder={`Message ${activePartner.partner_name}…`}
          className="min-h-[42px] max-h-32 resize-none text-sm flex-1"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={sending || !newMsg.trim()}
          className="h-10 w-10 shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}