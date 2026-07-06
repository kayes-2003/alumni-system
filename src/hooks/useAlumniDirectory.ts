import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Department, Batch } from "@/types/database";

export interface AlumniFilters {
  search: string;
  department_id: string;
  batch_id: string;
  graduation_year: string;
  location: string;
  verification_status: string;
  role: string;
}

export const DEFAULT_FILTERS: AlumniFilters = {
  search: "",
  department_id: "",
  batch_id: "",
  graduation_year: "",
  location: "",
  verification_status: "",
  role: "",
};

export type AlumniWithRelations = Profile & {
  departments: { name: string; code: string } | null;
  batches: { name: string } | null;
};

export function useAlumniDirectory() {
  const [alumni, setAlumni] = useState<AlumniWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filters, setFilters] = useState<AlumniFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    supabase.from("departments").select("*").order("name").then(({ data }) => {
      if (data) setDepartments(data as Department[]);
    });
    supabase.from("batches").select("*").order("start_year", { ascending: false }).then(({ data }) => {
      if (data) setBatches(data as Batch[]);
    });
  }, []);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("profiles")
      .select("*, departments(name, code), batches(name)", { count: "exact" })
      .range(from, to)
      .order("full_name");

    if (filters.search) {
      query = query.ilike("full_name", `%${filters.search}%`);
    }
    if (filters.department_id) {
      query = query.eq("department_id", filters.department_id);
    }
    if (filters.batch_id) {
      query = query.eq("batch_id", filters.batch_id);
    }
    if (filters.graduation_year) {
      query = query.eq("graduation_year", parseInt(filters.graduation_year));
    }
    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.verification_status) {
      query = query.eq("verification_status", filters.verification_status);
    }
    if (filters.role) {
      query = query.eq("role", filters.role);
    }

    const { data, count, error } = await query;
    setLoading(false);
    if (!error && data) {
      setAlumni(data as AlumniWithRelations[]);
      setTotalCount(count ?? 0);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const updateFilters = (next: Partial<AlumniFilters>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    alumni,
    departments,
    batches,
    filters,
    updateFilters,
    resetFilters,
    loading,
    totalCount,
    page,
    setPage,
    totalPages,
    PAGE_SIZE,
    refetch: fetchAlumni,
  };
}