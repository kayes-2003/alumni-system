import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Users, Calendar, GraduationCap, MessageSquare,
  ArrowRight, ChevronRight, CheckCircle2, Bell, BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const APP_STATUS: Record<string, "success" | "info" | "warning" | "destructive"> = {
  accepted: "success", reviewing: "info", submitted: "warning", rejected: "destructive",
};
const MR_STATUS: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  accepted: "success", pending: "warning", rejected: "destructive", completed: "secondary",
};

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ mentors: 0, applications: 0, events: 0, unread: 0 });
  const [applications, setApplications] = useState<any[]>([]);
  const [mentorReqs, setMentorReqs] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [apps, mr, er, notif, msgs] = await Promise.all([
      (supabase.from("job_applications") as any)
        .select("id,status,applied_at,jobs(id,title,company,job_type)")
        .eq("applicant_id", user.id).order("applied_at", { ascending: false }).limit(6),
      (supabase.from("mentorship_requests") as any)
        .select("id,status,created_at,scheduled_at,alumni:alumni_id(full_name,avatar_url,current_job_title,current_company)")
        .eq("student_id", user.id).order("created_at", { ascending: false }).limit(5),
      (supabase.from("event_registrations") as any)
        .select("id,checked_in,events(id,title,start_time,event_type)")
        .eq("user_id", user.id).order("registered_at", { ascending: false }).limit(6),
      (supabase.from("notifications") as any)
        .select("id,title,message,is_read,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      (supabase.from("messages") as any)
        .select("id", { count: "exact" }).eq("receiver_id", user.id).eq("is_read", false),
    ]);

    setApplications(apps.data ?? []);
    setMentorReqs(mr.data ?? []);
    setMyEvents((er.data ?? []).map((r: any) => ({
      id: r.events?.id, title: r.events?.title,
      start_time: r.events?.start_time, event_type: r.events?.event_type,
      checked_in: r.checked_in,
    })));
    setNotifications(notif.data ?? []);
    setStats({
      mentors: (mr.data ?? []).filter((r: any) => r.status === "accepted").length,
      applications: apps.data?.length ?? 0,
      events: er.data?.length ?? 0,
      unread: msgs.count ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = async (id: string) => {
    await (supabase.from("notifications") as any).update({ is_read: true }).eq("id", id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-gradient-to-r from-primary/5 to-background">
        <div className="container py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? "?"} size="xl" className="ring-4 ring-background shadow-lg" />
              <div>
                <h1 className="text-xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0]} 👋</h1>
                <p className="text-sm text-muted-foreground">Student · Start exploring opportunities</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={profile?.verification_status === "verified" ? "success" : "warning"} className="text-xs capitalize">{profile?.verification_status}</Badge>
                  <Badge variant="secondary" className="text-xs">Student</Badge>
                </div>
              </div>
            </div>
            <Link to="/profile/edit">
              <Button size="sm" variant="outline">Edit Profile</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Mentors", value: stats.mentors, icon: GraduationCap, href: "/mentorship", color: "text-purple-500" },
            { label: "Job Applications", value: stats.applications, icon: Briefcase, href: "/careers", color: "text-blue-500" },
            { label: "Events Registered", value: stats.events, icon: Calendar, href: "/events", color: "text-green-500" },
            { label: "Unread Messages", value: stats.unread, icon: MessageSquare, href: "/messages", color: "text-orange-500" },
          ].map((c, i) => (
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
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Explore</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {[
                { to: "/mentorship", icon: GraduationCap, label: "Find a Mentor" },
                { to: "/careers", icon: Briefcase, label: "Browse Jobs & Internships" },
                { to: "/events", icon: Calendar, label: "Upcoming Events" },
                { to: "/alumni", icon: Users, label: "Alumni Directory" },
                { to: "/feed", icon: MessageSquare, label: "Community Feed" },
                { to: "/messages", icon: MessageSquare, label: "Direct Messages" },
                { to: "/news", icon: Bell, label: "News & Announcements" },
                { to: "/membership", icon: Bell, label: "View Membership Plans" },
              ].map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  <Icon className="h-4 w-4 text-primary shrink-0" />{label}
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />My Applications</CardTitle>
              <Link to="/careers"><Button size="sm" variant="ghost" className="h-7 text-xs">Browse<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
                : applications.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No applications yet.</p>
                    <Link to="/careers"><Button size="sm" variant="outline">Browse Jobs</Button></Link>
                  </div>
                ) : applications.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.jobs?.title ?? "Job"}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.jobs?.company} · {a.jobs?.job_type}</p>
                    </div>
                    <Badge variant={APP_STATUS[a.status] ?? "outline"} className="text-[10px] capitalize shrink-0">{a.status}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Mentorship */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />My Mentors</CardTitle>
              <Link to="/mentorship"><Button size="sm" variant="ghost" className="h-7 text-xs">Find more<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
                : mentorReqs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No mentors yet.</p>
                    <Link to="/mentorship"><Button size="sm" variant="outline">Find a Mentor</Button></Link>
                  </div>
                ) : mentorReqs.map(r => (
                  <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                    <Avatar src={r.alumni?.avatar_url ?? null} fallback={r.alumni?.full_name ?? "?"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.alumni?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.alumni?.current_job_title}</p>
                      {r.scheduled_at && <p className="text-xs text-primary">📅 {new Date(r.scheduled_at).toLocaleDateString()}</p>}
                    </div>
                    <Badge variant={MR_STATUS[r.status] ?? "outline"} className="text-[10px] capitalize shrink-0">{r.status}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />My Events</CardTitle>
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
                          <p className="text-xs text-muted-foreground">{e.event_type} · {e.start_time ? new Date(e.start_time).toLocaleDateString() : ""}</p>
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
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Notifications</CardTitle>
              <Link to="/messages"><Button size="sm" variant="ghost" className="h-7 text-xs">All<ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
                : notifications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No notifications.</p>
                : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
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