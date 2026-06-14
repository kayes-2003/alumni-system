import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AlumniFilters } from "@/hooks/useAlumniDirectory";
import type { Department, Batch } from "@/types/database";

interface FilterPanelProps {
  filters: AlumniFilters;
  onChange: (f: Partial<AlumniFilters>) => void;
  onReset: () => void;
  departments: Department[];
  batches: Batch[];
  isAdmin: boolean;
  totalCount: number;
}

const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

const hasActiveFilters = (f: AlumniFilters) =>
  Object.values(f).some((v) => v !== "");

export function FilterPanel({
  filters, onChange, onReset, departments, batches, isAdmin, totalCount,
}: FilterPanelProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filters
          </div>
          {hasActiveFilters(filters) && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search by name…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          {/* Department */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Select
              value={filters.department_id}
              onChange={(e) => onChange({ department_id: e.target.value })}
              className="h-9 text-sm"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>

          {/* Batch */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Batch</Label>
            <Select
              value={filters.batch_id}
              onChange={(e) => onChange({ batch_id: e.target.value })}
              className="h-9 text-sm"
            >
              <option value="">All batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          {/* Graduation Year */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Graduation Year</Label>
            <Select
              value={filters.graduation_year}
              onChange={(e) => onChange({ graduation_year: e.target.value })}
              className="h-9 text-sm"
            >
              <option value="">Any year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              className="h-9 text-sm"
              placeholder="City or country…"
              value={filters.location}
              onChange={(e) => onChange({ location: e.target.value })}
            />
          </div>

          {/* Admin-only filters */}
          {isAdmin && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select
                  value={filters.role}
                  onChange={(e) => onChange({ role: e.target.value })}
                  className="h-9 text-sm"
                >
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="alumni">Alumni</option>
                  <option value="student">Student</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Verification</Label>
                <Select
                  value={filters.verification_status}
                  onChange={(e) => onChange({ verification_status: e.target.value })}
                  className="h-9 text-sm"
                >
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
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary space-y-1">
          <p className="font-semibold">Admin Mode Active</p>
          <p className="text-primary/70">
            Hover any card and click the pencil icon to edit that member&apos;s full profile.
          </p>
        </div>
      )}
    </aside>
  );
}
