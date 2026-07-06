import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, Check, X, Calendar, Loader2, Save,
  MessageSquare, Star, Clock, Users, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogBody,
} from "@/components/ui/dialog";

interface AlumniMentor {
  id: string; full_name: string; email: string; avatar_url: string | null;
  current_job_title: string | null; current_company: string | null;
  bio: string | null; skills: string[] | null; location: string | null;
  graduation_year: number | null;
  departments?: { name: string } | null;
}

interface Request {
  id: string; student_id: string; alumni_id: string; message: string;
  status: string; scheduled_at: string | null; created_at: string;
  student?: { full_name: string; email: string; avatar_url: string | null; current_job_title: string | null } | null;
  alumni?: { full_name: string; email: string; avatar_url: string | null; current_job_title: string | null; current_company: string | null } | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  accepted: "success", pending: "warning", rejected: "destructive", completed: "secondary",
};

// ── Request Modal ────────────────────────────────────────────────────────────
function RequestModal({ alumni, open, onClose, onSent }: {
  alumni: AlumniMentor | null; open: boolean; onClose: () => void; onSent: () => void;
}) {
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!msg.trim() || !alumni || !user) { setError("Please write a message."); return; }
    setSaving(true); setError("");
    const { error } = await (supabase.from("mentorship_requests") as any)
      .insert({ student_id: user.id, alumni_id: alumni.id, message: msg });
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSent(); onClose(); setMsg("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Request Mentorship</DialogTitle>
          <DialogDescription>Send a personalized message to {alumni?.full_name}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
          {alumni && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
              <Avatar src={alumni.avatar_url} fallback={alumni.full_name} size="md" />
              <div>
                <p className="font-semibold text-sm">{alumni.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[alumni.current_job_title, alumni.current_company].filter(Boolean).join(" @ ")}
                </p>
                {alumni.location && <p className="text-xs text-muted-foreground">{alumni.location}</p>}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Your Message *</Label>
            <Textarea value={msg} onChange={e => setMsg(e.target.value)} className="min-h-[130px]"
              placeholder="Introduce yourself, share your goals, and explain what kind of mentorship you're looking for…" />
            <p className="text-xs text-muted-foreground">{msg.length}/500 characters</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={saving || !msg.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ request, open, onClose, onSaved }: {
  request: Request | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [dt, setDt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!request || !dt) return;
    setSaving(true);
    await (supabase.from("mentorship_requests") as any)
      .update({ scheduled_at: new Date(dt).toISOString(), status: "accepted" })
      .eq("id", request.id);
    setSaving(false);
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Schedule Session</DialogTitle>
          <DialogDescription>with {request?.student?.full_name}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Session Notes (optional)</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Topics to cover, meeting link, etc." className="min-h-[80px]" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !dt}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />Confirm & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mentor Card ──────────────────────────────────────────────────────────────
function MentorCard({ mentor, onRequest, isStudent, idx }: {
  mentor: AlumniMentor; onRequest: (m: AlumniMentor) => void; isStudent: boolean; idx: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
      <Card className="hover:shadow-md transition-all duration-200 h-full">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            <Link to={`/profile/${mentor.id}`}>
              <Avatar src={mentor.avatar_url} fallback={mentor.full_name} size="lg" className="shrink-0 ring-2 ring-background shadow" />
            </Link>
            <div className="min-w-0">
              <Link to={`/profile/${mentor.id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">{mentor.full_name}</Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {[mentor.current_job_title, mentor.current_company].filter(Boolean).join(" @ ")}
              </p>
              {mentor.location && <p className="text-xs text-muted-foreground">{mentor.location}</p>}
            </div>
          </div>

          {mentor.departments?.name && (
            <Badge variant="outline" className="w-fit mb-2 text-xs">{mentor.departments.name}{mentor.graduation_year ? ` · ${mentor.graduation_year}` : ""}</Badge>
          )}

          {mentor.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{mentor.bio}</p>
          )}

          {mentor.skills && mentor.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {mentor.skills.slice(0, 5).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px] h-4">{s}</Badge>
              ))}
              {mentor.skills.length > 5 && <Badge variant="secondary" className="text-[10px] h-4">+{mentor.skills.length - 5}</Badge>}
            </div>
          )}

          <div className="mt-auto">
            {isStudent ? (
              <Button size="sm" className="w-full" onClick={() => onRequest(mentor)}>
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />Request Mentorship
              </Button>
            ) : (
              <Link to={`/profile/${mentor.id}`}>
                <Button size="sm" variant="outline" className="w-full">View Profile</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MentorshipPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isAlumni = profile?.role === "alumni" || isAdmin;
  const isStudent = profile?.role === "student";
  const { toasts, toast, dismiss } = useToast();

  const [tab, setTab] = useState<"browse" | "my_requests" | "incoming">("browse");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [mentors, setMentors] = useState<AlumniMentor[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestTarget, setRequestTarget] = useState<AlumniMentor | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Request | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: r }, { data: inc }] = await Promise.all([
      (supabase.from("profiles") as any)
        .select("id, full_name, email, avatar_url, current_job_title, current_company, bio, skills, location, graduation_year, departments(name)")
        .eq("role", "alumni").eq("is_profile_public", true).eq("verification_status", "verified")
        .order("full_name"),
      user
        ? (supabase.from("mentorship_requests") as any)
          .select("*, alumni:alumni_id(full_name, email, avatar_url, current_job_title, current_company)")
          .eq("student_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      user && isAlumni
        ? (supabase.from("mentorship_requests") as any)
          .select("*, student:student_id(full_name, email, avatar_url, current_job_title)")
          .eq("alumni_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    setMentors(m ?? []);
    setRequests(r ?? []);
    setIncoming(inc ?? []);
    setLoading(false);
  }, [user, isAlumni]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("mentorship_requests") as any).update({ status }).eq("id", id);
    toast(`Request ${status}`, "success");
    fetchData();
  };

  const filteredMentors = mentors.filter(m => {
    const s = !search || m.full_name.toLowerCase().includes(search.toLowerCase())
      || (m.current_company ?? "").toLowerCase().includes(search.toLowerCase())
      || (m.location ?? "").toLowerCase().includes(search.toLowerCase());
    const sk = !skillFilter || (m.skills ?? []).some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));
    return s && sk;
  });

  const allTabs = [
    { id: "browse", label: "Browse Mentors" },
    ...(user ? [{ id: isStudent ? "my_requests" : "incoming", label: isStudent ? "My Requests" : "Incoming Requests" }] : []),
    ...(isAdmin ? [{ id: "my_requests", label: "All Requests" }] : []),
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="border-b bg-background">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />Mentorship
                {isAdmin && <Badge variant="info">Admin</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect students with {mentors.length} experienced alumni mentors.
              </p>
            </div>
            {!user && (
              <Link to="/register">
                <Button><Users className="h-4 w-4 mr-2" />Join to Request Mentorship</Button>
              </Link>
            )}
          </div>
          <div className="flex gap-1 border-b -mb-px overflow-x-auto">
            {allTabs.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {label}
                {id === "incoming" && incoming.filter(r => r.status === "pending").length > 0 && (
                  <Badge className="ml-2 h-4 text-[10px] px-1">{incoming.filter(r => r.status === "pending").length}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Browse tab */}
            {tab === "browse" && (
              <div>
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-9" placeholder="Search by name, company, location…"
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <div className="relative max-w-xs">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-9 w-44" placeholder="Filter by skill…"
                      value={skillFilter} onChange={e => setSkillFilter(e.target.value)} />
                  </div>
                  <p className="self-center text-sm text-muted-foreground">{filteredMentors.length} mentor{filteredMentors.length !== 1 ? "s" : ""}</p>
                </div>

                {filteredMentors.length === 0 ? (
                  <div className="text-center py-20">
                    <GraduationCap className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xl font-semibold">No mentors found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredMentors.map((m, idx) => (
                      <MentorCard key={m.id} mentor={m} idx={idx} isStudent={isStudent}
                        onRequest={mentor => { setRequestTarget(mentor); setRequestOpen(true); }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Requests (student) */}
            {tab === "my_requests" && (
              <div className="max-w-2xl space-y-3">
                {requests.length === 0 ? (
                  <div className="text-center py-20">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xl font-semibold">No requests sent yet</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Browse mentors and send your first request.</p>
                    <Button onClick={() => setTab("browse")} variant="outline">Browse Mentors</Button>
                  </div>
                ) : requests.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Link to={`/profile/${r.alumni_id}`}>
                          <Avatar src={r.alumni?.avatar_url ?? null} fallback={r.alumni?.full_name ?? "?"} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Link to={`/profile/${r.alumni_id}`} className="font-semibold text-sm hover:text-primary transition-colors">{r.alumni?.full_name}</Link>
                            <Badge variant={STATUS_VARIANT[r.status] ?? "outline"} className="capitalize shrink-0">{r.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {[r.alumni?.current_job_title, r.alumni?.current_company].filter(Boolean).join(" @ ")}
                          </p>
                          <p className="text-sm bg-muted/50 rounded-lg px-3 py-2 line-clamp-2">{r.message}</p>
                          {r.scheduled_at && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                              <Calendar className="h-3.5 w-3.5" />
                              Session: {new Date(r.scheduled_at).toLocaleString()}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />Sent {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Incoming Requests (alumni) */}
            {tab === "incoming" && (
              <div className="max-w-2xl space-y-3">
                {incoming.length === 0 ? (
                  <div className="text-center py-20">
                    <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xl font-semibold">No incoming requests</p>
                    <p className="text-sm text-muted-foreground mt-1">Make sure your profile is public and verified.</p>
                  </div>
                ) : incoming.map(r => (
                  <Card key={r.id} className={r.status === "pending" ? "border-primary/20 bg-primary/5" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Link to={`/profile/${r.student_id}`}>
                          <Avatar src={r.student?.avatar_url ?? null} fallback={r.student?.full_name ?? "?"} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Link to={`/profile/${r.student_id}`} className="font-semibold text-sm hover:text-primary">{r.student?.full_name}</Link>
                            <Badge variant={STATUS_VARIANT[r.status] ?? "outline"} className="capitalize shrink-0">{r.status}</Badge>
                          </div>
                          {r.student?.current_job_title && (
                            <p className="text-xs text-muted-foreground mb-2">{r.student.current_job_title}</p>
                          )}
                          <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">{r.message}</p>
                          {r.scheduled_at && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Scheduled: {new Date(r.scheduled_at).toLocaleString()}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>

                          {r.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => { setScheduleTarget(r); setScheduleOpen(true); }}>
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />Accept & Schedule
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                                onClick={() => updateStatus(r.id, "rejected")}>
                                <X className="h-3.5 w-3.5 mr-1" />Decline
                              </Button>
                            </div>
                          )}
                          {r.status === "accepted" && (
                            <Button size="sm" variant="outline" className="mt-2"
                              onClick={() => updateStatus(r.id, "completed")}>
                              <Check className="h-3.5 w-3.5 mr-1.5" />Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <RequestModal alumni={requestTarget} open={requestOpen} onClose={() => setRequestOpen(false)}
        onSent={() => { fetchData(); toast("Mentorship request sent!", "success"); setTab("my_requests"); }} />
      <ScheduleModal request={scheduleTarget} open={scheduleOpen} onClose={() => setScheduleOpen(false)}
        onSaved={() => { fetchData(); toast("Session scheduled!", "success"); }} />
    </div>
  );
}