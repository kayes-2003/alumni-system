import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Eye, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DangerZone } from "@/components/profile/DangerZone";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { Department, Batch } from "@/types/database";
import type { ProfileWithRelations } from "@/hooks/useProfile";

type Tab = "edit" | "preview" | "security";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "edit",     label: "Edit Profile", icon: User       },
  { id: "preview",  label: "Preview",      icon: Eye        },
  { id: "security", label: "Security",     icon: ShieldCheck },
];

export default function EditProfilePage() {
  const { profile: authProfile } = useAuth();
  const {
    profile, loading, saving, uploadingAvatar, error,
    fetchProfile, updateProfile, uploadAvatar, removeAvatar,
  } = useProfile();

  const [activeTab, setActiveTab]   = useState<Tab>("edit");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches]         = useState<Batch[]>([]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    supabase.from("departments").select("*").order("name").then(({ data }) => {
      if (data) setDepartments(data as Department[]);
    });
    supabase.from("batches").select("*").order("start_year", { ascending: false }).then(({ data }) => {
      if (data) setBatches(data as Batch[]);
    });
  }, []);

  if (loading || !authProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayProfile = (profile ?? authProfile) as ProfileWithRelations;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container py-5">
          <Link
            to={`/dashboard/${authProfile.role}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">My Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage how you appear to the alumni community.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={displayProfile.verification_status === "verified" ? "success" : "warning"}
                className="capitalize"
              >
                {displayProfile.verification_status}
              </Badge>
              <Badge variant={displayProfile.role === "alumni" ? "default" : "secondary"} className="capitalize">
                {displayProfile.role}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b -mb-px">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── EDIT TAB ── */}
          {activeTab === "edit" && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
              {/* Left: avatar */}
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6 flex flex-col items-center">
                  <AvatarUploader
                    currentUrl={displayProfile.avatar_url}
                    name={displayProfile.full_name}
                    uploading={uploadingAvatar}
                    onUpload={uploadAvatar}
                    onRemove={removeAvatar}
                  />
                </div>

                {/* Profile completion */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <p className="text-sm font-medium">Profile Completion</p>
                  {(() => {
                    const fields = [
                      ["Avatar",       !!displayProfile.avatar_url],
                      ["Bio",          !!displayProfile.bio],
                      ["Department",   !!displayProfile.department_id],
                      ["Job Title",    !!displayProfile.current_job_title],
                      ["Location",     !!displayProfile.location],
                      ["LinkedIn",     !!displayProfile.linkedin_url],
                      ["Skills",       (displayProfile.skills?.length ?? 0) > 0],
                    ];
                    const done = fields.filter(([, v]) => v).length;
                    const pct  = Math.round((done / fields.length) * 100);
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{done}/{fields.length} completed</span>
                          <span className="font-semibold text-foreground">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="space-y-1.5 mt-1">
                          {fields.map(([label, done]) => (
                            <div key={label as string} className="flex items-center gap-2 text-xs">
                              <div className={`h-1.5 w-1.5 rounded-full ${done ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                              <span className={done ? "text-foreground" : "text-muted-foreground"}>
                                {label as string}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Right: form */}
              <div>
                <EditProfileForm
                  profile={displayProfile}
                  departments={departments}
                  batches={batches}
                  saving={saving}
                  onSave={updateProfile}
                />
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB ── */}
          {activeTab === "preview" && (
            <div className="max-w-2xl mx-auto">
              <PublicProfileView profile={displayProfile} isOwnProfile />
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <div className="max-w-xl space-y-6">
              <ChangePasswordForm />
              <DangerZone />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}