import { Heart, MessageSquare, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(dateStr).toLocaleDateString();
}

interface PostCardProps {
  post: {
    id: string; author_id: string; content: string; image_url: string | null;
    likes_count: number; created_at: string; _liked?: boolean;
    _comment_count?: number; _show_comments?: boolean;
    profiles?: { full_name: string; avatar_url: string | null; role: string; current_job_title: string | null } | null;
  };
  user: any;
  isAdmin: boolean;
  onLike: () => void;
  onDelete: () => void;
  onToggleComments: () => void;
  children?: React.ReactNode; // comments section
}

export function PostCard({ post, user, isAdmin, onLike, onDelete, onToggleComments, children }: PostCardProps) {
  return (
    <Card className="group">
      <CardContent className="p-4">
        {/* Author */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author_id}`}>
              <Avatar
                src={post.profiles?.avatar_url ?? null}
                fallback={post.profiles?.full_name ?? "?"}
                size="md"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${post.author_id}`}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {post.profiles?.full_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.profiles?.current_job_title ?? post.profiles?.role} · {timeAgo(post.created_at)}
              </p>
            </div>
          </div>
          {(post.author_id === user?.id || isAdmin) && (
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-xl w-full object-cover max-h-96 mb-3" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${post._liked ? "text-red-500" : ""}`}
          >
            <Heart className={`h-4 w-4 ${post._liked ? "fill-current" : ""}`} />
            <span>{post.likes_count}</span>
          </button>
          <button
            onClick={onToggleComments}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post._comment_count ?? 0} Comments</span>
          </button>
        </div>

        {/* Comments injected as children */}
        {post._show_comments && children}
      </CardContent>
    </Card>
  );
}