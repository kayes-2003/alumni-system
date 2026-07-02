import {
  MapPin, Briefcase, GraduationCap, Globe, Link as LinkIcon,
  Lock, CheckCircle2, Clock, XCircle, Calendar, Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/types/database";

interface ProfileWithRelations extends Profile {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  departments?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batches?: any;
}

interface PublicProfileViewProps {
  profile: ProfileWithRelations;
  isOwnProfile?: boolean;
}

const verificationConfig = {
  verified:  { icon: CheckCircle2, label: "Verified",  variant: "success"     as const },
  pending:   { icon: Clock,        label: "Pending",   variant: "warning"     as const },
  rejected:  { icon: XCircle,      label: "Rejected",  variant: "destructive" as const },
};

const roleConfig = {
  admin:   { label: "Admin",   variant: "info"      as const },
  alumni:  { label: "Alumni",  variant: "default"   as const },
  student: { label: "Student", variant: "secondary" as const },
};

export function PublicProfileView({ profile, isOwnProfile = false }: PublicProfileViewProps) {
  const ver = verificationConfig[profile.verification_status] ?? verificationConfig.pending;
  const rol = roleConfig[profile.role] ?? roleConfig.student;
  const VerIcon = ver.icon;

  return (
    <div className="space-y-6">
      {/* ── Hero card ── */}
      <Card className="overflow-hidden">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/30" />

        <CardContent className="relative pb-6">
          {/* Avatar positioned over cover */}
          <div className="absolute -top-14 left-6">
            <Avatar
              src={profile.avatar_url}
              fallback={profile.full_name}
              size="xl"
              className="h-28 w-28 text-2xl ring-4 ring-card shadow-xl"
            />
          </div>

          {/* Privacy indicator */}
          {!profile.is_profile_public && (
            <div className="absolute top-3 right-4 flex items-center gap-1 text-xs text-muted-foreground bg-card border rounded-full px-2 py-0.5">
              <Lock className="h-3 w-3" />
              Private
            </div>
          )}

          <div className="pt-16">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                {(profile.current_job_title || profile.current_company) && (
                  <p className="text-muted-foreground mt-0.5">
                    {[profile.current_job_title, profile.current_company]
                      .filter(Boolean)
                      .join(" at ")}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  {profile.departments?.name && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> {profile.departments.name}
                    </span>
                  )}
                  {profile.graduation_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Class of {profile.graduation_year}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Badge variant={rol.variant}>{rol.label}</Badge>
                <Badge variant={ver.variant} className="flex items-center gap-1">
                  <VerIcon className="h-3 w-3" />
                  {ver.label}
                </Badge>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            <div className="flex flex-wrap gap-3 mt-4">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Skills ── */}
      {profile.skills && profile.skills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-sm py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Education ── */}
      {(profile.departments?.name || profile.batches?.name || profile.graduation_year) && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Education
            </h2>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">University / Institution</p>
                {profile.departments?.name && (
                  <p className="text-sm text-muted-foreground">
                    {profile.departments.name}
                    {profile.departments.code ? ` (${profile.departments.code})` : ""}
                  </p>
                )}
                <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                  {profile.batches?.name && <span>{profile.batches.name}</span>}
                  {profile.graduation_year && (
                    <span>Graduated {profile.graduation_year}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Own-profile tip ── */}
      {isOwnProfile && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary/80">
          <p className="font-medium text-primary mb-0.5">This is your public profile</p>
          This is how other members see you.{" "}
          {!profile.is_profile_public && (
            <span className="text-yellow-600 dark:text-yellow-400">
              Your profile is currently private — only you and admins can see it.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
