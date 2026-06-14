import { useState, useEffect } from "react";
import { Loader2, Save, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Department, Batch } from "@/types/database";
import type { AlumniWithRelations } from "@/hooks/useAlumniDirectory";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AdminEditModalProps {
  alumni: AlumniWithRelations | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  departments: Department[];
  batches: Batch[];
}

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export function AdminEditModal({
  alumni, open, onClose, onSaved, departments, batches,
}: AdminEditModalProps) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "student",
    verification_status: "pending",
    bio: "",
    department_id: "",
    batch_id: "",
    graduation_year: "",
    current_job_title: "",
    current_company: "",
    location: "",
    linkedin_url: "",
    github_url: "",
    website_url: "",
    is_profile_public: true,
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (alumni) {
      setForm({
        full_name: alumni.full_name ?? "",
        email: alumni.email ?? "",
        phone: alumni.phone ?? "",
        role: alumni.role ?? "student",
        verification_status: alumni.verification_status ?? "pending",
        bio: alumni.bio ?? "",
        department_id: alumni.department_id ?? "",
        batch_id: alumni.batch_id ?? "",
        graduation_year: alumni.graduation_year?.toString() ?? "",
        current_job_title: alumni.current_job_title ?? "",
        current_company: alumni.current_company ?? "",
        location: alumni.location ?? "",
        linkedin_url: alumni.linkedin_url ?? "",
        github_url: alumni.github_url ?? "",
        website_url: alumni.website_url ?? "",
        is_profile_public: alumni.is_profile_public ?? true,
        skills: alumni.skills ?? [],
      });
      setSkillInput("");
      setError("");
    }
  }, [alumni]);

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      set("skills", [...form.skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    set("skills", form.skills.filter((s) => s !== skill));

  const handleSave = async () => {
    if (!alumni) return;
    setSaving(true);
    setError("");

    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      role: form.role as "admin" | "alumni" | "student",
      verification_status: form.verification_status as "pending" | "verified" | "rejected",
      bio: form.bio || null,
      department_id: form.department_id || null,
      batch_id: form.batch_id || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      current_job_title: form.current_job_title || null,
      current_company: form.current_company || null,
      location: form.location || null,
      linkedin_url: form.linkedin_url || null,
      github_url: form.github_url || null,
      website_url: form.website_url || null,
      is_profile_public: form.is_profile_public,
      skills: form.skills,
    };

    const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from> & {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: (v: any) => any;
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(payload as any)
      .eq("id", alumni.id);

    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      onSaved();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!alumni || !confirm(`Permanently delete ${alumni.full_name}? This cannot be undone.`)) return;
    setSaving(true);
    // Deleting from auth.users cascades to profiles via FK
    const { error } = await supabase.auth.admin.deleteUser(alumni.id);
    setSaving(false);
    if (error) {
      // Fallback: soft delete by marking profile
    // Fallback: hide profile if admin delete fails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any).update({ is_profile_public: false }).eq("id", alumni.id);
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Edit Alumni Profile</DialogTitle>
          <DialogDescription>
            Modify {alumni?.full_name ?? "this member"}&apos;s profile as admin.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Personal Info ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Personal Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email (read-only)</Label>
                <Input value={form.email} readOnly className="opacity-60 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Short bio..."
                className="min-h-[80px]"
              />
            </div>
          </section>

          {/* ── Role & Status ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Role &amp; Status
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Verification</Label>
                <Select
                  value={form.verification_status}
                  onChange={(e) => set("verification_status", e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Profile Visibility</Label>
                <Select
                  value={form.is_profile_public ? "true" : "false"}
                  onChange={(e) => set("is_profile_public", e.target.value === "true")}
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </Select>
              </div>
            </div>
          </section>

          {/* ── Academic Info ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Academic Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department_id} onChange={(e) => set("department_id", e.target.value)}>
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch</Label>
                <Select value={form.batch_id} onChange={(e) => set("batch_id", e.target.value)}>
                  <option value="">— None —</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Graduation Year</Label>
                <Select value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)}>
                  <option value="">— None —</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>
              </div>
            </div>
          </section>

          {/* ── Career Info ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Career Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input
                  value={form.current_job_title}
                  onChange={(e) => set("current_job_title", e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={form.current_company}
                  onChange={(e) => set("current_company", e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          </section>

          {/* ── Social Links ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Social Links
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input
                  value={form.linkedin_url}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>GitHub URL</Label>
                <Input
                  value={form.github_url}
                  onChange={(e) => set("github_url", e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Website URL</Label>
                <Input
                  value={form.website_url}
                  onChange={(e) => set("website_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* ── Skills ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Skills
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); }}}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {form.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </div>
          </section>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={saving}
            className="mr-auto"
          >
            Delete User
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
