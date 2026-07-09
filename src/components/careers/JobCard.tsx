import { MapPin, Clock, Building2, Users, DollarSign, ExternalLink, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_COLORS: Record<string, string> = {
  "full-time": "default", "part-time": "secondary", "internship": "info",
  "contract": "warning", "remote": "success", "freelance": "outline",
};

interface JobCardProps {
  job: {
    id: string; title: string; company: string; location: string | null;
    job_type: string; category?: string; description: string;
    requirements?: string | null; apply_url?: string | null;
    salary_range?: string; experience_level?: string;
    deadline?: string | null; is_active: boolean; created_at: string;
    posted_by: string;
    profiles?: { full_name: string } | null;
    _applied?: boolean;
  };
  index: number;
  user: any;
  isAdmin: boolean;
  onOpenDetail: () => void;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewApplicants: () => void;
}

export function JobCard({
  job, index, user, isAdmin,
  onOpenDetail, onApply, onEdit, onDelete, onViewApplicants,
}: JobCardProps) {
  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={`hover:shadow-md transition-all group cursor-pointer ${!job.is_active ? "opacity-60 border-dashed" : ""}`}
        onClick={onOpenDetail}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                <div>
                  <h3 className="font-semibold text-base">{job.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={(TYPE_COLORS[job.job_type] ?? "outline") as any} className="capitalize">
                    {job.job_type}
                  </Badge>
                  {job.category && <Badge variant="outline" className="text-xs">{job.category}</Badge>}
                  {!job.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {isExpired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                  {job._applied && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Applied
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                {job.experience_level && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.experience_level}</span>}
                {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary_range}</span>}
                {job.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Posted {new Date(job.created_at).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>

              <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                {job.apply_url && (
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Apply Externally
                    </Button>
                  </a>
                )}
                {user && job.is_active && !job._applied && !isExpired && (
                  <Button size="sm" onClick={onApply}>Apply Now</Button>
                )}
                {(isAdmin || job.posted_by === user?.id) && (
                  <>
                    <Button size="sm" variant="outline" onClick={onViewApplicants}>
                      <Users className="h-3.5 w-3.5 mr-1.5" />Applicants
                    </Button>
                    <Button size="sm" variant="outline" onClick={onEdit}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}