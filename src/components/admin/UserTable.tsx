import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface Profile {
  id: string; full_name: string; email: string; role: string;
  verification_status: string; avatar_url: string | null;
  current_job_title: string | null; current_company: string | null;
  created_at: string;
}

interface UserTableProps {
  users: Profile[];
  onSetRole: (id: string, role: string) => void;
  onSetVerification: (id: string, status: string) => void;
}

export function UserTable({ users, onSetRole, onSetVerification }: UserTableProps) {
  if (users.length === 0) {
    return <p className="text-center py-8 text-muted-foreground text-sm">No users found.</p>;
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[auto,1fr,140px,160px,80px] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Member</span><span></span><span>Role</span><span>Verification</span><span>Action</span>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {users.map(u => (
          <div
            key={u.id}
            className="grid grid-cols-1 sm:grid-cols-[auto,1fr,140px,160px,80px] gap-3 sm:gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
          >
            <Avatar src={u.avatar_url} fallback={u.full_name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{u.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              {u.current_job_title && (
                <p className="text-xs text-muted-foreground truncate">{u.current_job_title}</p>
              )}
            </div>
            <Select
              value={u.role}
              onChange={e => onSetRole(u.id, e.target.value)}
              className="h-7 text-xs"
            >
              <option value="admin">Admin</option>
              <option value="alumni">Alumni</option>
              <option value="student">Student</option>
            </Select>
            <Select
              value={u.verification_status}
              onChange={e => onSetVerification(u.id, e.target.value)}
              className="h-7 text-xs"
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Link to={`/profile/${u.id}`}>
              <Button size="sm" variant="ghost" className="h-7 text-xs w-full">View</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}