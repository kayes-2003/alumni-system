import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, MapPin, Plus, Pencil, Trash2, Search, Loader2, Save,
  ExternalLink, Clock, Building2, FileText, Users, 
  DollarSign, CheckCircle2, 
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
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";

const JOB_TYPES = ["full-time","part-time","internship","contract","remote","freelance"];
const JOB_CATEGORIES = ["Engineering","Design","Marketing","Finance","HR","Operations","Legal","Healthcare","Education","Research","Management","Sales","Customer Support","Data Science","Other"];
const EXPERIENCE_LEVELS = ["Entry Level","1-2 years","3-5 years","5-10 years","10+ years","Not specified"];

const TYPE_COLORS: Record<string,string> = {
  "full-time":"default","part-time":"secondary","internship":"info",
  "contract":"warning","remote":"success","freelance":"outline",
};

interface Job {
  id: string; posted_by: string; title: string; company: string; location: string|null;
  job_type: string; description: string; requirements: string|null; apply_url: string|null;
  is_active: boolean; created_at: string;
  category?: string; salary_range?: string; experience_level?: string;
  company_logo?: string; deadline?: string;
  profiles?: { full_name: string; avatar_url: string|null }|null;
  _applied?: boolean; _application_count?: number;
}

const EMPTY_JOB = {
  title:"", company:"", location:"", job_type:"full-time", category:"Engineering",
  description:"", requirements:"", apply_url:"", is_active:true, salary_range:"",
  experience_level:"Entry Level", deadline:"",
};

