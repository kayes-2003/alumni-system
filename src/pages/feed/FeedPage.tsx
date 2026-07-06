import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageSquare, Send, Trash2, Loader2, Users,
  Image as ImageIcon, X, TrendingUp, Hash, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Post {
  id: string; author_id: string; content: string; image_url: string | null;
  likes_count: number; created_at: string;
  profiles?: { full_name: string; avatar_url: string | null; role: string; current_job_title: string | null } | null;
  _liked?: boolean; _comments?: Comment[]; _show_comments?: boolean;
  _comment_count?: number;
}
interface Comment {
  id: string; post_id: string; author_id: string; content: string; created_at: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CommentSection({ postId, comments, onAdd, onDelete, currentUserId, isAdmin }: {
  postId: string; comments: Comment[]; onAdd: (c: Comment) => void;
  onDelete: (id: string) => void; currentUserId: string | undefined; isAdmin: boolean;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() || !currentUserId) return;
    setSaving(true);
    const { data, error } = await (supabase.from("comments") as any)
      .insert({ post_id: postId, author_id: currentUserId, content: text })
      .select("*, profiles(full_name, avatar_url)").single();
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
            <button onClick={() => onDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all self-start mt-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {currentUserId && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Write a comment…"
              className="min-h-[38px] max-h-24 text-sm py-2 resize-none"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
          </div>
          <Button size="icon" variant="ghost" onClick={submit} disabled={saving || !text.trim()} className="h-9 w-9 shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, user, isAdmin, onLike, onDelete, onToggleComments, onAddComment, onDeleteComment }: {
  post: Post; user: any; isAdmin: boolean;
  onLike: (p: Post) => void; onDelete: (id: string) => void;
  onToggleComments: (p: Post) => void;
  onAddComment: (postId: string, c: Comment) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}) {
  return (
    <Card className="group">
      <CardContent className="p-4">
        {/* Author */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author_id}`}>
              <Avatar src={post.profiles?.avatar_url ?? null} fallback={post.profiles?.full_name ?? "?"} size="md" />
            </Link>
            <div>
              <Link to={`/profile/${post.author_id}`} className="text-sm font-semibold hover:text-primary transition-colors">
                {post.profiles?.full_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.profiles?.current_job_title ?? post.profiles?.role} · {timeAgo(post.created_at)}
              </p>
            </div>
          </div>
          {(post.author_id === user?.id || isAdmin) && (
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={() => onDelete(post.id)}>
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
          <button onClick={() => onLike(post)}
            className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${post._liked ? "text-red-500" : ""}`}>
            <Heart className={`h-4 w-4 ${post._liked ? "fill-current" : ""}`} />
            <span>{post.likes_count}</span>
          </button>
          <button onClick={() => onToggleComments(post)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>{post._comment_count ?? 0} Comments</span>
          </button>
        </div>

        {/* Comments */}
        {post._show_comments && (
          <CommentSection
            postId={post.id}
            comments={post._comments ?? []}
            onAdd={c => onAddComment(post.id, c)}
            onDelete={id => onDeleteComment(post.id, id)}
            currentUserId={user?.id}
            isAdmin={isAdmin}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { toasts, toast, dismiss } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("posts") as any)
      .select("*, profiles(full_name, avatar_url, role, current_job_title)")
      .not("department_id", "eq", "00000000-0000-0000-0000-000000000001") // exclude testimonials
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    // Get comment counts
    const ids = data.map((p: Post) => p.id);
    const [{ data: likes }, { data: commentCounts }] = await Promise.all([
      user ? (supabase.from("post_likes") as any).select("post_id").in("post_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] }),
      (supabase.from("comments") as any).select("post_id").in("post_id", ids),
    ]);

    const likedSet = new Set((likes ?? []).map((l: any) => l.post_id));
    const commentCountMap: Record<string, number> = {};
    (commentCounts ?? []).forEach((c: any) => { commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1; });

    setPosts(data.map((p: Post) => ({
      ...p,
      _liked: likedSet.has(p.id),
      _comments: [],
      _show_comments: false,
      _comment_count: commentCountMap[p.id] ?? 0,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase.channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const uploadImage = async (file: File) => {
    setUploadingImg(true);
    const path = `feed/${user?.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setShowImageInput(true);
    }
    setUploadingImg(false);
  };

  const createPost = async () => {
    if (!newContent.trim() || !user) return;
    setPosting(true);
    const { error } = await (supabase.from("posts") as any).insert({
      author_id: user.id,
      content: newContent,
      image_url: imageUrl || null,
    });
    setPosting(false);
    if (error) { toast(error.message, "error"); return; }
    setNewContent("");
    setImageUrl("");
    setShowImageInput(false);
    toast("Post shared!", "success");
    fetchPosts();
  };

  const toggleLike = async (post: Post) => {
    if (!user) { toast("Please log in to like posts", "error"); return; }
    if (post._liked) {
      await (supabase.from("post_likes") as any).delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await (supabase.from("post_likes") as any).insert({ post_id: post.id, user_id: user.id });
    }
    setPosts(p => p.map(pp => pp.id === post.id
      ? { ...pp, _liked: !pp._liked, likes_count: pp.likes_count + (pp._liked ? -1 : 1) }
      : pp));
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await (supabase.from("posts") as any).delete().eq("id", id);
    setPosts(p => p.filter(pp => pp.id !== id));
    toast("Post deleted", "success");
  };

  const toggleComments = async (post: Post) => {
    if (!post._show_comments && (post._comments?.length === 0)) {
      const { data } = await (supabase.from("comments") as any)
        .select("*, profiles(full_name, avatar_url)")
        .eq("post_id", post.id).order("created_at");
      setPosts(p => p.map(pp => pp.id === post.id ? { ...pp, _comments: data ?? [], _show_comments: true } : pp));
    } else {
      setPosts(p => p.map(pp => pp.id === post.id ? { ...pp, _show_comments: !pp._show_comments } : pp));
    }
  };

  const addComment = (postId: string, comment: Comment) => {
    setPosts(p => p.map(pp => pp.id === postId
      ? { ...pp, _comments: [...(pp._comments ?? []), comment], _comment_count: (pp._comment_count ?? 0) + 1 }
      : pp));
  };

  const deleteComment = async (postId: string, commentId: string) => {
    await (supabase.from("comments") as any).delete().eq("id", commentId);
    setPosts(p => p.map(pp => pp.id === postId
      ? { ...pp, _comments: (pp._comments ?? []).filter(c => c.id !== commentId), _comment_count: Math.max(0, (pp._comment_count ?? 1) - 1) }
      : pp));
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="border-b bg-background">
        <div className="container py-5">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />Community Feed
            {isAdmin && <Badge variant="info">Admin</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Share updates, achievements, and stay connected.</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 max-w-5xl mx-auto">
          {/* Main feed */}
          <div className="space-y-4">
            {/* Compose box */}
            {user && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? "?"} size="md" className="shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder={`What's on your mind, ${profile?.full_name?.split(" ")[0]}?`}
                        className="min-h-[90px] resize-none border-none shadow-none bg-muted/30 focus-visible:ring-0 text-sm"
                        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) createPost(); }}
                      />
                      {showImageInput && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                              placeholder="Image URL…" className="w-full text-sm border rounded-md px-3 py-1.5 bg-background" />
                          </div>
                          <button onClick={() => { setImageUrl(""); setShowImageInput(false); }} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {imageUrl && <img src={imageUrl} alt="" className="rounded-lg max-h-48 object-cover w-full" />}
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex gap-2">
                          <button onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted">
                            {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                            Photo
                          </button>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                        </div>
                        <Button size="sm" onClick={createPost} disabled={posting || !newContent.trim()}>
                          {posting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            {loading ? (
              <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />)}</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <Users className="h-14 w-14 text-muted-foreground/20 mx-auto" />
                <p className="text-xl font-semibold">No posts yet</p>
                <p className="text-sm text-muted-foreground">{user ? "Be the first to share something!" : "Log in to join the conversation."}</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-4">
                  {posts.map((post, idx) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                      <PostCard post={post} user={user} isAdmin={isAdmin}
                        onLike={toggleLike} onDelete={deletePost}
                        onToggleComments={toggleComments}
                        onAddComment={addComment} onDeleteComment={deleteComment} />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />Trending Topics
                </h3>
                <div className="space-y-2">
                  {["#TechCareers","#Startups","#BatchReunion","#Mentorship","#StudyAbroad","#JobSearch"].map(tag => (
                    <div key={tag} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      <Hash className="h-3.5 w-3.5" />{tag.slice(1)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Quick Links
                </h3>
                <div className="space-y-2">
                  {[
                    { to: "/alumni", label: "Alumni Directory" },
                    { to: "/mentorship", label: "Find a Mentor" },
                    { to: "/careers", label: "Browse Jobs" },
                    { to: "/events", label: "Upcoming Events" },
                    { to: "/messages", label: "Direct Messages" },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="h-3.5 w-3.5" />{label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-center space-y-3">
                  <p className="text-sm font-semibold">Join the conversation</p>
                  <p className="text-xs text-muted-foreground">Sign in to post, like, and comment.</p>
                  <div className="flex gap-2">
                    <Link to="/login" className="flex-1"><Button size="sm" variant="outline" className="w-full">Log In</Button></Link>
                    <Link to="/register" className="flex-1"><Button size="sm" className="w-full">Sign Up</Button></Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}