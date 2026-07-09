import { Loader2, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Conversation {
  partner_id: string; partner_name: string; partner_avatar: string | null;
  partner_role: string; last_message: string; last_time: string; unread: number;
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

interface ConversationListProps {
  conversations: Conversation[];
  activePartnerId: string | null;
  loading: boolean;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({ conversations, activePartnerId, loading, onSelect }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Users className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-sm text-muted-foreground">No conversations yet.</p>
        <p className="text-xs text-muted-foreground">Search for someone above to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(c => (
        <button
          key={c.partner_id}
          onClick={() => onSelect(c)}
          className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-muted transition-colors text-left border-b last:border-b-0 ${
            activePartnerId === c.partner_id ? "bg-primary/5 border-l-2 border-l-primary" : ""
          }`}
        >
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
              <p className={`text-sm truncate ${c.unread > 0 ? "font-bold" : "font-medium"}`}>
                {c.partner_name}
              </p>
              <p className="text-[10px] text-muted-foreground shrink-0 ml-1">
                {timeAgo(c.last_time)}
              </p>
            </div>
            <p className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {c.last_message || "Start a conversation…"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}