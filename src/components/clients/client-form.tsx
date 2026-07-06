"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/lib/constants";
import type { Client } from "@/lib/types";
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

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing client → edit mode; undefined → create mode */
  client?: Client;
  /** Prefill for pipeline → client conversion */
  defaults?: Partial<Client>;
  onSaved?: (id: string) => void;
}

export function ClientForm({ open, onOpenChange, client, defaults, onSaved }: ClientFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = client ?? defaults;
  const [form, setForm] = useState({
    full_name: src?.full_name ?? "",
    gender: src?.gender ?? "",
    date_of_birth: src?.date_of_birth ?? "",
    phone: src?.phone ?? "",
    email: src?.email ?? "",
    occupation: src?.occupation ?? "",
    client_source: src?.client_source ?? "",
    client_since: src?.client_since ?? new Date().toISOString().slice(0, 10),
    status: src?.status ?? "active",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.full_name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      full_name: form.full_name.trim(),
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      phone: form.phone || null,
      email: form.email || null,
      occupation: form.occupation || null,
      client_source: form.client_source || null,
      client_since: form.client_since || null,
      status: form.status,
    };
    const result = client
      ? await supabase.from("clients").update(payload).eq("id", client.id).select("id").single()
      : await supabase.from("clients").insert(payload).select("id").single();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit client" : "Add client"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cf-name">Full name *</Label>
            <Input
              id="cf-name"
              autoComplete="off"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-dob">Date of birth</Label>
            <Input
              id="cf-dob"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-phone">Phone</Label>
            <Input
              id="cf-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-email">Email</Label>
            <Input
              id="cf-email"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-occupation">Occupation</Label>
            <Input
              id="cf-occupation"
              value={form.occupation}
              onChange={(e) => set("occupation", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={form.client_source}
              onValueChange={(v) => set("client_source", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-since">Client since</Label>
            <Input
              id="cf-since"
              type="date"
              value={form.client_since}
              onChange={(e) => set("client_since", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : client ? "Save changes" : "Add client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
