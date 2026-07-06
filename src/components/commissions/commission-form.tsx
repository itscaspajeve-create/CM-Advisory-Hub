"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { COMMISSION_STATUSES, COMMISSION_TYPES } from "@/lib/constants";
import type { Commission } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PolicyOption {
  id: string;
  label: string;
}

interface CommissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Policy — Client" options for the picker */
  policyOptions: PolicyOption[];
  commission?: Commission;
}

export function CommissionForm({
  open,
  onOpenChange,
  policyOptions,
  commission,
}: CommissionFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    policy_id: commission?.policy_id ?? "",
    commission_type: commission?.commission_type ?? "first_year",
    rate: commission?.rate != null ? String(commission.rate) : "",
    amount: commission?.amount != null ? String(commission.amount) : "",
    expected_date:
      commission?.expected_date ?? new Date().toISOString().slice(0, 10),
    received_date: commission?.received_date ?? "",
    status: commission?.status ?? "expected",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.policy_id) {
      setError("Pick a policy");
      return;
    }
    if (!form.amount || Number(form.amount) === 0) {
      setError("Amount is required");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      policy_id: form.policy_id,
      commission_type: form.commission_type,
      rate: form.rate ? Number(form.rate) : null,
      amount: Number(form.amount),
      expected_date: form.expected_date || null,
      // Marking received without a date defaults it to today
      received_date:
        form.status === "received"
          ? form.received_date || new Date().toISOString().slice(0, 10)
          : form.received_date || null,
      status: form.status,
    };
    const { error } = commission
      ? await supabase.from("commissions").update(payload).eq("id", commission.id)
      : await supabase.from("commissions").insert(payload);
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
          <DialogTitle>
            {commission ? "Edit commission" : "Log commission"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Policy *</Label>
            <Select value={form.policy_id} onValueChange={(v) => set("policy_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select policy…" />
              </SelectTrigger>
              <SelectContent>
                {policyOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.commission_type}
              onValueChange={(v) => set("commission_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-amount">Amount (PHP) *</Label>
            <Input
              id="co-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-rate">Rate % (optional)</Label>
            <Input
              id="co-rate"
              inputMode="decimal"
              value={form.rate}
              onChange={(e) => set("rate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-expected">Expected date</Label>
            <Input
              id="co-expected"
              type="date"
              value={form.expected_date}
              onChange={(e) => set("expected_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-received">Received date</Label>
            <Input
              id="co-received"
              type="date"
              value={form.received_date}
              onChange={(e) => set("received_date", e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : commission ? "Save changes" : "Log commission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
