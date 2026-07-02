import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/database";

export interface ProfileUpdatePayload {
  full_name?: string;
  phone?: string | null;
  bio?: string | null;
  department_id?: string | null;
  batch_id?: string | null;
  graduation_year?: number | null;
  current_job_title?: string | null;
  current_company?: string | null;
  location?: string | null;
  skills?: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  is_profile_public?: boolean;
}

export function useProfile(targetId?: string) {
  const { user, refreshProfile } = useAuth();
  const id = targetId ?? user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, departments(name, code), batches(name, start_year, end_year)")
      .eq("id", id)
      .single();
    setLoading(false);
    if (error) setError(error.message);
    else setProfile(data as Profile);
  }, [id]);

  const updateProfile = async (payload: ProfileUpdatePayload): Promise<boolean> => {
    if (!id) return false;
    setSaving(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .update(payload)
      .eq("id", id);
    setSaving(false);
    if (error) { setError(error.message); return false; }
    await fetchProfile();
    if (!targetId) await refreshProfile();
    return true;
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!id) return null;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be smaller than 2MB.");
      return null;
    }

    setUploadingAvatar(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any)
      .update({ avatar_url: publicUrl })
      .eq("id", id);

    await fetchProfile();
    if (!targetId) await refreshProfile();

    setUploadingAvatar(false);
    return publicUrl;
  };

  const removeAvatar = async (): Promise<boolean> => {
    if (!id) return false;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .update({ avatar_url: null })
      .eq("id", id);
    setSaving(false);
    if (error) { setError(error.message); return false; }
    await fetchProfile();
    if (!targetId) await refreshProfile();
    return true;
  };

  return {
    profile,
    loading,
    saving,
    uploadingAvatar,
    error,
    setError,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
  };
}
