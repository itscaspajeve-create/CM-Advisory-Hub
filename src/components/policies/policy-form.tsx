"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  CURRENCIES,
  PAYMENT_METHODS,
  POLICY_STATUSES,
  PREMIUM_MODES,
  PRODUCT_TYPES,
} from "@/lib/constants";
import type { Policy } from "@/lib/types";
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

interface PolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  /** Existing policy → edit mode */
  policy?: Policy;
  /** Prefill for pipeline → policy conversion */
  defaults?: Partial<Policy>;
  onSaved?: (id: string) => void;
}

export function PolicyForm({
  open,
  onOpenChange,
  clientId,
  policy,
  defaults,
  onSaved,
}: PolicyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = policy ?? defaults;
  const [form, setForm] = useState({
    policy_number: src?.policy_number ?? "",
    product_name: src?.product_name ?? "",
    product_type: src?.product_type ?? "",
    currency: src?.currency ?? "PHP",
    sum_assured: src?.sum_assured != null ? String(src.sum_assured) : "",
    premium_amount: src?.premium_amount != null ? String(src.premium_amount) : "",
    premium_mode: src?.premium_mode ?? "annual",
    payment_method: src?.payment_method ?? "",
    issue_date: src?.issue_date ?? "",
    policy_anniversary: src?.policy_anniversary ?? "",
    payor: src?.payor ?? "",
    riders: src?.riders ?? "",
    status: src?.status ?? "inforce",
    fund_allocation: src?.fund_allocation ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.policy_number.trim() || !form.product_name.trim()) {
      setError("Policy number and product name are required");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      client_id: clientId,
      policy_number: form.policy_number.trim(),
      product_name: form.product_name.trim(),
      product_type: form.product_type || null,
      currency: form.currency,
      sum_assured: form.sum_assured ? Number(form.sum_assured) : null,
      premium_amount: form.premium_amount ? Number(form.premium_amount) : 0,
      premium_mode: form.premium_mode,
      payment_method: form.payment_method || null,
      issue_date: form.issue_date || null,
      // Anniversary defaults to issue date when left blank
      policy_anniversary: form.policy_anniversary || form.issue_date || null,
      payor: form.payor || null,
      riders: form.riders || null,
      status: form.status,
      fund_allocation: form.fund_allocation || null,
    };
    const result = policy
      ? await supabase.from("policies").update(payload).eq("id", policy.id).select("id").single()
      : await supabase.from("policies").insert(payload).select("id").single();
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onOpenChange(false);
    router.refresh();
    onSaved?.(result.data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{policy ? "Edit policy" : "Add policy"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pf-number">Policy number *</Label>
            <Input
              id="pf-number"
              autoComplete="off"
              value={form.policy_number}
              onChange={(e) => set("policy_number", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-product">Product name *</Label>
            <Input
              id="pf-product"
              value={form.product_name}
              onChange={(e) => set("product_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Product type</Label>
            <Select
              value={form.product_type}
              onValueChange={(v) => set("product_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
                {POLICY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-premium">Premium amount *</Label>
            <Input
              id="pf-premium"
              inputMode="decimal"
              value={form.premium_amount}
              onChange={(e) => set("premium_amount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Premium mode</Label>
            <Select
              value={form.premium_mode}
              onValueChange={(v) => set("premium_mode", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREMIUM_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-sum">Sum assured</Label>
            <Input
              id="pf-sum"
              inputMode="decimal"
              value={form.sum_assured}
              onChange={(e) => set("sum_assured", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) => set("payment_method", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-issue">Issue date</Label>
            <Input
              id="pf-issue"
              type="date"
              value={form.issue_date}
              onChange={(e) => set("issue_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-anniv">Anniversary (blank = issue date)</Label>
            <Input
              id="pf-anniv"
              type="date"
              value={form.policy_anniversary}
              onChange={(e) => set("policy_anniversary", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-payor">Payor (blank = client)</Label>
            <Input
              id="pf-payor"
              value={form.payor}
              onChange={(e) => set("payor", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-riders">Riders</Label>
            <Input
              id="pf-riders"
              placeholder="e.g. CI Accelerator, Waiver of Premium"
              value={form.riders}
              onChange={(e) => set("riders", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-funds">Fund allocation</Label>
            <Textarea
              id="pf-funds"
              rows={2}
              placeholder="e.g. 60% PruLink Equity, 40% Bond"
              value={form.fund_allocation}
              onChange={(e) => set("fund_allocation", e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : policy ? "Save changes" : "Add policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
