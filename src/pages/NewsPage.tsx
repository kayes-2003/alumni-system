import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Newspaper, Plus, Pencil, Trash2, Search, Loader2, Save,
  Eye, EyeOff, Calendar, User, Link as LinkIcon, Image as ImageIcon,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";

const NEWS_CATEGORIES = ["Announcement","News","Blog","Achievement","Event Recap","Research","Career","Alumni Spotlight","Press Release","Other"];
const CATEGORY_COLORS: Record<string,string> = {
  Announcement:"destructive", News:"default", Blog:"info", Achievement:"success",
  "Event Recap":"secondary", Research:"warning", Career:"default",
  "Alumni Spotlight":"info", "Press Release":"outline", Other:"secondary",
};

interface NewsItem {
  id: string; title: string; slug: string; content: string;
  cover_image_url: string|null; author_id: string; is_published: boolean;
  published_at: string|null; created_at: string;
  category?: string; external_link?: string; tags?: string; read_time?: number;
  profiles?: { full_name: string; avatar_url: string|null }|null;
}

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

// ── News Form Modal ──────────────────────────────────────────────────────────
function NewsFormModal({ item, open, onClose, onSaved, userId }:{
  item: NewsItem|null; open: boolean; onClose: ()=>void; onSaved: ()=>void; userId: string;
}) {
  const [form, setForm] = useState({ title:"", content:"", cover_image_url:"", is_published:false, category:"News", external_link:"", tags:"" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) setForm({ title:item.title, content:item.content, cover_image_url:item.cover_image_url??"",
      is_published:item.is_published, category:item.category??"News",
      external_link:item.external_link??"", tags:item.tags??"" });
    else setForm({ title:"", content:"", cover_image_url:"", is_published:false, category:"News", external_link:"", tags:"" });
    setError("");
  }, [item, open]);

  const set = (k: string, v: unknown) => setForm(p=>({...p,[k]:v}));

  const uploadImage = async (file: File) => {
    setUploading(true);
    const path = `news/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      set("cover_image_url", data.publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { setError("Title and content are required."); return; }
    setSaving(true);
    const slug = item?.slug ?? slugify(form.title)+"-"+Date.now().toString(36);
    const wordCount = form.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const payload = {
      title: form.title, slug, content: form.content,
      cover_image_url: form.cover_image_url||null,
      is_published: form.is_published, author_id: userId,
      published_at: form.is_published ? new Date().toISOString() : null,
      category: form.category, external_link: form.external_link||null,
      tags: form.tags||null, read_time: readTime,
    };
    const q = supabase.from("news") as any;
    const { error } = item ? await q.update(payload).eq("id",item.id) : await q.insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader><DialogTitle>{item?"Edit Article":"New Article"}</DialogTitle><DialogDescription>Write news, announcements, or blog posts for the community.</DialogDescription></DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

          {/* Cover image */}
          <div className="space-y-2">
            <Label>Cover Photo</Label>
            {form.cover_image_url && (
              <div className="relative">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-40 object-cover rounded-lg"/>
                <button onClick={()=>set("cover_image_url","")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><Trash2 className="h-3.5 w-3.5"/></button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted text-sm text-muted-foreground transition-colors">
                {uploading?<><Loader2 className="h-4 w-4 animate-spin"/>Uploading…</>:<><ImageIcon className="h-4 w-4"/>Upload photo</>}
                <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)uploadImage(f);}} disabled={uploading}/>
              </label>
              <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-muted-foreground shrink-0"/>
                <Input value={form.cover_image_url} onChange={e=>set("cover_image_url",e.target.value)} placeholder="Or paste image URL…" className="flex-1"/>
              </div>
            </div>
          </div>

          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Article headline…"/></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                {NEWS_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>External Link (optional)</Label>
              <Input value={form.external_link} onChange={e=>set("external_link",e.target.value)} placeholder="https://source.com/article"/>
            </div>
          </div>

          <div className="space-y-1.5"><Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="technology, alumni, achievement…"/>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Content *</Label>
              <span className="text-xs text-muted-foreground">{Math.ceil(form.content.split(/\s+/).length/200)} min read</span>
            </div>
            <Textarea value={form.content} onChange={e=>set("content",e.target.value)} className="min-h-[240px]"
              placeholder="Write your full article here…"/>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={()=>set("is_published",!form.is_published)}
              className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${form.is_published?"bg-primary":"bg-muted-foreground/30"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_published?"translate-x-4":"translate-x-0.5"}`}/>
            </button>
            <Label>{form.is_published?"Published — visible to everyone":"Draft — hidden from public"}</Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<Save className="h-4 w-4 mr-2"/>}
            {item?"Save Changes":"Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── News Detail Modal ────────────────────────────────────────────────────────
function NewsDetailModal({ item, open, onClose }:{ item: NewsItem|null; open: boolean; onClose: ()=>void }) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogBody className="p-0">
          {item.cover_image_url && <img src={item.cover_image_url} alt={item.title} className="w-full h-52 object-cover rounded-t-xl"/>}
          <div className="p-6 space-y-4">
            <div>
              {item.category && <Badge variant={(CATEGORY_COLORS[item.category]??"outline") as any} className="mb-2">{item.category}</Badge>}
              <h2 className="text-2xl font-bold leading-tight">{item.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-3 border-b">
              {item.profiles?.full_name && <span className="flex items-center gap-1"><User className="h-3 w-3"/>{item.profiles.full_name}</span>}
              {item.published_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{new Date(item.published_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>}
              {item.read_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{item.read_time} min read</span>}
            </div>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground">{item.content}</div>
            {item.tags && (
              <div className="flex flex-wrap gap-1 pt-2 border-t">
                {item.tags.split(",").map(t=><Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>)}
              </div>
            )}
            {item.external_link && (
              <a href={item.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <LinkIcon className="h-4 w-4"/>Read original article
              </a>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { toasts, toast, dismiss } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NewsItem|null>(null);
  const [viewTarget, setViewTarget] = useState<NewsItem|null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const q = (supabase.from("news") as any)
      .select("*, profiles(full_name, avatar_url)")
      .neq("slug","__hero_content__")
      .order("created_at",{ascending:false});
    const { data } = isAdmin ? await q : await q.eq("is_published",true);
    setNews(data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const togglePublish = async (item: NewsItem) => {
    const is_published = !item.is_published;
    await (supabase.from("news") as any).update({ is_published, published_at: is_published?new Date().toISOString():null }).eq("id",item.id);
    toast(is_published?"Published!":"Unpublished","success"); fetchNews();
  };

  const deleteNews = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await (supabase.from("news") as any).delete().eq("id",id);
    toast("Article deleted","success"); fetchNews();
  };

  const filtered = news.filter(n => {
    const s = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content??"").toLowerCase().includes(search.toLowerCase());
    const c = !categoryFilter || n.category === categoryFilter;
    return s && c;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss}/>

      <div className="border-b bg-background">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="h-6 w-6 text-primary"/>News & Announcements {isAdmin&&<Badge variant="info">Admin</Badge>}</h1>
              <p className="text-sm text-muted-foreground mt-1">Latest updates, achievements, and blog posts.</p>
            </div>
            {isAdmin && <Button onClick={()=>{setEditTarget(null);setFormOpen(true);}}><Plus className="h-4 w-4 mr-2"/>New Article</Button>}
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><Input className="pl-8 h-9 w-56" placeholder="Search articles…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="h-9 w-44">
              <option value="">All categories</option>
              {NEWS_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {loading ? (
          <div className="space-y-6"><div className="h-80 rounded-2xl bg-card animate-pulse"/><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[...Array(5)].map((_,i)=><div key={i} className="h-56 rounded-xl bg-card animate-pulse"/>)}</div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Newspaper className="h-16 w-16 text-muted-foreground/20"/>
            <p className="text-xl font-semibold">No articles found</p>
            {isAdmin&&<p className="text-sm text-muted-foreground">Publish your first article above.</p>}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured article */}
            {featured && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <Card className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer group ${!featured.is_published?"opacity-70 border-dashed":""}`}
                  onClick={()=>{setViewTarget(featured);setViewOpen(true);}}>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {featured.cover_image_url
                      ? <img src={featured.cover_image_url} alt={featured.title} className="w-full h-64 object-cover"/>
                      : <div className="h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Newspaper className="h-20 w-20 text-primary/20"/></div>}
                    <div className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex gap-1">
                            {featured.category&&<Badge variant={(CATEGORY_COLORS[featured.category]??"outline") as any}>{featured.category}</Badge>}
                            {!featured.is_published&&<Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1"/>Draft</Badge>}
                          </div>
                          {isAdmin&&(
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>togglePublish(featured)}>{featured.is_published?<EyeOff className="h-3.5 w-3.5"/>:<Eye className="h-3.5 w-3.5"/>}</Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>{setEditTarget(featured);setFormOpen(true);}}><Pencil className="h-3.5 w-3.5"/></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={()=>deleteNews(featured.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="mb-2 text-xs">Featured</Badge>
                        <h2 className="text-xl font-bold mb-2 leading-tight group-hover:text-primary transition-colors">{featured.title}</h2>
                        <p className="text-sm text-muted-foreground line-clamp-3">{featured.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        {featured.profiles?.full_name&&<span className="flex items-center gap-1"><User className="h-3 w-3"/>{featured.profiles.full_name}</span>}
                        {featured.published_at&&<span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{new Date(featured.published_at).toLocaleDateString()}</span>}
                        {featured.read_time&&<span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{featured.read_time} min read</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Rest of articles */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rest.map((item, idx) => (
                  <motion.div key={item.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}>
                    <Card className={`hover:shadow-md transition-all group h-full cursor-pointer ${!item.is_published?"opacity-70 border-dashed":""}`}
                      onClick={()=>{setViewTarget(item);setViewOpen(true);}}>
                      {item.cover_image_url
                        ? <img src={item.cover_image_url} alt={item.title} className="w-full h-40 object-cover rounded-t-xl"/>
                        : <div className="h-2 bg-gradient-to-r from-primary/60 to-primary/20 rounded-t-xl"/>}
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex gap-1 flex-wrap">
                            {item.category&&<Badge variant={(CATEGORY_COLORS[item.category]??"outline") as any} className="text-xs">{item.category}</Badge>}
                            {!item.is_published&&<Badge variant="secondary" className="text-xs"><EyeOff className="h-3 w-3 mr-1"/>Draft</Badge>}
                          </div>
                          {isAdmin&&(
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>togglePublish(item)}>{item.is_published?<EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}</Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>{setEditTarget(item);setFormOpen(true);}}><Pencil className="h-3 w-3"/></Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={()=>deleteNews(item.id)}><Trash2 className="h-3 w-3"/></Button>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{item.content}</p>
                        {item.tags && <div className="flex flex-wrap gap-1 mb-3">{item.tags.split(",").slice(0,3).map(t=><Badge key={t} variant="outline" className="text-[10px]">{t.trim()}</Badge>)}</div>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t">
                          {item.profiles?.full_name&&<span className="flex items-center gap-1"><User className="h-3 w-3"/>{item.profiles.full_name}</span>}
                          {item.published_at&&<span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{new Date(item.published_at).toLocaleDateString()}</span>}
                          {item.read_time&&<span className="flex items-center gap-1 ml-auto"><Clock className="h-3 w-3"/>{item.read_time} min</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NewsFormModal item={editTarget} open={formOpen} onClose={()=>setFormOpen(false)}
        onSaved={()=>{fetchNews();toast(editTarget?"Article updated!":"Article published!","success");}} userId={user?.id??""}/>
      <NewsDetailModal item={viewTarget} open={viewOpen} onClose={()=>setViewOpen(false)}/>
    </div>
  );
}