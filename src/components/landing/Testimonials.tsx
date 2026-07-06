import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface Testimonial {
  id: string; user_id: string; content: string; rating: number; created_at: string;
  profiles?: { full_name: string; avatar_url: string | null; current_job_title: string | null; graduation_year: number | null } | null;
}

export function Testimonials() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isVerifiedAlumni = profile?.verification_status === "verified" && (profile?.role === "alumni" || profile?.role === "student");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [myText, setMyText] = useState("");
  const [myRating, setMyRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTestimonials = async () => {
    const { data } = await (supabase.from("posts") as any)
      .select("*, profiles(full_name, avatar_url, current_job_title, graduation_year)")
      .eq("department_id", "00000000-0000-0000-0000-000000000001")  // special sentinel for testimonials
      .order("likes_count", { ascending: false })
      .limit(20);
    setTestimonials(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTestimonials(); }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [testimonials.length]);

  const prev = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrent(c => (c - 1 + testimonials.length) % testimonials.length);
  };
  const next = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrent(c => (c + 1) % testimonials.length);
  };

  const submitTestimonial = async () => {
    if (!user || !myText.trim()) return;
    setSaving(true);
    // Store rating in content field as "rating:N" sentinel
    await (supabase.from("posts") as any).insert({
      author_id: user.id, content: myText, image_url: `rating:${myRating}`,
      department_id: "00000000-0000-0000-0000-000000000001",
    });
    setSaving(false);
    setAddOpen(false);
    setMyText("");
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    await (supabase.from("posts") as any).delete().eq("id", id);
    fetchTestimonials();
    if (current >= testimonials.length - 1) setCurrent(0);
  };

  const getRating = (t: any) => {
    const match = t.content?.match(/^rating:(\d+)$/);
    return match ? parseInt(match[1]) : 5;
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Our Alumni Say</h2>
          <p className="text-muted-foreground">Hear from our community — real stories from real members.</p>
          {(isVerifiedAlumni || profile?.role === "student") && user && (
            <Button className="mt-4" variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />Share Your Story
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Quote className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No testimonials yet. Be the first to share your story!</p>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={current}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}>
                <Card className="shadow-xl border-0 bg-card">
                  <CardContent className="p-8 sm:p-12">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="shrink-0">
                        <Avatar
                          src={testimonials[current].profiles?.avatar_url ?? null}
                          fallback={testimonials[current].profiles?.full_name ?? "?"}
                          size="xl" className="h-20 w-20"
                        />
                      </div>
                      <div className="flex-1">
                        <Quote className="h-8 w-8 text-primary/20 mb-3" />
                        <p className="text-lg leading-relaxed text-foreground mb-6">"{testimonials[current].content}"</p>
                        <div className="flex items-center gap-1 mb-3">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-4 w-4 ${s <= getRating(testimonials[current]) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{testimonials[current].profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[testimonials[current].profiles?.current_job_title, testimonials[current].profiles?.graduation_year ? `Class of ${testimonials[current].profiles?.graduation_year}` : null].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {(isAdmin || testimonials[current].user_id === user?.id) && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTestimonial(testimonials[current].id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="p-2 rounded-full border bg-card hover:bg-muted transition-colors shadow-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />
                ))}
              </div>
              <button onClick={next} className="p-2 rounded-full border bg-card hover:bg-muted transition-colors shadow-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">{current + 1} / {testimonials.length}</p>
          </div>
        )}
      </div>

      {/* Add testimonial dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" onClose={() => setAddOpen(false)}>
          <DialogHeader>
            <DialogTitle>Share Your Story</DialogTitle>
            <DialogDescription>Your testimonial will appear in the carousel after submission.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Your Rating</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setMyRating(s)}>
                    <Star className={`h-7 w-7 transition-colors ${s <= myRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30 hover:text-yellow-400"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Your Message *</Label>
              <Textarea value={myText} onChange={e => setMyText(e.target.value)} className="min-h-[120px]"
                placeholder="Share how AlumniConnect has impacted your career or life…" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitTestimonial} disabled={saving || !myText.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}