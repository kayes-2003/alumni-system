import { User, Calendar, Clock, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: "destructive", News: "default", Blog: "info", Achievement: "success",
  "Event Recap": "secondary", Research: "warning", Career: "default",
  "Alumni Spotlight": "info", "Press Release": "outline", Other: "secondary",
};

interface NewsCardProps {
  item: {
    id: string; title: string; content: string; cover_image_url: string | null;
    is_published: boolean; published_at: string | null; created_at: string;
    category?: string; tags?: string; read_time?: number;
    profiles?: { full_name: string; avatar_url: string | null } | null;
  };
  index: number;
  isAdmin: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

export function NewsCard({ item, index, isAdmin, onView, onEdit, onDelete, onTogglePublish }: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={`hover:shadow-md transition-all group h-full cursor-pointer ${!item.is_published ? "opacity-70 border-dashed" : ""}`}
        onClick={onView}
      >
        {item.cover_image_url
          ? <img src={item.cover_image_url} alt={item.title} className="w-full h-40 object-cover rounded-t-xl" />
          : <div className="h-2 bg-gradient-to-r from-primary/60 to-primary/20 rounded-t-xl" />}

        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex gap-1 flex-wrap">
              {item.category && (
                <Badge variant={(CATEGORY_COLORS[item.category] ?? "outline") as any} className="text-xs">
                  {item.category}
                </Badge>
              )}
              {!item.is_published && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />Draft
                </Badge>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onTogglePublish} title={item.is_published ? "Unpublish" : "Publish"}>
                  {item.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{item.content}</p>

          {item.tags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.split(",").slice(0, 3).map(t => (
                <Badge key={t} variant="outline" className="text-[10px]">{t.trim()}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t">
            {item.profiles?.full_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />{item.profiles.full_name}
              </span>
            )}
            {item.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.published_at).toLocaleDateString()}
              </span>
            )}
            {item.read_time && (
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />{item.read_time} min
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}