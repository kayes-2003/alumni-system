import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar, MapPin, Video, Users, Plus, Pencil, Trash2, QrCode,
  CheckCircle2, Clock, Search, Loader2, X, Save, Download, Tag,
   Link as LinkIcon, Image as ImageIcon,
} from "lucide-react";
import QRCode from "qrcode";
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
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";

const EVENT_TYPES = ["Reunion","Webinar","Networking","Workshop","Career Fair","Sports","Cultural","Academic","Social","Alumni Meet","Fundraiser","Award Ceremony"];
const EVENT_TYPE_COLORS: Record<string, string> = {
  Reunion:"default", Webinar:"info", Networking:"success", Workshop:"warning",
  "Career Fair":"default", Sports:"secondary", Cultural:"info", Academic:"warning",
  Social:"success", "Alumni Meet":"default", Fundraiser:"destructive", "Award Ceremony":"info",
};

interface Event {
  id: string; title: string; description: string; banner_url: string|null;
  location: string|null; is_virtual: boolean; start_time: string; end_time: string;
  capacity: number|null; created_by: string; created_at: string;
  event_type?: string; meeting_link?: string; tags?: string;
  _count?: number; _is_registered?: boolean; _my_reg_id?: string; _qr?: string;
}

const EMPTY = {
  title:"", description:"", location:"", is_virtual:false, start_time:"", end_time:"",
  capacity:"", event_type:"Networking", meeting_link:"", tags:"", banner_url:"",
};