// ── Job Form Modal ───────────────────────────────────────────────────────────
function JobFormModal({ job, open, onClose, onSaved, userId }:{
  job: Job|null; open: boolean; onClose: ()=>void; onSaved: ()=>void; userId: string;
}) {
  const [form, setForm] = useState({...EMPTY_JOB});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (job) setForm({
      title: job.title, company: job.company, location: job.location ?? "",
      job_type: job.job_type, category: job.category ?? "Engineering",
      description: job.description, requirements: job.requirements ?? "",
      apply_url: job.apply_url ?? "", is_active: job.is_active,
      salary_range: job.salary_range ?? "", experience_level: job.experience_level ?? "Entry Level",
      deadline: job.deadline ? job.deadline.slice(0,10) : "",
    });
    else setForm({...EMPTY_JOB});
    setError("");
  }, [job, open]);

  const set = (k: string, v: unknown) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.title || !form.company || !form.description) {
      setError("Title, company, and description are required."); return;
    }
    setSaving(true);
    const payload = {
      title: form.title, company: form.company, location: form.location||null,
      job_type: form.job_type, description: form.description,
      requirements: form.requirements||null, apply_url: form.apply_url||null,
      is_active: form.is_active, posted_by: userId,
      category: form.category, salary_range: form.salary_range||null,
      experience_level: form.experience_level,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    const q = supabase.from("jobs") as any;
    const { error } = job ? await q.update(payload).eq("id", job.id) : await q.insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Post New Job"}</DialogTitle>
          <DialogDescription>Fill in job details. All active jobs are visible to members.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2"><Label>Job Title *</Label><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Senior Software Engineer"/></div>
            <div className="space-y-1.5"><Label>Company *</Label><Input value={form.company} onChange={e=>set("company",e.target.value)} placeholder="Grameenphone"/></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Dhaka, Bangladesh / Remote"/></div>
            <div className="space-y-1.5"><Label>Job Type</Label>
              <Select value={form.job_type} onChange={e=>set("job_type",e.target.value)}>
                {JOB_TYPES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                {JOB_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Experience Level</Label>
              <Select value={form.experience_level} onChange={e=>set("experience_level",e.target.value)}>
                {EXPERIENCE_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Salary Range</Label><Input value={form.salary_range} onChange={e=>set("salary_range",e.target.value)} placeholder="৳50,000 – ৳80,000/month"/></div>
            <div className="space-y-1.5"><Label>Application Deadline</Label><Input type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)}/></div>
            <div className="space-y-1.5"><Label>Apply URL</Label><Input value={form.apply_url} onChange={e=>set("apply_url",e.target.value)} placeholder="https://careers.example.com/…"/></div>
          </div>

          <div className="space-y-1.5"><Label>Job Description *</Label>
            <Textarea value={form.description} onChange={e=>set("description",e.target.value)} className="min-h-[120px]"
              placeholder="Describe the role, responsibilities, company culture…"/>
          </div>
          <div className="space-y-1.5"><Label>Requirements</Label>
            <Textarea value={form.requirements} onChange={e=>set("requirements",e.target.value)} className="min-h-[100px]"
              placeholder="• Bachelor's degree in CSE or related field&#10;• 3+ years of experience…"/>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={()=>set("is_active",!form.is_active)}
              className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${form.is_active?"bg-primary":"bg-muted-foreground/30"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active?"translate-x-4":"translate-x-0.5"}`}/>
            </button>
            <Label>{form.is_active ? "Active — visible to all members" : "Draft — hidden from members"}</Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<Save className="h-4 w-4 mr-2"/>}
            {job?"Save Changes":"Post Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Job Detail Modal ─────────────────────────────────────────────────────────
function JobDetailModal({ job, open, onClose, onApply, user, isAdmin, onEdit, onDelete }:{
  job: Job|null; open: boolean; onClose: ()=>void; onApply: ()=>void;
  user: any; isAdmin: boolean; onEdit: ()=>void; onDelete: ()=>void;
}) {
  if (!job) return null;
  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;
  const canApply = user && job.is_active && !job._applied && !isExpired;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogBody className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-7 w-7 text-primary"/>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{job.title}</h2>
              <p className="text-muted-foreground">{job.company}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={(TYPE_COLORS[job.job_type]??"outline") as any} className="capitalize">{job.job_type}</Badge>
                {job.category && <Badge variant="outline">{job.category}</Badge>}
                {!job.is_active && <Badge variant="secondary">Inactive</Badge>}
                {job._applied && <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1"/>Applied</Badge>}
                {isExpired && <Badge variant="destructive">Deadline Passed</Badge>}
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {job.location && <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4 text-primary shrink-0"/>{job.location}</div>}
            {job.experience_level && <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4 text-primary shrink-0"/>{job.experience_level}</div>}
            {job.salary_range && <div className="flex items-center gap-1.5 text-muted-foreground"><DollarSign className="h-4 w-4 text-primary shrink-0"/>{job.salary_range}</div>}
            {job.deadline && <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4 text-primary shrink-0"/>Deadline: {new Date(job.deadline).toLocaleDateString()}</div>}
            <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4 text-primary shrink-0"/>Posted {new Date(job.created_at).toLocaleDateString()}</div>
            {job.profiles?.full_name && <div className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-4 w-4 text-primary shrink-0"/>By {job.profiles.full_name}</div>}
          </div>

          {/* Description */}
          <div><h3 className="font-semibold mb-2">Job Description</h3><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p></div>

          {/* Requirements */}
          {job.requirements && <div><h3 className="font-semibold mb-2">Requirements</h3><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.requirements}</p></div>}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {job.apply_url && <a href={job.apply_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1.5"/>Apply via Website</Button></a>}
            {canApply && <Button size="sm" onClick={onApply}><CheckCircle2 className="h-3.5 w-3.5 mr-1.5"/>Apply Now</Button>}
            {(isAdmin || job.posted_by === user?.id) && <>
              <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-1.5"/>Edit</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5"/></Button>
            </>}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ job, open, onClose, userId, onApplied }:{
  job: Job|null; open: boolean; onClose: ()=>void; userId: string; onApplied: ()=>void;
}) {
  const [cover, setCover] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!job) return;
    setSaving(true); setError("");
    const { error } = await (supabase.from("job_applications") as any)
      .insert({ job_id: job.id, applicant_id: userId, cover_letter: cover||null });
    setSaving(false);
    if (error) { setError(error.message); return; }
    onApplied(); onClose(); setCover("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>at {job?.company}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}
          <div className="space-y-1.5">
            <Label>Cover Letter (optional)</Label>
            <Textarea value={cover} onChange={e=>setCover(e.target.value)} className="min-h-[140px]"
              placeholder="Introduce yourself and explain why you're a great fit for this role…"/>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Applicants Modal ─────────────────────────────────────────────────────────
function ApplicantsModal({ job, open, onClose }:{ job: Job|null; open: boolean; onClose: ()=>void }) {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast, toasts, dismiss } = useToast();

  useEffect(() => {
    if (!job || !open) return;
    setLoading(true);
    (supabase.from("job_applications") as any)
      .select("*, profiles(full_name, email, avatar_url, current_job_title, graduation_year)")
      .eq("job_id", job.id).order("applied_at", { ascending: false })
      .then(({ data }: any) => { setApps(data ?? []); setLoading(false); });
  }, [job, open]);

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("job_applications") as any).update({ status }).eq("id", id);
    setApps(p => p.map(a => a.id === id ? {...a, status} : a));
    toast(`Marked as ${status}`, "success");
  };

  const exportCSV = () => {
    const rows = [["Name","Email","Status","Applied Date","Cover Letter"],
      ...apps.map(a=>[a.profiles?.full_name,a.profiles?.email,a.status,new Date(a.applied_at).toLocaleDateString(),a.cover_letter??""])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href=url; link.download=`applicants-${job?.title}.csv`; link.click();
  };

  const STATUS_V: Record<string,string> = { submitted:"info", reviewing:"warning", accepted:"success", rejected:"destructive" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Applicants — {job?.title}</DialogTitle>
          <DialogDescription>{apps.length} applications · {apps.filter(a=>a.status==="accepted").length} accepted</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <ToastContainer toasts={toasts} dismiss={dismiss}/>
          <Button size="sm" variant="outline" className="w-full" onClick={exportCSV}>Export CSV</Button>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {apps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No applications yet.</p>}
              {apps.map(a => (
                <div key={a.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={a.profiles?.avatar_url} fallback={a.profiles?.full_name??"?"} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.profiles?.email}</p>
                    </div>
                    <Badge variant={(STATUS_V[a.status]??"outline") as any} className="capitalize shrink-0">{a.status}</Badge>
                  </div>
                  {a.cover_letter && <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-2">{a.cover_letter}</p>}
                  <div className="flex gap-1 flex-wrap">
                    {["reviewing","accepted","rejected"].map(s => (
                      <Button key={s} size="sm" variant={a.status===s?"default":"outline"} className="h-6 text-xs capitalize"
                        onClick={()=>updateStatus(a.id,s)}>{s}</Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CareersPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const canPost = profile?.role === "alumni" || isAdmin;
  const { toasts, toast, dismiss } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Job|null>(null);
  const [detailTarget, setDetailTarget] = useState<Job|null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<Job|null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applicantsTarget, setApplicantsTarget] = useState<Job|null>(null);
  const [applicantsOpen, setApplicantsOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("jobs") as any)
      .select("*, profiles(full_name, avatar_url)").order("created_at",{ascending:false});
    if (!data) { setLoading(false); return; }
    if (user) {
      const { data: myApps } = await (supabase.from("job_applications") as any)
        .select("job_id").eq("applicant_id", user.id);
      const applied = new Set((myApps??[]).map((a:any)=>a.job_id));
      setJobs(data.map((j:Job)=>({...j,_applied:applied.has(j.id)})));
    } else setJobs(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    await (supabase.from("jobs") as any).delete().eq("id", id);
    toast("Job deleted","success"); fetchJobs();
    setDetailOpen(false);
  };

  const filtered = jobs.filter(j => {
    const visible = isAdmin || j.is_active;
    const s = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()) || (j.description??"").toLowerCase().includes(search.toLowerCase());
    const t = !typeFilter || j.job_type === typeFilter;
    const c = !categoryFilter || j.category === categoryFilter;
    const l = !locationFilter || (j.location??"").toLowerCase().includes(locationFilter.toLowerCase());
    return visible && s && t && c && l;
  });

  const activeJobs = filtered.filter(j => j.is_active).length;

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss}/>

      {/* Header */}
      <div className="border-b bg-background">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary"/>Career Portal {isAdmin&&<Badge variant="info">Admin</Badge>}</h1>
              <p className="text-sm text-muted-foreground mt-1">{activeJobs} active opportunities from alumni and employers.</p>
            </div>
            {canPost && <Button onClick={()=>{setEditTarget(null);setFormOpen(true);}}><Plus className="h-4 w-4 mr-2"/>Post Job</Button>}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><Input className="pl-8 h-9 w-56" placeholder="Search jobs, companies…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="h-9 w-36">
              <option value="">All types</option>
              {JOB_TYPES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
            </Select>
            <Select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="h-9 w-40">
              <option value="">All categories</option>
              {JOB_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </Select>
            <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><Input className="pl-8 h-9 w-44" placeholder="Location…" value={locationFilter} onChange={e=>setLocationFilter(e.target.value)}/></div>
            {(search||typeFilter||categoryFilter||locationFilter) && (
              <Button size="sm" variant="ghost" onClick={()=>{setSearch("");setTypeFilter("");setCategoryFilter("");setLocationFilter("");}}>Clear filters</Button>
            )}
          </div>
        </div>
      </div>

      {/* Job list */}
      <div className="container py-8">
        {loading ? (
          <div className="space-y-4">{[...Array(5)].map((_,i)=><div key={i} className="h-36 rounded-xl border bg-card animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Briefcase className="h-16 w-16 text-muted-foreground/20"/>
            <p className="text-xl font-semibold">No jobs found</p>
            <p className="text-sm text-muted-foreground">{canPost?"Post the first opportunity above.":"Check back soon for new opportunities."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job, idx) => {
              const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;
              return (
                <motion.div key={job.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}>
                  <Card className={`hover:shadow-md transition-all group cursor-pointer ${!job.is_active?"opacity-60 border-dashed":""}`}
                    onClick={()=>{setDetailTarget(job);setDetailOpen(true);}}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                          <Building2 className="h-6 w-6 text-primary"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                            <div>
                              <h3 className="font-semibold text-base">{job.title}</h3>
                              <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={(TYPE_COLORS[job.job_type]??"outline") as any} className="capitalize">{job.job_type}</Badge>
                              {job.category && <Badge variant="outline" className="text-xs">{job.category}</Badge>}
                              {!job.is_active && <Badge variant="secondary">Inactive</Badge>}
                              {isExpired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                              {job._applied && <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1"/>Applied</Badge>}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{job.location}</span>}
                            {job.experience_level && <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{job.experience_level}</span>}
                            {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3"/>{job.salary_range}</span>}
                            {job.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>

                          <div className="flex gap-2 flex-wrap" onClick={e=>e.stopPropagation()}>
                            {job.apply_url && <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5 mr-1.5"/>Apply Externally</Button>
                            </a>}
                            {user && job.is_active && !job._applied && !isExpired && profile?.role === "student" && (
                              <Button size="sm" onClick={()=>{setApplyTarget(job);setApplyOpen(true);}}>Apply Now</Button>
                            )}
                            {(isAdmin || job.posted_by === user?.id) && <>
                              <Button size="sm" variant="outline" onClick={()=>{setApplicantsTarget(job);setApplicantsOpen(true);}}>
                                <Users className="h-3.5 w-3.5 mr-1.5"/>Applicants
                              </Button>
                              <Button size="sm" variant="outline" onClick={()=>{setEditTarget(job);setFormOpen(true);}}><Pencil className="h-3.5 w-3.5"/></Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={()=>deleteJob(job.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                            </>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <JobFormModal job={editTarget} open={formOpen} onClose={()=>setFormOpen(false)}
        onSaved={()=>{fetchJobs();toast(editTarget?"Job updated!":"Job posted!","success");}} userId={user?.id??""}/>
      <JobDetailModal job={detailTarget} open={detailOpen} onClose={()=>setDetailOpen(false)}
        onApply={()=>{setApplyTarget(detailTarget);setApplyOpen(true);setDetailOpen(false);}}
        user={user} isAdmin={isAdmin}
        onEdit={()=>{setEditTarget(detailTarget);setFormOpen(true);setDetailOpen(false);}}
        onDelete={()=>detailTarget&&deleteJob(detailTarget.id)}/>
      <ApplyModal job={applyTarget} open={applyOpen} onClose={()=>setApplyOpen(false)}
        userId={user?.id??""} onApplied={()=>{fetchJobs();toast("Application submitted!","success");}}/>
      <ApplicantsModal job={applicantsTarget} open={applicantsOpen} onClose={()=>setApplicantsOpen(false)}/>
    </div>
  );
}