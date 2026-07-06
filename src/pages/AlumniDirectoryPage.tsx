import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, LayoutGrid, List, ChevronLeft, ChevronRight, 
  MapPin, Briefcase, GraduationCap, ExternalLink, Pencil, Download,
  RefreshCw, Filter, X, SlidersHorizontal, UserCheck, Clock, UserX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { AdminEditModal } from "@/components/alumni/AdminEditModal";
import type { AlumniWithRelations } from "@/hooks/useAlumniDirectory";
import type { Department, Batch } from "@/types/database";

const PAGE_SIZE = 12;
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

type ViewMode = "grid" | "list";

interface Profile {
  id: string; full_name: string; email: string; role: string;
  verification_status: string; avatar_url: string | null;
  current_job_title: string | null; current_company: string | null;
  location: string | null; graduation_year: number | null;
  skills: string[] | null; linkedin_url: string | null;
  github_url: string | null; website_url: string | null;
  bio: string | null; is_profile_public: boolean;
  departments?: { name: string; code: string } | null;
  batches?: { name: string } | null;
}

const VER_COLORS: Record<string, "success" | "warning" | "destructive"> = {
  verified: "success", pending: "warning", rejected: "destructive",
};
const ROLE_COLORS: Record<string, "info" | "default" | "secondary"> = {
  admin: "info", alumni: "default", student: "secondary",
};

