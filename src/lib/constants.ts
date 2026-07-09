import type {
  ClientStatus,
  CommissionStatus,
  CommissionType,
  PipelineStage,
  PolicyStatus,
  PremiumMode,
  ReminderStatus,
} from "@/lib/types";

/** Options shown in dropdowns. Add entries here to extend the app. */

export const PRODUCT_TYPES = [
  "VUL (Investment-Linked)",
  "Traditional / Whole Life",
  "Term",
  "Health / Critical Illness",
  "Accident",
  "Group",
  "Other",
] as const;

export const CLIENT_SOURCES = [
  "Referral",
  "Family / Friend",
  "Social Media",
  "Cold Approach",
  "Event / Booth",
  "Orphan Policy",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Auto-debit (Bank)",
  "Credit Card",
  "GCash / E-wallet",
  "Bank Transfer",
  "Cash / Check",
] as const;

export const CURRENCIES = ["PHP", "USD"] as const;

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

export const POLICY_STATUSES: { value: PolicyStatus; label: string }[] = [
  { value: "inforce", label: "In-force" },
  { value: "pending", label: "Pending" },
  { value: "lapsed", label: "Lapsed" },
  { value: "surrendered", label: "Surrendered" },
  { value: "claimed", label: "Claimed" },
];

export const PREMIUM_MODES: { value: PremiumMode; label: string; factor: number }[] = [
  { value: "annual", label: "Annual", factor: 1 },
  { value: "semi_annual", label: "Semi-annual", factor: 2 },
  { value: "quarterly", label: "Quarterly", factor: 4 },
  { value: "monthly", label: "Monthly", factor: 12 },
  // MDRT convention: single-premium counts 10% toward APE
  { value: "single", label: "Single Pay", factor: 0.1 },
];

export const PIPELINE_STAGES: { value: PipelineStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "presented", label: "Presented" },
  { value: "proposal", label: "Proposal" },
  { value: "closing", label: "Closing" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

/** Stages shown as Kanban columns (won/lost are terminal, shown separately). */
export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => s.value !== "won" && s.value !== "lost"
);

export const COMMISSION_TYPES: { value: CommissionType; label: string }[] = [
  { value: "first_year", label: "First Year" },
  { value: "renewal", label: "Renewal" },
  { value: "bonus", label: "Bonus" },
  { value: "override", label: "Override" },
  { value: "persistency", label: "Persistency" },
];

export const COMMISSION_STATUSES: { value: CommissionStatus; label: string }[] = [
  { value: "expected", label: "Expected" },
  { value: "received", label: "Received" },
  { value: "clawback", label: "Clawback" },
];

/** Reminder / outreach states for upcoming renewals. */
export const REMINDER_STATUSES: { value: ReminderStatus; label: string }[] = [
  { value: "to_contact", label: "To contact" },
  { value: "contacting_done", label: "Done contacting" },
  { value: "policy_review", label: "For policy review" },
];

export const DEFAULT_MDRT_GOAL = 1_300_000; // PHP; editable on the Overview page

export const SETTINGS_KEYS = {
  mdrtGoal: "mdrt_goal",
} as const;
