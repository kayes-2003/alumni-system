import { MapPin, Video, Users, Clock, QrCode, X, Tag, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const EVENT_TYPE_COLORS: Record<string, string> = {
  Reunion:"default", Webinar:"info", Networking:"success", Workshop:"warning",
  "Career Fair":"default", Sports:"secondary", Cultural:"info", Academic:"warning",
  Social:"success", "Alumni Meet":"default", Fundraiser:"destructive", "Award Ceremony":"info",
};

interface EventCardProps {
  event: {
    id: string; title: string; description: string; banner_url: string | null;
    location: string | null; is_virtual: boolean; start_time: string; end_time: string;
    capacity: number | null; event_type?: string; tags?: string; meeting_link?: string;
    _count?: number; _is_registered?: boolean; _my_reg_id?: string;
  };
  index: number;
  isAdmin: boolean;
  user: any;
  isPast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
  onUnregister: () => void;
  onShowQR: () => void;
  onShowAttendees: () => void;
  onOpenDetail: () => void;
}

export function EventCard({
  event, index, isAdmin, user, isPast,
  onEdit, onDelete, onRegister, onUnregister, onShowQR, onShowAttendees, onOpenDetail,
}: EventCardProps) {
  const isFull = event.capacity !== null && (event._count ?? 0) >= event.capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="h-full hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
        onClick={onOpenDetail}
      >
        {event.banner_url
          ? <img src={event.banner_url} alt={event.title} className="w-full h-36 object-cover" />
          : <div className={`h-2 ${isPast ? "bg-muted" : "bg-gradient-to-r from-primary to-primary/60"}`} />}

        <CardContent className="p-5 flex flex-col h-full">
          {/* Badges row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1">
              {isPast && <Badge variant="secondary">Past</Badge>}
              {event.event_type && (
                <Badge variant={(EVENT_TYPE_COLORS[event.event_type] ?? "outline") as any}>
                  {event.event_type}
                </Badge>
              )}
              {event.is_virtual
                ? <Badge variant="info"><Video className="h-3 w-3 mr-1" />Virtual</Badge>
                : <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />In-Person</Badge>}
              {isFull && !isPast && <Badge variant="warning">Full</Badge>}
              {event._is_registered && <Badge variant="success">Registered</Badge>}
            </div>
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-base mb-1 line-clamp-2">{event.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{event.description}</p>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {new Date(event.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {new Date(event.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              {event._count} registered{event.capacity ? ` / ${event.capacity}` : ""}
            </div>
            {event.tags && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{event.tags}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
            {!isPast && user && (
              event._is_registered ? (
                <>
                  <Button size="sm" variant="outline" className="flex-1" onClick={onUnregister}>
                    <X className="h-3.5 w-3.5 mr-1" />Unregister
                  </Button>
                  <Button size="sm" variant="outline" onClick={onShowQR}>
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button size="sm" className="flex-1" disabled={isFull} onClick={onRegister}>
                  {isFull ? "Full" : "Register"}
                </Button>
              )
            )}
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={onShowAttendees}>
                <Users className="h-3.5 w-3.5 mr-1" />Attendees
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}