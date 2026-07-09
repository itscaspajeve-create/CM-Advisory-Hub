"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { REMINDER_STATUSES } from "@/lib/constants";
import type { ReminderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "none";

/** Colored dot per reminder type so the state reads at a glance. */
const REMINDER_DOT: Record<ReminderStatus, string> = {
  to_contact: "bg-amber-500",
  contacting_done: "bg-blue-500",
  policy_review: "bg-purple-500",
};

function Dot({ className }: { className: string }) {
  return (
    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} aria-hidden />
  );
}

export function ReminderStatusControl({
  policyId,
  value,
}: {
  policyId: string;
  value: ReminderStatus | null;
}) {
  const router = useRouter();

  async function update(next: string) {
    const reminder_status = next === NONE ? null : (next as ReminderStatus);
    await createClient()
      .from("policies")
      .update({ reminder_status })
      .eq("id", policyId);
    router.refresh();
  }

  return (
    <Select value={value ?? NONE} onValueChange={update}>
      <SelectTrigger className="h-8 w-[168px] text-xs" aria-label="Reminder status">
        <SelectValue placeholder="Set reminder…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="flex items-center gap-2">
            <Dot className="bg-muted-foreground/40" />
            No reminder
          </span>
        </SelectItem>
        {REMINDER_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <span className="flex items-center gap-2">
              <Dot className={REMINDER_DOT[s.value]} />
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
