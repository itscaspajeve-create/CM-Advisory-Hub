import { Badge } from "@/components/ui/badge";
import type { ClientStatus, CommissionStatus, PolicyStatus } from "@/lib/types";

const CLIENT_VARIANTS: Record<ClientStatus, "success" | "secondary" | "info"> = {
  active: "success",
  inactive: "secondary",
  prospect: "info",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={CLIENT_VARIANTS[status] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

const POLICY_VARIANTS: Record<PolicyStatus, "success" | "secondary" | "warning" | "destructive" | "info"> = {
  inforce: "success",
  pending: "info",
  lapsed: "destructive",
  surrendered: "warning",
  claimed: "secondary",
};

const POLICY_LABELS: Record<PolicyStatus, string> = {
  inforce: "In-force",
  pending: "Pending",
  lapsed: "Lapsed",
  surrendered: "Surrendered",
  claimed: "Claimed",
};

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  return (
    <Badge variant={POLICY_VARIANTS[status] ?? "secondary"}>
      {POLICY_LABELS[status] ?? status}
    </Badge>
  );
}

const COMMISSION_VARIANTS: Record<CommissionStatus, "success" | "warning" | "destructive"> = {
  received: "success",
  expected: "warning",
  clawback: "destructive",
};

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <Badge variant={COMMISSION_VARIANTS[status] ?? "warning"} className="capitalize">
      {status}
    </Badge>
  );
}
