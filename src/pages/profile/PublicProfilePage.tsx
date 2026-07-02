import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, MessageSquare, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { Button } from "@/components/ui/button";
import { AdminEditModal } from "@/components/alumni/AdminEditModal";
import { supabase } from "@/lib/supabase";
import type { Department, Batch } from "@/types/database";
import type { AlumniWithRelations } from "@/hooks/useAlumniDirectory";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: authProfile } = useAuth();
  const navigate = useNavigate();

  const { profile, loading, fetchProfile } = useProfile(id);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches]         = useState<Batch[]>([]);
  const [editOpen, setEditOpen]       = useState(false);

  const isAdmin    = authProfile?.role === "admin";
  const isOwnProfile = authProfile?.id === id;

  useEffect(() => { if (id) fetchProfile(); }, [fetchProfile, id]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("departments").select("*").then(({ data }) => { if (data) setDepartments(data as Department[]); });
    supabase.from("batches").select("*").then(({ data }) => { if (data) setBatches(data as Batch[]); });
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center gap-4">
        <p className="text-2xl font-bold">Profile not found</p>
        <p className="text-muted-foreground">This profile may be private or doesn&apos;t exist.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Topbar */}
      <div className="border-b bg-background">
        <div className="container py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Link to="/profile/edit">
                <Button size="sm" variant="outline">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              </Link>
            )}
            {isAdmin && !isOwnProfile && (
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Admin Edit
              </Button>
            )}
            {!isOwnProfile && authProfile && (
              <>
                {profile.role === "alumni" && authProfile.role === "student" && (
                  <Link to="/mentorship">
                    <Button size="sm">
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Request Mentorship
                    </Button>
                  </Link>
                )}
                <Link to="/messages">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Message
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile content */}
      <div className="container py-8 max-w-2xl">
        <PublicProfileView profile={profile} isOwnProfile={isOwnProfile} />
      </div>

      {/* Admin edit modal */}
      {isAdmin && (
        <AdminEditModal
          alumni={profile as AlumniWithRelations}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={fetchProfile}
          departments={departments}
          batches={batches}
        />
      )}
    </div>
  );
}
