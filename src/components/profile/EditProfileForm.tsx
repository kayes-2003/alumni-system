import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Eye, EyeOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import type { Profile, Department, Batch } from "@/types/database";
import type { ProfileUpdatePayload } from "@/hooks/useProfile";

const schema = z.object({
  full_name:         z.string().min(2, "Name must be at least 2 characters"),
  phone:             z.string().optional(),
  bio:               z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  department_id:     z.string().optional(),
  batch_id:          z.string().optional(),
  graduation_year:   z.string().optional(),
  current_job_title: z.string().optional(),
  current_company:   z.string().optional(),
  location:          z.string().optional(),
  linkedin_url:      z.string().url("Enter a valid URL").optional().or(z.literal("")),
  github_url:        z.string().url("Enter a valid URL").optional().or(z.literal("")),
  website_url:       z.string().url("Enter a valid URL").optional().or(z.literal("")),
  is_profile_public: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

interface EditProfileFormProps {
  profile: Profile;
  departments: Department[];
  batches: Batch[];
  saving: boolean;
  onSave: (payload: ProfileUpdatePayload) => Promise<boolean>;
}

export function EditProfileForm({
  profile, departments, batches, saving, onSave,
}: EditProfileFormProps) {
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name:         profile.full_name ?? "",
      phone:             profile.phone ?? "",
      bio:               profile.bio ?? "",
      department_id:     profile.department_id ?? "",
      batch_id:          profile.batch_id ?? "",
      graduation_year:   profile.graduation_year?.toString() ?? "",
      current_job_title: profile.current_job_title ?? "",
      current_company:   profile.current_company ?? "",
      location:          profile.location ?? "",
      linkedin_url:      profile.linkedin_url ?? "",
      github_url:        profile.github_url ?? "",
      website_url:       profile.website_url ?? "",
      is_profile_public: profile.is_profile_public,
    },
  });

  // Reset when profile refreshes
  useEffect(() => {
    reset({
      full_name:         profile.full_name ?? "",
      phone:             profile.phone ?? "",
      bio:               profile.bio ?? "",
      department_id:     profile.department_id ?? "",
      batch_id:          profile.batch_id ?? "",
      graduation_year:   profile.graduation_year?.toString() ?? "",
      current_job_title: profile.current_job_title ?? "",
      current_company:   profile.current_company ?? "",
      location:          profile.location ?? "",
      linkedin_url:      profile.linkedin_url ?? "",
      github_url:        profile.github_url ?? "",
      website_url:       profile.website_url ?? "",
      is_profile_public: profile.is_profile_public,
    });
    setSkills(profile.skills ?? []);
  }, [profile, reset]);

  const isPublic = watch("is_profile_public");
  const bioValue = watch("bio") ?? "";

  const onSubmit = async (data: FormValues) => {
    const ok = await onSave({
      full_name:         data.full_name,
      phone:             data.phone || null,
      bio:               data.bio || null,
      department_id:     data.department_id || null,
      batch_id:          data.batch_id || null,
      graduation_year:   data.graduation_year ? parseInt(data.graduation_year) : null,
      current_job_title: data.current_job_title || null,
      current_company:   data.current_company || null,
      location:          data.location || null,
      linkedin_url:      data.linkedin_url || null,
      github_url:        data.github_url || null,
      website_url:       data.website_url || null,
      is_profile_public: data.is_profile_public,
      skills,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Personal Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Your name, contact details, and about you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1 555 000 0000" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, Country" {...register("location")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className={`text-xs ${bioValue.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>
                {bioValue.length}/500
              </span>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell the community about yourself…"
              className="min-h-[100px]"
              {...register("bio")}
            />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Academic Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academic Information</CardTitle>
          <CardDescription>Your department, batch and graduation year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select {...register("department_id")}>
                <option value="">— Select —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Select {...register("batch_id")}>
                <option value="">— Select —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Graduation Year</Label>
              <Select {...register("graduation_year")}>
                <option value="">— Select —</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Career ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Career</CardTitle>
          <CardDescription>Your current position and employer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_job_title">Job Title</Label>
              <Input id="current_job_title" placeholder="Software Engineer" {...register("current_job_title")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_company">Company</Label>
              <Input id="current_company" placeholder="Acme Corp" {...register("current_company")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Skills ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
          <CardDescription>Add up to 20 skills that describe your expertise.</CardDescription>
        </CardHeader>
        <CardContent>
          <SkillsEditor skills={skills} onChange={setSkills} />
        </CardContent>
      </Card>

      {/* ── Social Links ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social &amp; Links</CardTitle>
          <CardDescription>Help people find you across the web.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
            { id: "github_url",   label: "GitHub",   placeholder: "https://github.com/…" },
            { id: "website_url",  label: "Website",  placeholder: "https://yoursite.com" },
          ].map(({ id, label, placeholder }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id} className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Label>
              <Input
                id={id}
                placeholder={placeholder}
                {...register(id as keyof FormValues)}
              />
              {errors[id as keyof typeof errors] && (
                <p className="text-xs text-destructive">
                  {(errors[id as keyof typeof errors] as { message?: string })?.message}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Privacy ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy Settings</CardTitle>
          <CardDescription>Control who can see your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => setValue("is_profile_public", !isPublic, { shouldDirty: true })}
            className={`flex items-center justify-between w-full rounded-lg border p-4 transition-colors ${
              isPublic
                ? "border-primary/40 bg-primary/5"
                : "border-muted bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <p className="font-medium text-sm">
                  {isPublic ? "Public Profile" : "Private Profile"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPublic
                    ? "Anyone in the directory can see your profile."
                    : "Only you and admins can see your profile."}
                </p>
              </div>
            </div>
            <div className={`h-5 w-9 rounded-full transition-colors relative ${isPublic ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* ── Save bar ── */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between rounded-xl border bg-card/95 backdrop-blur shadow-lg px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {saved
              ? "✓ Changes saved successfully!"
              : isDirty
              ? "You have unsaved changes."
              : "All changes saved."}
          </p>
          <Button type="submit" disabled={saving || (!isDirty && skills === (profile.skills ?? []))}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
