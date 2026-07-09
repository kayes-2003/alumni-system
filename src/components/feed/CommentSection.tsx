import { useState } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: string; post_id: string; author_id: string; content: string; created_at: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId: string | undefined;
  isAdmin: boolean;
  onAdd: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
}

export function CommentSection({ postId, comments, currentUserId, isAdmin, onAdd, onDelete }: CommentSectionProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() || !currentUserId) return;
    setSaving(true);
    const { data, error } = await (supabase.from("comments") as any)
      .insert({ post_id: postId, author_id: currentUserId, content: text })
      .select("*, profiles(full_name, avatar_url)")
      .single();
    setSaving(false);
    if (!error && data) { onAdd(data); setText(""); }
  };

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 group">
          <Link to={`/profile/${c.author_id}`}>
            <Avatar src={c.profiles?.avatar_url ?? null} fallback={c.profiles?.full_name ?? "?"} size="sm" className="shrink-0 mt-0.5" />
          </Link>
          <div className="flex-1 bg-muted/50 rounded-2xl px-3 py-2">
            <p className="text-xs font-semibold">{c.profiles?.full_name}</p>
            <p className="text-sm leading-relaxed">{c.content}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(c.created_at)}</p>
          </div>
          {(c.author_id === currentUserId || isAdmin) && (
            <button
              onClick={() => onDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all self-start mt-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {currentUserId && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write a comment…"
              className="min-h-[38px] max-h-24 text-sm py-2 resize-none"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            />
          </div>
          <Button size="icon" variant="ghost" onClick={submit} disabled={saving || !text.trim()} className="h-9 w-9 shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}