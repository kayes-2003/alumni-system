import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface MentorCardProps {
  mentor: {
    id: string; full_name: string; email: string; avatar_url: string | null;
    current_job_title: string | null; current_company: string | null;
    bio: string | null; skills: string[] | null; location: string | null;
    graduation_year: number | null;
    departments?: { name: string } | null;
  };
  index: number;
  isStudent: boolean;
  onRequest: () => void;
}

export function MentorCard({ mentor, index, isStudent, onRequest }: MentorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="hover:shadow-md transition-all duration-200 h-full">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            <Link to={`/profile/${mentor.id}`}>
              <Avatar
                src={mentor.avatar_url}
                fallback={mentor.full_name}
                size="lg"
                className="shrink-0 ring-2 ring-background shadow"
              />
            </Link>
            <div className="min-w-0">
              <Link
                to={`/profile/${mentor.id}`}
                className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 block"
              >
                {mentor.full_name}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {[mentor.current_job_title, mentor.current_company].filter(Boolean).join(" @ ")}
              </p>
              {mentor.location && (
                <p className="text-xs text-muted-foreground">{mentor.location}</p>
              )}
            </div>
          </div>

          {mentor.departments?.name && (
            <Badge variant="outline" className="w-fit mb-2 text-xs">
              {mentor.departments.name}
              {mentor.graduation_year ? ` · ${mentor.graduation_year}` : ""}
            </Badge>
          )}

          {mentor.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {mentor.bio}
            </p>
          )}

          {mentor.skills && mentor.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {mentor.skills.slice(0, 5).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px] h-4">{s}</Badge>
              ))}
              {mentor.skills.length > 5 && (
                <Badge variant="secondary" className="text-[10px] h-4">+{mentor.skills.length - 5}</Badge>
              )}
            </div>
          )}

          <div className="mt-auto">
            {isStudent ? (
              <Button size="sm" className="w-full" onClick={onRequest}>
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />Request Mentorship
              </Button>
            ) : (
              <Link to={`/profile/${mentor.id}`}>
                <Button size="sm" variant="outline" className="w-full">View Profile</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}