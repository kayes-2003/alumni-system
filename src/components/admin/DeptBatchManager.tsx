import { useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogBody,
} from "@/components/ui/dialog";

interface Dept { id: string; name: string; code: string; }
interface Batch { id: string; name: string; start_year: number; end_year: number; }

// ── Department Manager ───────────────────────────────────────────────────────
export function DeptManager({ depts, onRefresh, toast }: {
  depts: Dept[]; onRefresh: () => void; toast: (msg: string, type: string) => void;
}) {
  const [form, setForm] = useState({ name: "", code: "" });
  const [editTarget, setEditTarget] = useState<Dept | null>(null);
  const [open, setOpen] = useState(false);

  const save = async () => {
    if (!form.name || !form.code) { toast("Name and code required", "error"); return; }
    const q = supabase.from("departments") as any;
    const { error } = editTarget
      ? await q.update(form).eq("id", editTarget.id)
      : await q.insert(form);
    if (error) { toast(error.message, "error"); return; }
    toast(editTarget ? "Department updated" : "Department created", "success");
    setOpen(false); onRefresh();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    await (supabase.from("departments") as any).delete().eq("id", id);
    toast("Department deleted", "success"); onRefresh();
  };

  return (
    <div className="max-w-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Departments ({depts.length})</h2>
        <Button size="sm" onClick={() => { setEditTarget(null); setForm({ name: "", code: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Add Department
        </Button>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {depts.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">No departments yet.</p>
        )}
        {depts.map(d => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{d.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{d.code}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => { setEditTarget(d); setForm({ name: d.name, code: d.code }); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>{editTarget ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Computer Science & Engineering" />
            </div>
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="CSE" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1.5" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Batch Manager ────────────────────────────────────────────────────────────
export function BatchManager({ batches, onRefresh, toast }: {
  batches: Batch[]; onRefresh: () => void; toast: (msg: string, type: string) => void;
}) {
  const [form, setForm] = useState({ name: "", start_year: "", end_year: "" });
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [open, setOpen] = useState(false);

  const save = async () => {
    if (!form.name || !form.start_year || !form.end_year) { toast("All fields required", "error"); return; }
    const payload = { name: form.name, start_year: parseInt(form.start_year), end_year: parseInt(form.end_year) };
    const q = supabase.from("batches") as any;
    const { error } = editTarget
      ? await q.update(payload).eq("id", editTarget.id)
      : await q.insert(payload);
    if (error) { toast(error.message, "error"); return; }
    toast(editTarget ? "Batch updated" : "Batch created", "success");
    setOpen(false); onRefresh();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    await (supabase.from("batches") as any).delete().eq("id", id);
    toast("Batch deleted", "success"); onRefresh();
  };

  return (
    <div className="max-w-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Batches ({batches.length})</h2>
        <Button size="sm" onClick={() => { setEditTarget(null); setForm({ name: "", start_year: "", end_year: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Add Batch
        </Button>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {batches.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">No batches yet.</p>
        )}
        {batches.map(b => (
          <div key={b.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.start_year} – {b.end_year}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => { setEditTarget(b); setForm({ name: b.name, start_year: b.start_year.toString(), end_year: b.end_year.toString() }); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del(b.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>{editTarget ? "Edit" : "Add"} Batch</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1.5">
              <Label>Batch Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Batch 2020-2024" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Year *</Label>
                <Input type="number" value={form.start_year} onChange={e => setForm(p => ({ ...p, start_year: e.target.value }))} placeholder="2020" />
              </div>
              <div className="space-y-1.5">
                <Label>End Year *</Label>
                <Input type="number" value={form.end_year} onChange={e => setForm(p => ({ ...p, end_year: e.target.value }))} placeholder="2024" />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1.5" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}