// ── Alumni Card (grid view) ──────────────────────────────────────────────────
function AlumniCard({ profile, isAdmin, onEdit, index }: {
  profile: Profile; isAdmin: boolean;
  onEdit: (p: Profile) => void; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Card className="h-full hover:shadow-md transition-all duration-200 group overflow-hidden">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 min-w-0">
              <Avatar src={profile.avatar_url} fallback={profile.full_name} size="lg"
                className="shrink-0 ring-2 ring-background shadow" />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-snug truncate hover:text-primary transition-colors">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  <Badge variant={ROLE_COLORS[profile.role] ?? "outline"} className="text-[10px] py-0 h-4">
                    {profile.role}
                  </Badge>
                  <Badge variant={VER_COLORS[profile.verification_status] ?? "outline"} className="text-[10px] py-0 h-4 capitalize">
                    {profile.verification_status}
                  </Badge>
                </div>
              </div>
            </Link>
            {isAdmin && (
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(profile)} title="Edit profile">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
            {(profile.current_job_title || profile.current_company) && (
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{[profile.current_job_title, profile.current_company].filter(Boolean).join(" @ ")}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
            {(profile.departments?.name || profile.graduation_year) && (
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">
                  {[profile.departments?.name, profile.graduation_year && `Class of ${profile.graduation_year}`].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{profile.bio}</p>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {profile.skills.slice(0, 4).map(s => (
                <Badge key={s} variant="outline" className="text-[10px] py-0 h-4">{s}</Badge>
              ))}
              {profile.skills.length > 4 && (
                <Badge variant="outline" className="text-[10px] py-0 h-4">+{profile.skills.length - 4}</Badge>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-auto flex items-center gap-3 flex-wrap">
            <Link to={`/profile/${profile.id}`}>
              <Button size="sm" variant="outline" className="h-7 text-xs">View Profile</Button>
            </Link>
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                LinkedIn <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Alumni List Row ──────────────────────────────────────────────────────────
function AlumniListRow({ profile, isAdmin, onEdit }: {
  profile: Profile; isAdmin: boolean; onEdit: (p: Profile) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex items-center gap-4 px-4 py-3 rounded-xl border bg-card hover:shadow-sm transition-all group">
      <Link to={`/profile/${profile.id}`}>
        <Avatar src={profile.avatar_url} fallback={profile.full_name} size="md" />
      </Link>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 text-sm">
        <div className="min-w-0">
          <Link to={`/profile/${profile.id}`} className="font-medium hover:text-primary transition-colors truncate block">{profile.full_name}</Link>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
        <p className="hidden sm:block text-muted-foreground truncate self-center">{profile.departments?.name ?? "—"}</p>
        <p className="hidden sm:block text-muted-foreground truncate self-center">
          {[profile.current_job_title, profile.current_company].filter(Boolean).join(" @ ") || "—"}
        </p>
        <div className="hidden sm:flex items-center gap-1 self-center">
          <Badge variant={ROLE_COLORS[profile.role] ?? "outline"} className="text-[10px]">{profile.role}</Badge>
          <Badge variant={VER_COLORS[profile.verification_status] ?? "outline"} className="text-[10px] capitalize">{profile.verification_status}</Badge>
        </div>
      </div>
      {isAdmin && (
        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0"
          onClick={() => onEdit(profile)}>
          Edit
        </Button>
      )}
    </motion.div>
  );
}

// ── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset, departments, batches, isAdmin, totalCount, open, onClose }: {
  filters: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
  onReset: () => void;
  departments: Department[];
  batches: Batch[];
  isAdmin: boolean;
  totalCount: number;
  open: boolean;
  onClose: () => void;
}) {
  const hasFilters = Object.values(filters).some(v => v !== "");

  return (
    <>
      {/* Overlay on mobile */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed lg:static top-0 right-0 h-full lg:h-auto z-40 lg:z-auto
        w-72 lg:w-64 bg-background lg:bg-transparent
        transform transition-transform duration-300 lg:transform-none
        ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        lg:block overflow-y-auto
      `}>
        <div className="rounded-xl border bg-card p-4 shadow-sm m-4 lg:m-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filters
            </div>
            <div className="flex gap-2">
              {hasFilters && (
                <button onClick={onReset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />Clear
                </button>
              )}
              <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "search", label: "Search by Name", placeholder: "John Doe…", type: "text" },
              { key: "location", label: "Location", placeholder: "Dhaka, Bangladesh…", type: "text" },
              { key: "company", label: "Company", placeholder: "Grameenphone…", type: "text" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type={type} className="h-9 text-sm" placeholder={placeholder}
                  value={filters[key]} onChange={e => onChange({ ...filters, [key]: e.target.value })} />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select value={filters.department_id} onChange={e => onChange({ ...filters, department_id: e.target.value })} className="h-9 text-sm">
                <option value="">All departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Batch</Label>
              <Select value={filters.batch_id} onChange={e => onChange({ ...filters, batch_id: e.target.value })} className="h-9 text-sm">
                <option value="">All batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Graduation Year</Label>
              <Select value={filters.graduation_year} onChange={e => onChange({ ...filters, graduation_year: e.target.value })} className="h-9 text-sm">
                <option value="">Any year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>

            {isAdmin && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Select value={filters.role} onChange={e => onChange({ ...filters, role: e.target.value })} className="h-9 text-sm">
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="alumni">Alumni</option>
                    <option value="student">Student</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Verification</Label>
                  <Select value={filters.verification_status} onChange={e => onChange({ ...filters, verification_status: e.target.value })} className="h-9 text-sm">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
            {totalCount.toLocaleString()} member{totalCount !== 1 ? "s" : ""} found
          </div>
        </div>

        {isAdmin && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary space-y-1 mx-4 lg:mx-0 mt-3">
            <p className="font-semibold">Admin Mode</p>
            <p className="text-primary/70">Hover any card → click pencil to edit that member.</p>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AlumniDirectoryPage() {
  const { profile: authProfile } = useAuth();
  const isAdmin = authProfile?.role === "admin";
  const { toasts, toast, dismiss } = useToast();

  const [alumni, setAlumni] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "", department_id: "", batch_id: "",
    graduation_year: "", location: "", company: "",
    verification_status: "", role: "",
  });

  useEffect(() => {
    supabase.from("departments").select("*").order("name")
      .then(({ data }) => { if (data) setDepartments(data as Department[]); });
    supabase.from("batches").select("*").order("start_year", { ascending: false })
      .then(({ data }) => { if (data) setBatches(data as Batch[]); });
  }, []);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = (supabase.from("profiles") as any)
      .select("*, departments(name, code), batches(name)", { count: "exact" })
      .range(from, to)
      .order("full_name");

    if (filters.search)              q = q.ilike("full_name", `%${filters.search}%`);
    if (filters.department_id)       q = q.eq("department_id", filters.department_id);
    if (filters.batch_id)            q = q.eq("batch_id", filters.batch_id);
    if (filters.graduation_year)     q = q.eq("graduation_year", parseInt(filters.graduation_year));
    if (filters.location)            q = q.ilike("location", `%${filters.location}%`);
    if (filters.company)             q = q.ilike("current_company", `%${filters.company}%`);
    if (filters.verification_status) q = q.eq("verification_status", filters.verification_status);
    if (filters.role)                q = q.eq("role", filters.role);
    if (!isAdmin)                    q = q.eq("is_profile_public", true);

    const { data, count } = await q;
    setAlumni(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [filters, page, isAdmin]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const updateFilters = (newFilters: Record<string, string>) => {
    setPage(1);
    setFilters(newFilters as typeof filters);
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ search: "", department_id: "", batch_id: "", graduation_year: "", location: "", company: "", verification_status: "", role: "" });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const verified  = alumni.filter(a => a.verification_status === "verified").length;
  const pending   = alumni.filter(a => a.verification_status === "pending").length;
  const rejected  = alumni.filter(a => a.verification_status === "rejected").length;

  const exportCSV = () => {
    const headers = ["Name","Email","Role","Department","Batch","Year","Job Title","Company","Location","Verification","Skills"];
    const rows = alumni.map(a => [
      a.full_name, a.email, a.role, a.departments?.name ?? "", a.batches?.name ?? "",
      a.graduation_year ?? "", a.current_job_title ?? "", a.current_company ?? "",
      a.location ?? "", a.verification_status, (a.skills ?? []).join("; "),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "alumni-directory.csv"; link.click();
    URL.revokeObjectURL(url);
    toast("CSV exported", "success");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-background">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">Alumni Directory</h1>
                {isAdmin && <Badge variant="info">Admin</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Connect with {totalCount.toLocaleString()} members of our community.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchAlumni}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
                </Button>
              </div>
            )}
          </div>

          {/* Admin stat pills */}
          {isAdmin && (
            <div className="flex flex-wrap gap-3 mt-5">
              {[
                { icon: Users, label: "Total", value: totalCount, cls: "bg-card border" },
                { icon: UserCheck, label: "Verified", value: verified, cls: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
                { icon: Clock, label: "Pending", value: pending, cls: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
                { icon: UserX, label: "Rejected", value: rejected, cls: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
              ].map(({ icon: Icon, label, value, cls }) => (
                <div key={label} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{value}</span>
                  <span className="text-muted-foreground hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="container py-6">
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters}
              departments={departments} batches={batches} isAdmin={isAdmin}
              totalCount={totalCount} open={true} onClose={() => {}} />
          </div>

          {/* Mobile filter drawer */}
          <FilterPanel filters={filters} onChange={updateFilters} onReset={resetFilters}
            departments={departments} batches={batches} isAdmin={isAdmin}
            totalCount={totalCount} open={filterOpen} onClose={() => setFilterOpen(false)} />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setFilterOpen(true)}>
                  <Filter className="h-4 w-4 mr-1.5" />Filters
                </Button>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{alumni.length}</span> of{" "}
                  <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                {[{ mode: "grid" as ViewMode, icon: LayoutGrid }, { mode: "list" as ViewMode, icon: List }].map(({ mode, icon: Icon }) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* List header */}
            {viewMode === "list" && alumni.length > 0 && (
              <div className="hidden sm:grid grid-cols-4 gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Member</span><span>Department</span><span>Career</span><span>Status</span>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2"}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className={`rounded-xl border bg-card animate-pulse ${viewMode === "grid" ? "h-52" : "h-16"}`} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && alumni.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Users className="h-14 w-14 text-muted-foreground/20" />
                <p className="text-xl font-semibold">No members found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                <Button variant="outline" size="sm" onClick={resetFilters}>Clear All Filters</Button>
              </div>
            )}

            {/* Results */}
            {!loading && alumni.length > 0 && (
              <AnimatePresence mode="wait">
                {viewMode === "grid" ? (
                  <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {alumni.map((a, idx) => (
                      <AlumniCard key={a.id} profile={a} isAdmin={isAdmin}
                        onEdit={p => { setEditTarget(p as any); setEditOpen(true); }} index={idx} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-2">
                    {alumni.map(a => (
                      <AlumniListRow key={a.id} profile={a} isAdmin={isAdmin}
                        onEdit={p => { setEditTarget(p as any); setEditOpen(true); }} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${page === pageNum ? "bg-primary text-primary-foreground" : "hover:bg-muted border bg-card"}`}>
                      {pageNum}
                    </button>
                  );
                })}

                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin edit modal */}
      <AdminEditModal
        alumni={editTarget as AlumniWithRelations}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSaved={() => { fetchAlumni(); toast("Profile updated", "success"); }}
        departments={departments}
        batches={batches}
      />
    </div>
  );
}