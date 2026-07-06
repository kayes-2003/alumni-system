import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Briefcase, Calendar, Upload, X, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";

interface HeroContent { id?: string; headline: string; subheadline: string; image_url: string | null; cta_primary: string; cta_secondary: string; }

const DEFAULT: HeroContent = {
  headline: "Stay Connected.\nGrow Together.",
  subheadline: "Join thousands of alumni and students building lifelong connections, finding career opportunities, mentorship, and reuniting at exclusive events.",
  image_url: null,
  cta_primary: "Join the Network",
  cta_secondary: "Browse Alumni Directory",
};

export function Hero() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [content, setContent] = useState<HeroContent>(DEFAULT);
  const [stats, setStats] = useState({ alumni: 0, jobs: 0, events: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<HeroContent>(DEFAULT);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch hero content from Supabase (stored as a special news record or settings table)
    (supabase.from("news") as any)
      .select("*").eq("slug", "__hero_content__").maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          try { const c = JSON.parse(data.content); setContent(c); setForm(c); } catch { }
        }
      });

    // Real stats
    Promise.all([
      (supabase.from("profiles") as any).select("id", { count: "exact" }).in("role", ["alumni", "student"]),
      (supabase.from("jobs") as any).select("id", { count: "exact" }).eq("is_active", true),
      (supabase.from("events") as any).select("id", { count: "exact" }),
    ]).then(([p, j, e]) => setStats({ alumni: p.count ?? 0, jobs: j.count ?? 0, events: e.count ?? 0 }));
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const path = `hero/hero-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const saveContent = async () => {
    setSaving(true);
    const q = supabase.from("news") as any;
    const payload = { title: "Hero Content", slug: "__hero_content__", content: JSON.stringify(form), is_published: true, author_id: profile?.id };
    const { data: existing } = await q.select("id").eq("slug", "__hero_content__").maybeSingle();
    if (existing) await q.update(payload).eq("id", existing.id);
    else await q.insert(payload);
    setContent(form);
    setSaving(false);
    setEditOpen(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {isAdmin && (
        <button onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors">
          <Pencil className="h-3 w-3" /> Edit Hero
        </button>
      )}

      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-primary bg-primary/10 mb-6">
              Welcome to the Alumni Network
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 whitespace-pre-line">
              {content.headline.includes("\n")
                ? <>{content.headline.split("\n")[0]}<br /><span className="text-primary">{content.headline.split("\n")[1]}</span></>
                : <>{content.headline}</>}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">{content.subheadline}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register"><Button size="lg" className="w-full sm:w-auto">{content.cta_primary} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/alumni"><Button size="lg" variant="outline" className="w-full sm:w-auto">{content.cta_secondary}</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { icon: Users, value: stats.alumni > 0 ? `${stats.alumni.toLocaleString()}+` : "15K+", label: "Alumni" },
                { icon: Briefcase, value: stats.jobs > 0 ? `${stats.jobs}+` : "1.2K+", label: "Job Posts" },
                { icon: Calendar, value: stats.events > 0 ? `${stats.events}+` : "300+", label: "Events/yr" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="relative">
            {content.image_url ? (
              <div className="rounded-2xl overflow-hidden border shadow-2xl">
                <img src={content.image_url} alt="Alumni community" className="w-full h-80 object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl border bg-card shadow-2xl p-8 grid grid-cols-2 gap-4">
                {["🎓 Computer Science", "💼 Engineering", "🏥 Medicine", "⚖️ Law"].map(d => (
                  <div key={d} className="rounded-xl bg-muted/50 p-4 text-sm font-medium text-center">{d}</div>
                ))}
              </div>
            )}
            <div className="absolute -bottom-4 -left-4 rounded-xl border bg-card shadow-lg p-3 hidden sm:block">
              <p className="text-sm font-semibold">🎓 Class of 2024</p>
              <p className="text-xs text-muted-foreground">450 new alumni joined</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Admin edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg" onClose={() => setEditOpen(false)}>
          <DialogHeader><DialogTitle>Edit Hero Section</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Headline (use newline for 2nd line in primary color)</Label>
              <Textarea value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className="min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Subheadline</Label>
              <Textarea value={form.subheadline} onChange={e => setForm(f => ({ ...f, subheadline: e.target.value }))} className="min-h-[80px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Primary CTA Button Text</Label>
              <Input value={form.cta_primary} onChange={e => setForm(f => ({ ...f, cta_primary: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Image</Label>
              {form.image_url && (
                <div className="relative mb-2">
                  <img src={form.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                  <button onClick={() => setForm(f => ({ ...f, image_url: null }))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted transition-colors text-sm text-muted-foreground">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4" />Click to upload hero image</>}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={uploading} />
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveContent} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}