// ── QR Modal ────────────────────────────────────────────────────────────────
function QRModal({ regId, eventTitle, open, onClose }: { regId: string; eventTitle: string; open: boolean; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    if (!regId || !open) return;
    QRCode.toDataURL(`ALUMNI_REG:${regId}`, { width: 256, margin: 2 }).then(setQrUrl);
  }, [regId, open]);

  const download = () => {
    const a = document.createElement("a"); a.href = qrUrl;
    a.download = `qr-${eventTitle.replace(/\s+/g,"-")}.png`; a.click();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs text-center" onClose={onClose}>
        <DialogHeader><DialogTitle>Your QR Code</DialogTitle><DialogDescription>{eventTitle}</DialogDescription></DialogHeader>
        <DialogBody className="flex flex-col items-center gap-4">
          {qrUrl ? <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border" /> : <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />}
          <p className="text-xs text-muted-foreground">Show this at the event entrance for check-in</p>
          <Button size="sm" variant="outline" onClick={download}><Download className="h-3.5 w-3.5 mr-1.5"/>Download QR</Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Attendees Modal ─────────────────────────────────────────────────────────
function AttendeesModal({ event, open, onClose, isAdmin }: { event: Event|null; open: boolean; onClose: ()=>void; isAdmin: boolean }) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const { toast, toasts, dismiss } = useToast();

  useEffect(() => {
    if (!event || !open) return;
    setLoading(true);
    (supabase.from("event_registrations") as any)
      .select("*, profiles(full_name, email, avatar_url)")
      .eq("event_id", event.id)
      .then(({ data }: any) => { setAttendees(data ?? []); setLoading(false); });
  }, [event, open]);

  const checkInById = async (id: string) => {
    await (supabase.from("event_registrations") as any).update({ checked_in: true }).eq("id", id);
    setAttendees(p => p.map(a => a.id === id ? { ...a, checked_in: true } : a));
    toast("Checked in!", "success");
  };

  const handleScan = async () => {
    const regId = scanInput.replace("ALUMNI_REG:", "").trim();
    const found = attendees.find(a => a.id === regId || a.qr_code === regId);
    if (found) { await checkInById(found.id); setScanInput(""); }
    else toast("QR code not found for this event", "error");
  };

  const exportCSV = () => {
    const rows = [["Name","Email","Checked In","Reg Date"],...attendees.map(a => [a.profiles?.full_name, a.profiles?.email, a.checked_in?"Yes":"No", new Date(a.registered_at).toLocaleDateString()])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `attendees-${event?.title}.csv`; link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Attendees — {event?.title}</DialogTitle>
          <DialogDescription>{attendees.length} registered · {attendees.filter(a => a.checked_in).length} checked in</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <ToastContainer toasts={toasts} dismiss={dismiss} />
          {isAdmin && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Paste QR code value or registration ID…" className="flex-1" onKeyDown={e => e.key === "Enter" && handleScan()} />
                <Button size="sm" onClick={handleScan}><QrCode className="h-4 w-4 mr-1"/>Check In</Button>
              </div>
              <Button size="sm" variant="outline" onClick={exportCSV} className="w-full"><Download className="h-3.5 w-3.5 mr-1.5"/>Export CSV</Button>
            </div>
          )}
          {loading ? <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendees.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No registrations yet.</p>}
              {attendees.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30">
                  <Avatar src={a.profiles?.avatar_url} fallback={a.profiles?.full_name ?? "?"} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.profiles?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.profiles?.email}</p>
                  </div>
                  {a.checked_in
                    ? <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1"/>In</Badge>
                    : isAdmin ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => checkInById(a.id)}><QrCode className="h-3 w-3 mr-1"/>Check In</Button>
                    : <Badge variant="warning">Pending</Badge>}
                </div>
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Event Form Modal ─────────────────────────────────────────────────────────
function EventFormModal({ event, open, onClose, onSaved, userId }: { event: Event|null; open: boolean; onClose: ()=>void; onSaved: ()=>void; userId: string }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) setForm({
      title: event.title, description: event.description, location: event.location ?? "",
      is_virtual: event.is_virtual, start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16), capacity: event.capacity?.toString() ?? "",
      event_type: event.event_type ?? "Networking", meeting_link: event.meeting_link ?? "",
      tags: event.tags ?? "", banner_url: event.banner_url ?? "",
    });
    else setForm({ ...EMPTY });
    setError("");
  }, [event, open]);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const uploadBanner = async (file: File) => {
    setUploading(true);
    const path = `banners/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("event-banners").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
      set("banner_url", data.publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.start_time || !form.end_time) { setError("Title, start and end time required."); return; }
    setSaving(true);
    const payload = {
      title: form.title, description: form.description,
      location: form.location || null, is_virtual: form.is_virtual,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      capacity: form.capacity ? parseInt(form.capacity) : null,
      created_by: userId, event_type: form.event_type,
      meeting_link: form.meeting_link || null, tags: form.tags || null,
      banner_url: form.banner_url || null,
    };
    const q = supabase.from("events") as any;
    const { error } = event ? await q.update(payload).eq("id", event.id) : await q.insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader><DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle><DialogDescription>Fill in all event details. These will be visible to all members.</DialogDescription></DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

          {/* Banner */}
          <div className="space-y-2">
            <Label>Event Banner Image</Label>
            {form.banner_url && <img src={form.banner_url} alt="Banner" className="w-full h-32 object-cover rounded-lg"/>}
            <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted text-sm text-muted-foreground transition-colors">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin"/>Uploading…</> : <><ImageIcon className="h-4 w-4"/>Upload banner image</>}
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadBanner(f); }} disabled={uploading} />
            </label>
          </div>

          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Annual Alumni Reunion 2025"/></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="min-h-[100px]" placeholder="Describe the event, agenda, speakers…"/></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Event Type</Label>
              <Select value={form.event_type} onChange={e => set("event_type", e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Capacity (blank = unlimited)</Label>
              <Input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="500"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Start Time *</Label><Input type="datetime-local" value={form.start_time} onChange={e => set("start_time", e.target.value)}/></div>
            <div className="space-y-1.5"><Label>End Time *</Label><Input type="datetime-local" value={form.end_time} onChange={e => set("end_time", e.target.value)}/></div>
          </div>

          <div className="flex gap-2">
            {[{v:false,label:"In-Person",icon:MapPin},{v:true,label:"Virtual",icon:Video}].map(({v,label,icon:Icon}) => (
              <button key={label} type="button" onClick={() => set("is_virtual", v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.is_virtual === v ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                <Icon className="h-4 w-4"/>{label}
              </button>
            ))}
          </div>

          {!form.is_virtual
            ? <div className="space-y-1.5"><Label>Venue Location</Label><Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="BUET campus, Dhaka"/></div>
            : <div className="space-y-1.5"><Label>Meeting Link</Label><Input value={form.meeting_link} onChange={e => set("meeting_link", e.target.value)} placeholder="https://zoom.us/j/…"/></div>}

          <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="networking, tech, 2024"/></div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
            {event ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Event Detail Modal ───────────────────────────────────────────────────────
function EventDetailModal({ event, open, onClose, onRegister, onUnregister, user }:
  { event: Event|null; open: boolean; onClose: ()=>void; onRegister: ()=>void; onUnregister: ()=>void; user: any }) {
  if (!event) return null;
  const now = new Date();
  const isPast = new Date(event.end_time) < now;
  const isFull = event.capacity !== null && (event._count ?? 0) >= event.capacity;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogBody className="p-0">
          {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover rounded-t-xl"/>}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{event.title}</h2>
                {event.event_type && <Badge variant={(EVENT_TYPE_COLORS[event.event_type] ?? "outline") as any} className="mt-1">{event.event_type}</Badge>}
              </div>
              {isPast && <Badge variant="secondary">Past Event</Badge>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-primary shrink-0"/><div><p className="font-medium text-foreground">{new Date(event.start_time).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p><p>{new Date(event.start_time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})} – {new Date(event.end_time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</p></div></div>
              {event.is_virtual
                ? <div className="flex items-center gap-2 text-muted-foreground"><Video className="h-4 w-4 text-primary shrink-0"/><div><p className="font-medium text-foreground">Virtual Event</p>{event.meeting_link && <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3"/>Join Link</a>}</div></div>
                : <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary shrink-0"/><div><p className="font-medium text-foreground">In-Person</p><p className="text-xs">{event.location}</p></div></div>}
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4 text-primary shrink-0"/><div><p className="font-medium text-foreground">{event._count ?? 0} Registered</p><p>{event.capacity ? `${event.capacity} capacity` : "Unlimited"}</p></div></div>
            </div>
            {event.tags && <div className="flex flex-wrap gap-1">{event.tags.split(",").map(t => <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>)}</div>}
            {!isPast && user && (
              <div className="pt-2">
                {event._is_registered
                  ? <Button variant="outline" className="w-full" onClick={onUnregister}><X className="h-4 w-4 mr-2"/>Unregister</Button>
                  : <Button className="w-full" disabled={isFull} onClick={onRegister}>{isFull ? "Event Full" : "Register for This Event"}</Button>}
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { toasts, toast, dismiss } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<"upcoming"|"past"|"all">("upcoming");
  const [typeFilter, setTypeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event|null>(null);
  const [detailTarget, setDetailTarget] = useState<Event|null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [attendeesTarget, setAttendeesTarget] = useState<Event|null>(null);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<{regId:string;title:string}|null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("events") as any).select("*").order("start_time", { ascending: true });
    if (!data) { setLoading(false); return; }
    const ids = data.map((e: Event) => e.id);
    const [{ data: regs }, { data: myRegs }] = await Promise.all([
      (supabase.from("event_registrations") as any).select("event_id").in("event_id", ids),
      user ? (supabase.from("event_registrations") as any).select("id,event_id").in("event_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    const countMap: Record<string, number> = {};
    (regs ?? []).forEach((r: any) => { countMap[r.event_id] = (countMap[r.event_id] ?? 0) + 1; });
    const myMap: Record<string, string> = {};
    (myRegs ?? []).forEach((r: any) => { myMap[r.event_id] = r.id; });
    setEvents(data.map((e: Event) => ({ ...e, _count: countMap[e.id] ?? 0, _is_registered: !!myMap[e.id], _my_reg_id: myMap[e.id] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const registerEvent = async (event: Event) => {
    if (!user) { toast("Please log in to register", "error"); return; }
    const { error } = await (supabase.from("event_registrations") as any).insert({ event_id: event.id, user_id: user.id });
    if (error) { toast(error.message, "error"); return; }
    toast("Registered! Check your QR code.", "success");
    fetchEvents();
  };

  const unregisterEvent = async (event: Event) => {
    if (!user) return;
    await (supabase.from("event_registrations") as any).delete().eq("event_id", event.id).eq("user_id", user.id);
    toast("Registration cancelled", "info"); fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await (supabase.from("events") as any).delete().eq("id", id);
    toast("Event deleted", "success"); fetchEvents();
  };

  const now = new Date();
  const filtered = events.filter(e => {
    const isPast = new Date(e.end_time) < now;
    const matchTime = timeFilter === "all" || (timeFilter === "upcoming" && !isPast) || (timeFilter === "past" && isPast);
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || e.event_type === typeFilter;
    return matchTime && matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss}/>

      {/* Header */}
      <div className="border-b bg-background">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-primary"/>Events {isAdmin && <Badge variant="info">Admin</Badge>}</h1>
              <p className="text-sm text-muted-foreground mt-1">Reunions, webinars, workshops, and networking events.</p>
            </div>
            {isAdmin && <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-2"/>Create Event</Button>}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><Input className="pl-8 h-9 w-56" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)}/></div>
            <div className="flex rounded-lg border bg-background overflow-hidden">
              {(["upcoming","past","all"] as const).map(f => (
                <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1.5 text-sm capitalize transition-colors ${timeFilter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{f}</button>
              ))}
            </div>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 w-44">
              <option value="">All types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_,i) => <div key={i} className="h-72 rounded-xl border bg-card animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Calendar className="h-16 w-16 text-muted-foreground/20"/>
            <p className="text-xl font-semibold">No events found</p>
            <p className="text-sm text-muted-foreground">{isAdmin ? "Create your first event using the button above." : "Check back soon for upcoming events."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((event, idx) => {
              const isPast = new Date(event.end_time) < now;
              const isFull = event.capacity !== null && (event._count ?? 0) >= event.capacity;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer" onClick={() => { setDetailTarget(event); setDetailOpen(true); }}>
                    {event.banner_url
                      ? <img src={event.banner_url} alt={event.title} className="w-full h-36 object-cover"/>
                      : <div className={`h-2 ${isPast ? "bg-muted" : "bg-gradient-to-r from-primary to-primary/60"}`}/>}
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1">
                          {isPast && <Badge variant="secondary">Past</Badge>}
                          {event.event_type && <Badge variant={(EVENT_TYPE_COLORS[event.event_type] ?? "outline") as any}>{event.event_type}</Badge>}
                          {event.is_virtual ? <Badge variant="info"><Video className="h-3 w-3 mr-1"/>Virtual</Badge> : <Badge variant="outline"><MapPin className="h-3 w-3 mr-1"/>In-Person</Badge>}
                          {isFull && !isPast && <Badge variant="warning">Full</Badge>}
                          {event._is_registered && <Badge variant="success">Registered</Badge>}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditTarget(event); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteEvent(event.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-base mb-1 line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{event.description}</p>

                      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary"/>
                          {new Date(event.start_time).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} · {new Date(event.start_time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
                        </div>
                        {event.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary"/><span className="truncate">{event.location}</span></div>}
                        <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary"/>{event._count} registered{event.capacity && ` / ${event.capacity}`}</div>
                        {event.tags && <div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary"/><span className="truncate">{event.tags}</span></div>}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                        {!isPast && user && (event._is_registered
                          ? <>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => unregisterEvent(event)}><X className="h-3.5 w-3.5 mr-1"/>Unregister</Button>
                              <Button size="sm" variant="outline" onClick={() => { setQrTarget({regId: event._my_reg_id!, title: event.title}); setQrOpen(true); }}><QrCode className="h-3.5 w-3.5"/></Button>
                            </>
                          : <Button size="sm" className="flex-1" disabled={isFull} onClick={() => registerEvent(event)}>{isFull ? "Full" : "Register"}</Button>
                        )}
                        {isAdmin && <Button size="sm" variant="outline" onClick={() => { setAttendeesTarget(event); setAttendeesOpen(true); }}><Users className="h-3.5 w-3.5 mr-1"/>Attendees</Button>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <EventFormModal event={editTarget} open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={() => { fetchEvents(); toast(editTarget ? "Event updated!" : "Event created!", "success"); }} userId={user?.id ?? ""}/>
      <EventDetailModal event={detailTarget} open={detailOpen} onClose={() => setDetailOpen(false)}
        onRegister={() => { if(detailTarget) registerEvent(detailTarget); setDetailOpen(false); }}
        onUnregister={() => { if(detailTarget) unregisterEvent(detailTarget); setDetailOpen(false); }}
        user={user}/>
      <AttendeesModal event={attendeesTarget} open={attendeesOpen} onClose={() => setAttendeesOpen(false)} isAdmin={isAdmin}/>
      {qrTarget && <QRModal regId={qrTarget.regId} eventTitle={qrTarget.title} open={qrOpen} onClose={() => setQrOpen(false)}/>}
    </div>
  );
}