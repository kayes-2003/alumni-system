import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Users, Calendar, GraduationCap, MessageSquare,
  ArrowRight, ChevronRight, CheckCircle2, Plus, TrendingUp,
  Bell, Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

interface Stats { jobs_posted: number; mentorship_requests: number; events_registered: number; unread_messages: number; }
interface RecentJob { id: string; title: string; company: string; created_at: string; is_active: boolean; _app_count?: number; }
interface MentorReq { id: string; status: string; created_at: string; scheduled_at: string | null; student: { full_name: string; avatar_url: string | null; email: string } | null; }
interface MyEvent { id: string; title: string; start_time: string; checked_in: boolean; }
interface Notification { id: string; title: string; message: string; is_read: boolean; created_at: string; }

const STATUS_V: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  accepted: "success", pending: "warning", rejected: "destructive", completed: "secondary",
};

export default function AlumniDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ jobs_posted: 0, mentorship_requests: 0, events_registered: 0, unread_messages: 0 });
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [mentorReqs, setMentorReqs] = useState<MentorReq[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [jobRes, mrRes, erRes, notifRes, msgRes] = await Promise.all([
      (supabase.from("jobs") as any)
        .select("id,title,company,created_at,is_active")
        .eq("posted_by", user.id).order("created_at", { ascending: false }).limit(5),
      (supabase.from("mentorship_requests") as any)
        .select("id,status,created_at,scheduled_at,student:student_id(full_name,avatar_url,email)")
        .eq("alumni_id", user.id).order("created_at", { ascending: false }).limit(6),
      (supabase.from("event_registrations") as any)
        .select("id,checked_in,events(id,title,start_time)")
        .eq("user_id", user.id).order("registered_at", { ascending: false }).limit(6),
      (supabase.from("notifications") as any)
        .select("id,title,message,is_read,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      (supabase.from("messages") as any)
        .select("id", { count: "exact" }).eq("receiver_id", user.id).eq("is_read", false),
    ]);

    // Get application counts for each job
    const jobData = jobRes.data ?? [];
    const jobIds = jobData.map((j: RecentJob) => j.id);
    let appCounts: Record<string, number> = {};
    if (jobIds.length > 0) {
      const { data: apps } = await (supabase.from("job_applications") as any)
        .select("job_id").in("job_id", jobIds);
      (apps ?? []).forEach((a: any) => { appCounts[a.job_id] = (appCounts[a.job_id] ?? 0) + 1; });
    }

    setJobs(jobData.map((j: RecentJob) => ({ ...j, _app_count: appCounts[j.id] ?? 0 })));
    setMentorReqs(mrRes.data ?? []);
    setMyEvents((erRes.data ?? []).map((r: any) => ({
      id: r.events?.id, title: r.events?.title,
      start_time: r.events?.start_time, checked_in: r.checked_in,
    })));
    setNotifications(notifRes.data ?? []);
    setStats({
      jobs_posted: jobData.length,
      mentorship_requests: (mrRes.data ?? []).filter((r: any) => r.status === "pending").length,
      events_registered: erRes.data?.length ?? 0,
      unread_messages: msgRes.count ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markNotifRead = async (id: string) => {
    await (supabase.from("notifications") as any).update({ is_read: true }).eq("id", id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const statCards = [
    { label: "Active Job Posts", value: jobs.filter(j => j.is_active).length, icon: Briefcase, href: "/careers", color: "text-blue-500" },
    { label: "Pending Mentorship", value: stats.mentorship_requests, icon: GraduationCap, href: "/mentorship", color: "text-purple-500" },
    { label: "Events Registered", value: stats.events_registered, icon: Calendar, href: "/events", color: "text-green-500" },
    { label: "Unread Messages", value: stats.unread_messages, icon: MessageSquare, href: "/messages", color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Profile header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-background">
        <div className="container py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? "?"} size="xl" className="ring-4 ring-background shadow-lg" />
              <div>
                <h1 className="text-xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0]} 👋</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.current_job_title ? `${profile.current_job_title}${profile.current_company ? ` @ ${profile.current_company}` : ""}` : "Alumni"}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={profile?.verification_status === "verified" ? "success" : "warning"} className="text-xs capitalize">
                    {profile?.verification_status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">{profile?.role}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/profile/edit">
                <Button size="sm" variant="outline">Edit Profile</Button>
              </Link>
              <Link to="/careers">
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />Post Job</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={c.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold group-hover:text-primary transition-colors">{loading ? "—" : c.value}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {[
                { to: "/careers", icon: Plus, label: "Post a Job or Internship" },
                { to: "/mentorship", icon: GraduationCap, label: "Review Mentorship Requests" },
                { to: "/events", icon: Calendar, label: "Browse Upcoming Events" },
                { to: "/feed", icon: MessageSquare, label: "Post in Community Feed" },
                { to: "/messages", icon: MessageSquare, label: "Check Direct Messages" },
                { to: "/alumni", icon: Users, label: "Browse Alumni Directory" },
                { to: "/news", icon: Star, label: "Read Latest News" },
                { to: "/membership", icon: Star, label: "View Membership Benefits" },
              ].map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* My Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />My Job Posts</CardTitle>
              <Link to="/careers"><Button size="sm" variant="ghost" className="h-7 text-xs"><Plus className="h-3.5 w-3.5 mr-1" />Post</Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">No jobs posted yet.</p>
                  <Link to="/careers"><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Post First Job</Button></Link>
                </div>
              ) : jobs.map(j => (
                <div key={j.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.company} · {j._app_count} applicant{j._app_count !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge variant={j.is_active ? "success" : "secondary"} className="text-[10px] shrink-0">
                    {j.is_active ? "Active" : "Closed"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mentorship Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />Mentorship Requests</CardTitle>
              <Link to="/mentorship"><Button size="sm" variant="ghost" className="h-7 text-xs">View all<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
              ) : mentorReqs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No requests yet.</p>
              ) : mentorReqs.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                  <Avatar src={r.student?.avatar_url ?? null} fallback={r.student?.full_name ?? "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.student?.full_name}</p>
                    {r.scheduled_at && <p className="text-xs text-primary truncate">📅 {new Date(r.scheduled_at).toLocaleDateString()}</p>}
                  </div>
                  <Badge variant={STATUS_V[r.status] ?? "outline"} className="text-[10px] capitalize shrink-0">{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registered Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />My Registered Events</CardTitle>
              <Link to="/events"><Button size="sm" variant="ghost" className="h-7 text-xs">Browse<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <div className="h-20 rounded-lg bg-muted animate-pulse" />
                : myEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No events registered.</p>
                    <Link to="/events"><Button size="sm" variant="outline">Browse Events</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted transition-colors">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.start_time ? new Date(e.start_time).toLocaleDateString() : ""}</p>
                        </div>
                        {e.checked_in && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Recent Notifications</CardTitle>
              <Link to="/messages"><Button size="sm" variant="ghost" className="h-7 text-xs">All<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
                : notifications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No notifications.</p>
                : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => markNotifRead(n.id)}
                        className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted ${!n.is_read ? "bg-primary/5 border border-primary/20" : ""}`}>
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}