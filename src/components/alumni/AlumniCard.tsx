import { MapPin, Briefcase, GraduationCap, ExternalLink, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AlumniWithRelations } from "@/hooks/useAlumniDirectory";

interface AlumniCardProps {
  alumni: AlumniWithRelations;
  isAdmin: boolean;
  onEdit: (alumni: AlumniWithRelations) => void;
  index: number;
}

const verificationColors = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
} as const;

const roleColors = {
  admin: "info",
  alumni: "default",
  student: "secondary",
} as const;

export function AlumniCard({ alumni, isAdmin, onEdit, index }: AlumniCardProps) {
  const verBadge = verificationColors[alumni.verification_status] ?? "outline";
  const roleBadge = roleColors[alumni.role] ?? "outline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="h-full hover:shadow-md transition-all duration-200 group overflow-hidden">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={alumni.avatar_url}
                fallback={alumni.full_name}
                size="lg"
                className="shrink-0 ring-2 ring-background shadow"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-snug truncate">{alumni.full_name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{alumni.email}</p>
                <div className="flex gap-1 flex-wrap mt-1.5">
                  <Badge variant={roleBadge} className="text-[10px] py-0 h-4">
                    {alumni.role}
                  </Badge>
                  <Badge variant={verBadge} className="text-[10px] py-0 h-4 capitalize">
                    {alumni.verification_status}
                  </Badge>
                </div>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(alumni)}
                title="Edit profile"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Meta info */}
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            {(alumni.current_job_title || alumni.current_company) && (
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {[alumni.current_job_title, alumni.current_company].filter(Boolean).join(" @ ")}
                </span>
              </div>
            )}
            {alumni.location && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{alumni.location}</span>
              </div>
            )}
            {(alumni.departments?.name || alumni.graduation_year) && (
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {[alumni.departments?.name, alumni.graduation_year && `Class of ${alumni.graduation_year}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {alumni.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {alumni.bio}
            </p>
          )}

          {/* Skills */}
          {alumni.skills && alumni.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {alumni.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="outline" className="text-[10px] py-0 h-4">
                  {skill}
                </Badge>
              ))}
              {alumni.skills.length > 4 && (
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  +{alumni.skills.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Footer spacer + links */}
          <div className="mt-auto flex items-center gap-2">
            {alumni.linkedin_url && (
              <a
                href={alumni.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                LinkedIn <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {alumni.github_url && (
              <a
                href={alumni.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {alumni.website_url && (
              <a
                href={alumni.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
