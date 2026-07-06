"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Target } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { SETTINGS_KEYS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface MdrtGoalCardProps {
  ytdApe: number;
  goal: number;
}

export function MdrtGoalCard({ ytdApe, goal }: MdrtGoalCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(goal));
  const [saving, setSaving] = useState(false);

  const pct = goal > 0 ? Math.min(100, Math.round((ytdApe / goal) * 100)) : 0;

  async function save() {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("settings")
      .upsert({ key: SETTINGS_KEYS.mdrtGoal, value: String(parsed) });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Target className="h-4 w-4 text-primary" />
          MDRT Goal Progress
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Edit MDRT goal">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit MDRT goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="mdrt-goal">Annual APE goal (PHP)</Label>
              <Input
                id="mdrt-goal"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight">
            {formatCurrency(ytdApe)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatCurrency(goal)} · {pct}%
          </span>
        </div>
        <Progress value={pct} aria-label={`MDRT progress ${pct}%`} />
      </CardContent>
    </Card>
  );
}
