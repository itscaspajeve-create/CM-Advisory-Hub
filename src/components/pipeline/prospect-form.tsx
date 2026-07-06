"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STAGES } from "@/lib/constants";
import type { PipelineItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: PipelineItem;
}

export function ProspectForm({ open, onOpenChange, prospect }: ProspectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    prospect_name: prospect?.prospect_name ?? "",
    stage: prospect?.stage ?? "lead",
    proposed_product: prospect?.proposed_product ?? "",
    expected_ape: prospect?.expected_ape != null ? String(prospect.expected_ape) : "",
    probability: prospect?.probability != null ? String(prospect.probability) : "50",
    expected_close_date: prospect?.expected_close_date ?? "",
    next_followup_date: prospect?.next_followup_date ?? "",
    notes: prospect?.notes ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.prospect_name.trim()) {
      setError("Prospect name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      prospect_name: form.prospect_name.trim(),
      stage: form.stage,
      proposed_product: form.proposed_product || null,
      expected_ape: form.expected_ape ? Number(form.expected_ape) : null,
      probability: form.probability ? Number(form.probability) : null,
      expected_close_date: form.expected_close_date || null,
      next_followup_date: form.next_followup_date || null,
      notes: form.notes || null,
    };
    const { error } = prospect
      ? await supabase.from("pipeline").update(payload).eq("id", prospect.id)
      : await supabase.from("pipeline").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{prospect ? "Edit prospect" : "Add prospect"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pr-name">Prospect name *</Label>
            <Input
              id="pr-name"
              autoComplete="off"
              value={form.prospect_name}
              onChange={(e) => set("prospect_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-product">Proposed product</Label>
            <Input
              id="pr-product"
              value={form.proposed_product}
              onChange={(e) => set("proposed_product", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-ape">Expected APE (PHP)</Label>
            <Input
              id="pr-ape"
              inputMode="decimal"
              value={form.expected_ape}
              onChange={(e) => set("expected_ape", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Probability</Label>
            <Select
              value={form.probability}
              onValueChange={(v) => set("probability", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {["10", "25", "50", "75", "90"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-close">Expected close</Label>
            <Input
              id="pr-close"
              type="date"
              value={form.expected_close_date}
              onChange={(e) => set("expected_close_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-followup">Next follow-up</Label>
            <Input
              id="pr-followup"
              type="date"
              value={form.next_followup_date}
              onChange={(e) => set("next_followup_date", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pr-notes">Notes</Label>
            <Textarea
              id="pr-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : prospect ? "Save changes" : "Add prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
