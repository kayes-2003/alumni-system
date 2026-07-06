import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail, Phone, MapPin, CheckCircle2, Loader2, Inbox,
  Check, Trash2, MessageSquare, Clock, Reply, ChevronDown, ChevronUp,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";

const SUBJECTS = [
  "General Inquiry","Membership Support","Event Information",
  "Career & Jobs","Technical Support","Alumni Verification","Donation & Fundraising","Other",
];

const schema = z.object({
  name: z.string().min(2,"Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1,"Please select a subject"),
  message: z.string().min(20,"Message must be at least 20 characters"),
});
type Form = z.infer<typeof schema>;

interface Message {
  id: string; name: string; email: string; phone?: string;
  subject: string; message: string; is_resolved: boolean; created_at: string;
  admin_reply?: string; replied_at?: string;
}

// ── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm() {
  const { profile } = useAuth();
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.full_name ?? "",
      email: profile?.email ?? "",
    },
  });

  const onSubmit = async (data: Form) => {
    await (supabase.from("contact_messages") as any).insert(data);
    setSuccess(true); reset();
  };

  if (success) return (
    <div className="text-center py-12 space-y-4">
      <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400"/>
      </div>
      <h3 className="text-xl font-semibold">Message Sent Successfully!</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">Thank you for reaching out. Our team will get back to you within 1–2 business days.</p>
      <Button variant="outline" onClick={()=>setSuccess(false)}>Send Another Message</Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input {...register("name")} placeholder="Your full name"/>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email Address *</Label>
          <Input type="email" {...register("email")} placeholder="you@example.com"/>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Phone (optional)</Label>
          <Input {...register("phone")} placeholder="+880 1xxx xxxxxx"/>
        </div>
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Select {...register("subject")}>
            <option value="">Select a subject…</option>
            {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between"><Label>Message *</Label><span className="text-xs text-muted-foreground">Min. 20 characters</span></div>
        <Textarea {...register("message")} className="min-h-[160px]" placeholder="Tell us how we can help you…"/>
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Sending…</> : <><MessageSquare className="h-4 w-4 mr-2"/>Send Message</>}
      </Button>
    </form>
  );
}

// ── Admin Reply Modal ────────────────────────────────────────────────────────
function ReplyModal({ msg, open, onClose, onSaved }:{
  msg: Message|null; open: boolean; onClose: ()=>void; onSaved: ()=>void;
}) {
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setReply(msg?.admin_reply??""); }, [msg]);

  const handleSave = async () => {
    if (!msg) return;
    setSaving(true);
    await (supabase.from("contact_messages") as any)
      .update({ admin_reply: reply, replied_at: new Date().toISOString(), is_resolved: true })
      .eq("id", msg.id);
    setSaving(false); onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" onClose={onClose}>
        <DialogHeader><DialogTitle>Reply to {msg?.name}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">{msg?.subject}</p>
            <p className="text-muted-foreground">{msg?.message}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Your Reply</Label>
            <Textarea value={reply} onChange={e=>setReply(e.target.value)} className="min-h-[120px]" placeholder="Write your reply…"/>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving||!reply.trim()}>
            {saving&&<Loader2 className="h-4 w-4 mr-2 animate-spin"/>}<Reply className="h-4 w-4 mr-1.5"/>Save Reply & Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Admin Inbox ──────────────────────────────────────────────────────────────
function AdminInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open"|"resolved"|"all">("open");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [replyTarget, setReplyTarget] = useState<Message|null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const q = (supabase.from("contact_messages") as any).select("*").order("created_at",{ascending:false});
    const filtered = filter==="open"?q.eq("is_resolved",false):filter==="resolved"?q.eq("is_resolved",true):q;
    const withSubject = subjectFilter ? filtered.eq("subject",subjectFilter) : filtered;
    const { data } = await withSubject;
    setMessages(data??[]);
    setLoading(false);
  }, [filter, subjectFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const resolve = async (id: string) => {
    await (supabase.from("contact_messages") as any).update({is_resolved:true}).eq("id",id);
    toast("Marked as resolved","success"); fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await (supabase.from("contact_messages") as any).delete().eq("id",id);
    toast("Deleted","success"); fetch();
  };

  const stats = { total: messages.length, open: messages.filter(m=>!m.is_resolved).length, resolved: messages.filter(m=>m.is_resolved).length };

  return (
    <div className="mt-12 space-y-6">
      <ToastContainer toasts={toasts} dismiss={dismiss}/>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><Inbox className="h-5 w-5 text-primary"/>Admin Inbox</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">{stats.open} open</span>
          <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">{stats.resolved} resolved</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border bg-background overflow-hidden">
          {(["open","resolved","all"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 text-sm capitalize transition-colors ${filter===f?"bg-primary text-primary-foreground":"hover:bg-muted"}`}>{f}</button>
          ))}
        </div>
        <Select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)} className="h-9 w-48">
          <option value="">All subjects</option>
          {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        : messages.length===0 ? <p className="text-center py-12 text-muted-foreground">No messages found.</p>
        : (
          <div className="space-y-3">
            {messages.map(m => (
              <Card key={m.id} className={`transition-all ${m.is_resolved?"opacity-70":""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{m.name}</span>
                        <a href={`mailto:${m.email}`} className="text-xs text-primary hover:underline">{m.email}</a>
                        {m.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/>{m.phone}</span>}
                        {m.is_resolved ? <Badge variant="success">Resolved</Badge> : <Badge variant="warning">Open</Badge>}
                      </div>
                      <p className="text-sm font-medium">{m.subject}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3"/>{new Date(m.created_at).toLocaleString()}
                      </p>

                      {/* Expandable message */}
                      <div className="mt-2">
                        <button onClick={()=>setExpandedId(expandedId===m.id?null:m.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          {expandedId===m.id?<ChevronUp className="h-3 w-3"/>:<ChevronDown className="h-3 w-3"/>}
                          {expandedId===m.id?"Hide":"Show"} message
                        </button>
                        {expandedId===m.id && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm bg-muted/50 rounded-lg p-3 leading-relaxed">{m.message}</p>
                            {m.admin_reply && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Reply className="h-3 w-3"/>Admin Reply</p>
                                <p className="text-sm">{m.admin_reply}</p>
                                {m.replied_at && <p className="text-xs text-muted-foreground mt-1">{new Date(m.replied_at).toLocaleString()}</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=>{setReplyTarget(m);setReplyOpen(true);}}>
                        <Reply className="h-3 w-3 mr-1"/>Reply
                      </Button>
                      {!m.is_resolved && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=>resolve(m.id)}>
                          <Check className="h-3 w-3 mr-1"/>Resolve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={()=>del(m.id)}>
                        <Trash2 className="h-3 w-3"/>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      <ReplyModal msg={replyTarget} open={replyOpen} onClose={()=>setReplyOpen(false)} onSaved={()=>{fetch();toast("Reply saved!","success");}}/>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="container py-6">
          <h1 className="text-2xl font-bold">Contact Us</h1>
          <p className="text-sm text-muted-foreground mt-1">We're here to help. Send us a message and we'll respond promptly.</p>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary"/>Send a Message</CardTitle></CardHeader>
              <CardContent><ContactForm/></CardContent>
            </Card>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "alumni@university.edu", href: "mailto:alumni@university.edu" },
              { icon: Phone, label: "Phone", value: "+880 2-9661900", href: "tel:+88029661900" },
              { icon: MapPin, label: "Address", value: "BUET campus, Dhaka 1000, Bangladesh", href: undefined },
              { icon: Clock, label: "Office Hours", value: "Sun–Thu, 9:00 AM – 5:00 PM", href: undefined },
            ].map(({ icon: Icon, label, value, href }) => (
              <Card key={label}><CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary"/></div>
                <div><p className="text-xs text-muted-foreground">{label}</p>
                  {href ? <a href={href} className="text-sm font-medium hover:text-primary transition-colors">{value}</a>
                    : <p className="text-sm font-medium">{value}</p>}
                </div>
              </CardContent></Card>
            ))}

            {/* FAQ */}
            <Card><CardContent className="p-4">
              <p className="font-semibold text-sm mb-3">Common Topics</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {["How do I verify my alumni status?","How to reset my password?","How to post a job?","How to register for events?"].map(q=>(
                  <p key={q} className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5"/>{q}</p>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </div>

        {isAdmin && <AdminInbox/>}
      </div>
    </div>
  );
}