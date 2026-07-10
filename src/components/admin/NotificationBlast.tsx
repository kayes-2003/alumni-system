import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogBody,
} from "@/components/ui/dialog";

interface NotificationBlastProps {
  open: boolean;
  onClose: () => void;
  users: { id: string; role: string }[];
  onSent: (count: number) => void;
}

export function NotificationBlast({ open, onClose, users, onSent }: NotificationBlastProps) {
  const [form, setForm] = useState({ title: "", message: "", target: "all" });
  const [sending, setSending] = useState(false);

  const targetCount =
    form.target === "all" ? users.length : users.filter(u => u.role === form.target).length;

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    const targets = form.target === "all" ? users : users.filter(u => u.role === form.target);
    const inserts = targets.map(u => ({ user_id: u.id, title: form.title, message: form.message }));
    await (supabase.from("notifications") as any).insert(inserts);
    setSending(false);
    onSent(inserts.length);
    onClose();
    setForm({ title: "", message: "", target: "all" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Send Notification Blast</DialogTitle>
          <DialogDescription>Broadcast a message to selected user groups.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>Target Audience</Label>
            <Select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}>
              <option value="all">All Users ({users.length})</option>
              <option value="alumni">Alumni only ({users.filter(u => u.role === "alumni").length})</option>
              <option value="student">Students only ({users.filter(u => u.role === "student").length})</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Important Announcement"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Message *</Label>
            <Textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Your notification message…"
              className="min-h-[100px]"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || !form.title || !form.message}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Bell className="h-4 w-4 mr-1.5" />
            Send to {targetCount} users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}