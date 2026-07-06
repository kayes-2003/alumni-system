import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users, Briefcase, Calendar, CheckCircle2, Clock, XCircle,
  Plus, Trash2, Pencil, Loader2, Save, Bell, BarChart3,
  GraduationCap, MessageSquare, Newspaper, CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogBody,
} from "@/components/ui/dialog";

type Tab = "overview" | "users" | "departments" | "batches" | "notifications";

interface Profile {
  id: string; full_name: string; email: string; role: string;
  verification_status: string; avatar_url: string | null;
  current_job_title: string | null; current_company: string | null;
  created_at: string;
}
interface Dept { id: string; name: string; code: string; }
interface Batch { id: string; name: string; start_year: number; end_year: number; }

function StatCard({ icon: Icon, label, value, color = "text-primary", href }: {
  icon: React.ElementType; label: string; value: number | string; color?: string; href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold group-hover:text-primary transition-colors">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const { profile: me } = useAuth();
  const { toasts, toast, dismiss } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState({
    total: 0, verified: 0, pending: 0, rejected: 0,
    events: 0, jobs: 0, posts: 0, memberships: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verFilter, setVerFilter] = useState("");

  // Dept CRUD
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [editDept, setEditDept] = useState<Dept | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);

  // Batch CRUD
  const [batchForm, setBatchForm] = useState({ name: "", start_year: "", end_year: "" });
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  // Notification blast
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", target: "all" });
  const [sending, setSending] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [u, e, j, d, b, p, m] = await Promise.all([
      (supabase.from("profiles") as any).select("id,full_name,email,role,verification_status,avatar_url,current_job_title,current_company,created_at").order("created_at", { ascending: false }),
      (supabase.from("events") as any).select("id", { count: "exact" }),
      (supabase.from("jobs") as any).select("id", { count: "exact" }).eq("is_active", true),
      (supabase.from("departments") as any).select("*").order("name"),
      (supabase.from("batches") as any).select("*").order("start_year", { ascending: false }),
      (supabase.from("posts") as any).select("id", { count: "exact" }),
      (supabase.from("memberships") as any).select("id", { count: "exact" }).eq("status", "active"),
    ]);
    const all: Profile[] = u.data ?? [];
    setUsers(all);
    setStats({
      total: all.length,
      verified: all.filter(x => x.verification_status === "verified").length,
      pending: all.filter(x => x.verification_status === "pending").length,
      rejected: all.filter(x => x.verification_status === "rejected").length,
      events: e.count ?? 0, jobs: j.count ?? 0,
      posts: p.count ?? 0, memberships: m.count ?? 0,
    });
    setDepts(d.data ?? []);
    setBatches(b.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setVerification = async (id: string, status: string) => {
    await (supabase.from("profiles") as any).update({ verification_status: status }).eq("id", id);
    setUsers(p => p.map(u => u.id === id ? { ...u, verification_status: status } : u));
    toast(`User ${status}`, "success");
  };

  const setRole = async (id: string, role: string) => {
    await (supabase.from("profiles") as any).update({ role }).eq("id", id);
    setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
    toast("Role updated", "success");
  };

  const saveDept = async () => {
    if (!deptForm.name || !deptForm.code) { toast("Name and code required", "error"); return; }
    const q = supabase.from("departments") as any;
    const { error } = editDept ? await q.update(deptForm).eq("id", editDept.id) : await q.insert(deptForm);
    if (error) { toast(error.message, "error"); return; }
    toast(editDept ? "Updated" : "Created", "success");
    setDeptOpen(false); fetchAll();
  };

  const deleteDept = async (id: string) => {
    if (!confirm("Delete department?")) return;
    await (supabase.from("departments") as any).delete().eq("id", id);
    toast("Deleted", "success"); fetchAll();
  };

  const saveBatch = async () => {
    if (!batchForm.name || !batchForm.start_year || !batchForm.end_year) { toast("All fields required", "error"); return; }
    const payload = { name: batchForm.name, start_year: parseInt(batchForm.start_year), end_year: parseInt(batchForm.end_year) };
    const q = supabase.from("batches") as any;
    const { error } = editBatch ? await q.update(payload).eq("id", editBatch.id) : await q.insert(payload);
    if (error) { toast(error.message, "error"); return; }
    toast(editBatch ? "Updated" : "Created", "success");
    setBatchOpen(false); fetchAll();
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Delete batch?")) return;
    await (supabase.from("batches") as any).delete().eq("id", id);
    toast("Deleted", "success"); fetchAll();
  };

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { toast("Title and message required", "error"); return; }
    setSending(true);
    const targets = notifForm.target === "all" ? users
      : users.filter(u => u.role === notifForm.target);
    const inserts = targets.map(u => ({ user_id: u.id, title: notifForm.title, message: notifForm.message }));
    const { error } = await (supabase.from("notifications") as any).insert(inserts);
    setSending(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`Sent to ${inserts.length} users`, "success");
    setNotifOpen(false);
    setNotifForm({ title: "", message: "", target: "all" });
  };

  const filteredUsers = users.filter(u => {
    const s = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const r = !roleFilter || u.role === roleFilter;
    const v = !verFilter || u.verification_status === verFilter;
    return s && r && v;
  });

  const VER_V: Record<string, string> = { verified: "success", pending: "warning", rejected: "destructive" };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users (${stats.total})` },
    { id: "departments", label: "Departments" },
    { id: "batches", label: "Batches" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="border-b bg-background">
        <div className="container py-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {me?.full_name}</p>
            </div>
            <Button size="sm" onClick={() => setNotifOpen(true)}>
              <Bell className="h-4 w-4 mr-1.5" />Send Notification
            </Button>
          </div>
          <div className="flex gap-1 border-b -mb-px overflow-x-auto">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {label}
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
            {/* Overview */}
            {tab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Users" value={stats.total} href="/alumni" />
                  <StatCard icon={CheckCircle2} label="Verified" value={stats.verified} color="text-green-500" />
                  <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-yellow-500" />
                  <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="text-red-500" />
                  <StatCard icon={Calendar} label="Events" value={stats.events} href="/events" />
                  <StatCard icon={Briefcase} label="Active Jobs" value={stats.jobs} href="/careers" />
                  <StatCard icon={MessageSquare} label="Posts" value={stats.posts} href="/feed" />
                  <StatCard icon={CreditCard} label="Memberships" value={stats.memberships} href="/membership" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent users */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Recent Members</CardTitle>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setTab("users")}>View all</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {users.slice(0, 6).map(u => (
                        <div key={u.id} className="flex items-center gap-3">
                          <Avatar src={u.avatar_url} fallback={u.full_name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <Badge variant={(VER_V[u.verification_status] ?? "outline") as any} className="text-[10px] capitalize shrink-0">{u.verification_status}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick actions */}
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Manage Platform</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5">
                      {[
                        { href: "/events", icon: Calendar, label: "Manage Events", desc: `${stats.events} events` },
                        { href: "/careers", icon: Briefcase, label: "Manage Jobs", desc: `${stats.jobs} active` },
                        { href: "/news", icon: Newspaper, label: "Manage News", desc: "Articles & announcements" },
                        { href: "/alumni", icon: Users, label: "Alumni Directory", desc: `${stats.total} members` },
                        { href: "/contact", icon: MessageSquare, label: "Contact Inbox", desc: "View messages" },
                        { href: "/mentorship", icon: GraduationCap, label: "Mentorship Requests", desc: "Review & manage" },
                      ].map(({ href, icon: Icon, label, desc }) => (
                        <Link key={href} to={href}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Users tab */}
            {tab === "users" && (
              <div>
                <div className="flex flex-wrap gap-3 mb-5">
                  <Input className="h-9 w-56" placeholder="Search name or email…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                  <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 w-32">
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="alumni">Alumni</option>
                    <option value="student">Student</option>
                  </Select>
                  <Select value={verFilter} onChange={e => setVerFilter(e.target.value)} className="h-9 w-36">
                    <option value="">All status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                  <p className="self-center text-sm text-muted-foreground">{filteredUsers.length} users</p>
                </div>

                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[auto,1fr,140px,160px,80px] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Member</span><span></span><span>Role</span><span>Verification</span><span>Action</span>
                  </div>
                  <div className="divide-y">
                    {filteredUsers.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground text-sm">No users found.</p>
                    )}
                    {filteredUsers.map(u => (
                      <div key={u.id} className="grid grid-cols-1 sm:grid-cols-[auto,1fr,140px,160px,80px] gap-3 sm:gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                        <Avatar src={u.avatar_url} fallback={u.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          {u.current_job_title && <p className="text-xs text-muted-foreground truncate">{u.current_job_title}</p>}
                        </div>
                        <Select value={u.role} onChange={e => setRole(u.id, e.target.value)} className="h-7 text-xs">
                          <option value="admin">Admin</option>
                          <option value="alumni">Alumni</option>
                          <option value="student">Student</option>
                        </Select>
                        <Select value={u.verification_status} onChange={e => setVerification(u.id, e.target.value)} className="h-7 text-xs">
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </Select>
                        <Link to={`/profile/${u.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs w-full">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Departments */}
            {tab === "departments" && (
              <div className="max-w-xl">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-semibold">Departments ({depts.length})</h2>
                  <Button size="sm" onClick={() => { setEditDept(null); setDeptForm({ name: "", code: "" }); setDeptOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                </div>
                <div className="rounded-xl border bg-card divide-y">
                  {depts.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No departments.</p>}
                  {depts.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-4 py-3">
                      <div><p className="font-medium text-sm">{d.name}</p><p className="text-xs text-muted-foreground font-mono">{d.code}</p></div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { setEditDept(d); setDeptForm({ name: d.name, code: d.code }); setDeptOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDept(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batches */}
            {tab === "batches" && (
              <div className="max-w-xl">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-semibold">Batches ({batches.length})</h2>
                  <Button size="sm" onClick={() => { setEditBatch(null); setBatchForm({ name: "", start_year: "", end_year: "" }); setBatchOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                </div>
                <div className="rounded-xl border bg-card divide-y">
                  {batches.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No batches.</p>}
                  {batches.map(b => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3">
                      <div><p className="font-medium text-sm">{b.name}</p><p className="text-xs text-muted-foreground">{b.start_year} – {b.end_year}</p></div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { setEditBatch(b); setBatchForm({ name: b.name, start_year: b.start_year.toString(), end_year: b.end_year.toString() }); setBatchOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteBatch(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Department modal */}
      <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
        <DialogContent className="max-w-sm" onClose={() => setDeptOpen(false)}>
          <DialogHeader><DialogTitle>{editDept ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} placeholder="Computer Science & Engineering" /></div>
            <div className="space-y-1.5"><Label>Code *</Label><Input value={deptForm.code} onChange={e => setDeptForm(p => ({ ...p, code: e.target.value }))} placeholder="CSE" /></div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptOpen(false)}>Cancel</Button>
            <Button onClick={saveDept}><Save className="h-4 w-4 mr-1.5" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch modal */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-sm" onClose={() => setBatchOpen(false)}>
          <DialogHeader><DialogTitle>{editBatch ? "Edit" : "Add"} Batch</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5"><Label>Batch Name *</Label><Input value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} placeholder="Batch 2020-2024" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Year *</Label><Input type="number" value={batchForm.start_year} onChange={e => setBatchForm(p => ({ ...p, start_year: e.target.value }))} placeholder="2020" /></div>
              <div className="space-y-1.5"><Label>End Year *</Label><Input type="number" value={batchForm.end_year} onChange={e => setBatchForm(p => ({ ...p, end_year: e.target.value }))} placeholder="2024" /></div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
            <Button onClick={saveBatch}><Save className="h-4 w-4 mr-1.5" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification blast modal */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md" onClose={() => setNotifOpen(false)}>
          <DialogHeader>
            <DialogTitle>Send Notification Blast</DialogTitle>
            <DialogDescription>Broadcast a message to selected user groups.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Select value={notifForm.target} onChange={e => setNotifForm(p => ({ ...p, target: e.target.value }))}>
                <option value="all">All Users ({users.length})</option>
                <option value="alumni">Alumni only ({users.filter(u => u.role === "alumni").length})</option>
                <option value="student">Students only ({users.filter(u => u.role === "student").length})</option>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Title *</Label><Input value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} placeholder="Important Announcement" /></div>
            <div className="space-y-1.5"><Label>Message *</Label><Textarea value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} placeholder="Your notification message…" className="min-h-[100px]" /></div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
            <Button onClick={sendNotification} disabled={sending || !notifForm.title || !notifForm.message}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Bell className="h-4 w-4 mr-1.5" />Send to {notifForm.target === "all" ? users.length : users.filter(u => u.role === notifForm.target).length} users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}