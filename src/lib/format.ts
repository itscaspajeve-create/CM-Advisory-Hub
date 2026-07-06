import { PREMIUM_MODES } from "@/lib/constants";
import type { Policy, PremiumMode } from "@/lib/types";

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "PHP",
  compact = false
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Annualized Premium Equivalent for one policy. */
export function policyApe(
  policy: Pick<Policy, "premium_amount" | "premium_mode">
): number {
  const mode = PREMIUM_MODES.find((m) => m.value === policy.premium_mode);
  return policy.premium_amount * (mode?.factor ?? 1);
}

export function premiumModeLabel(mode: PremiumMode): string {
  return PREMIUM_MODES.find((m) => m.value === mode)?.label ?? mode;
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Next anniversary of a policy from today, based on policy_anniversary
 * (falls back to issue_date). Returns null if neither date is set.
 */
export function nextAnniversary(
  policy: Pick<Policy, "policy_anniversary" | "issue_date">
): Date | null {
  const base = policy.policy_anniversary ?? policy.issue_date;
  if (!base) return null;
  const d = new Date(base);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}
