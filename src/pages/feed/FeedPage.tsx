import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, Send, Trash2, Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Post { id:string; author_id:string; content:string; image_url:string|null; likes_count:number; created_at:string; profiles?:{full_name:string;avatar_url:string|null;role:string}|null; _liked?:boolean; _comments?:Comment[]; _show_comments?:boolean; }
interface Comment { id:string; post_id:string; author_id:string; content:string; created_at:string; profiles?:{full_name:string;avatar_url:string|null}|null; }

function CommentSection({postId,comments,onAdd,onDelete,currentUserId,isAdmin}:{postId:string;comments:Comment[];onAdd:(c:Comment)=>void;onDelete:(id:string)=>void;currentUserId:string|undefined;isAdmin:boolean;}) {
  const [text,setText]=useState(""); const [saving,setSaving]=useState(false);
  const submit=async()=>{
    if(!text.trim()||!currentUserId)return; setSaving(true);
    const {data,error}=await (supabase.from("comments") as any).insert({post_id:postId,author_id:currentUserId,content:text}).select("*,profiles(full_name,avatar_url)").single();
    setSaving(false); if(!error&&data){onAdd(data);setText("");}
  };
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {comments.map(c=>(
        <div key={c.id} className="flex gap-2">
          <Avatar src={c.profiles?.avatar_url??null} fallback={c.profiles?.full_name??"?"} size="sm" className="shrink-0 mt-0.5"/>
          <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
            <p className="text-xs font-semibold">{c.profiles?.full_name}</p>
            <p className="text-sm">{c.content}</p>
          </div>
          {(c.author_id===currentUserId||isAdmin)&&(
            <button onClick={()=>onDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors self-start mt-1"><Trash2 className="h-3.5 w-3.5"/></button>
          )}
        </div>
      ))}
      {currentUserId&&(
        <div className="flex gap-2">
          <div className="flex-1"><Textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write a comment…" className="min-h-[40px] text-sm py-1.5" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} /></div>
          <Button size="icon" variant="ghost" onClick={submit} disabled={saving||!text.trim()} className="self-end h-9 w-9">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}</Button>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const {user,profile}=useAuth();
  const isAdmin=profile?.role==="admin";
  const {toasts,toast,dismiss}=useToast();
  const [posts,setPosts]=useState<Post[]>([]);
  const [loading,setLoading]=useState(true);
  const [newContent,setNewContent]=useState("");
  const [posting,setPosting]=useState(false);

  const fetchPosts=useCallback(async()=>{
    setLoading(true);
    const {data}=await (supabase.from("posts") as any).select("*,profiles(full_name,avatar_url,role)").order("created_at",{ascending:false}).limit(30);
    if(!data){setLoading(false);return;}
    if(user){
      const ids=data.map((p:Post)=>p.id);
      const {data:likes}=await (supabase.from("post_likes") as any).select("post_id").in("post_id",ids).eq("user_id",user.id);
      const likedSet=new Set((likes??[]).map((l:any)=>l.post_id));
      setPosts(data.map((p:Post)=>({...p,_liked:likedSet.has(p.id),_comments:[],_show_comments:false})));
    } else setPosts(data.map((p:Post)=>({...p,_liked:false,_comments:[],_show_comments:false})));
    setLoading(false);
  },[user]);

  useEffect(()=>{fetchPosts();},[fetchPosts]);

  // Realtime subscription
  useEffect(()=>{
    const channel=supabase.channel("feed").on("postgres_changes",{event:"INSERT",schema:"public",table:"posts"},()=>fetchPosts()).subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[fetchPosts]);

  const createPost=async()=>{
    if(!newContent.trim()||!user)return;
    setPosting(true);
    await (supabase.from("posts") as any).insert({author_id:user.id,content:newContent});
    setNewContent(""); setPosting(false); fetchPosts();
    toast("Post shared!","success");
  };

  const toggleLike=async(post:Post)=>{
    if(!user){toast("Please log in","error");return;}
    if(post._liked){
      await (supabase.from("post_likes") as any).delete().eq("post_id",post.id).eq("user_id",user.id);
    } else {
      await (supabase.from("post_likes") as any).insert({post_id:post.id,user_id:user.id});
    }
    setPosts(p=>p.map(pp=>pp.id===post.id?{...pp,_liked:!pp._liked,likes_count:pp.likes_count+(pp._liked?-1:1)}:pp));
  };

  const deletePost=async(id:string)=>{
    if(!confirm("Delete this post?"))return;
    await (supabase.from("posts") as any).delete().eq("id",id);
    setPosts(p=>p.filter(pp=>pp.id!==id));
    toast("Post deleted","success");
  };

  const toggleComments=async(post:Post)=>{
    if(!post._show_comments&&post._comments?.length===0){
      const {data}=await (supabase.from("comments") as any).select("*,profiles(full_name,avatar_url)").eq("post_id",post.id).order("created_at");
      setPosts(p=>p.map(pp=>pp.id===post.id?{...pp,_comments:data??[],_show_comments:true}:pp));
    } else {
      setPosts(p=>p.map(pp=>pp.id===post.id?{...pp,_show_comments:!pp._show_comments}:pp));
    }
  };

  const addComment=(postId:string,comment:Comment)=>setPosts(p=>p.map(pp=>pp.id===postId?{...pp,_comments:[...(pp._comments??[]),comment]}:pp));
  const deleteComment=async(postId:string,commentId:string)=>{
    await (supabase.from("comments") as any).delete().eq("id",commentId);
    setPosts(p=>p.map(pp=>pp.id===postId?{...pp,_comments:(pp._comments??[]).filter(c=>c.id!==commentId)}:pp));
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss}/>
      <div className="border-b bg-background">
        <div className="container py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Community Feed{isAdmin&&<Badge variant="info">Admin</Badge>}</h1>
          <p className="text-sm text-muted-foreground mt-1">Share updates, thoughts, and stay connected.</p>
        </div>
      </div>
      <div className="container py-8 max-w-2xl">
        {user&&(
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar src={profile?.avatar_url??null} fallback={profile?.full_name??"?"} size="md" className="shrink-0"/>
                <div className="flex-1 space-y-3">
                  <Textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder={`What's on your mind, ${profile?.full_name?.split(" ")[0]}?`} className="min-h-[80px] resize-none border-none shadow-none bg-transparent p-0 focus-visible:ring-0 text-sm" onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)createPost();}}/>
                  <div className="flex justify-end border-t pt-3">
                    <Button size="sm" onClick={createPost} disabled={posting||!newContent.trim()}>
                      {posting?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<Send className="h-4 w-4 mr-2"/>}Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {loading?<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>:posts.length===0?<div className="text-center py-20 text-muted-foreground">No posts yet. Be the first to share!</div>:(
          <AnimatePresence>
            <div className="space-y-4">
              {posts.map((post,idx)=>(
                <motion.div key={post.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*0.03}} className="group">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${post.author_id}`}>
                            <Avatar src={post.profiles?.avatar_url??null} fallback={post.profiles?.full_name??"?"} size="md"/>
                          </Link>
                          <div>
                            <Link to={`/profile/${post.author_id}`} className="text-sm font-semibold hover:underline">{post.profiles?.full_name}</Link>
                            <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                          </div>
                        </div>
                        {(post.author_id===user?.id||isAdmin)&&(
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={()=>deletePost(post.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
                      {post.image_url&&<img src={post.image_url} alt="" className="rounded-lg w-full object-cover max-h-80 mb-3"/>}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                        <button onClick={()=>toggleLike(post)} className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${post._liked?"text-red-500":""}`}>
                          <Heart className={`h-4 w-4 ${post._liked?"fill-current":""}`}/>{post.likes_count}
                        </button>
                        <button onClick={()=>toggleComments(post)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          <MessageSquare className="h-4 w-4"/>Comments
                        </button>
                      </div>
                      {post._show_comments&&(
                        <CommentSection postId={post.id} comments={post._comments??[]} onAdd={c=>addComment(post.id,c)} onDelete={cid=>deleteComment(post.id,cid)} currentUserId={user?.id} isAdmin={isAdmin}/>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
