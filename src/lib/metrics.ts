import { policyApe } from "@/lib/format";
import type { Commission, Policy } from "@/lib/types";

/** Pure KPI helpers — computed from full row sets fetched server-side. */

export interface OverviewMetrics {
  ytdApe: number;
  mtdApe: number;
  ytdCommission: number;
  activePolicies: number;
  /** in-force / (in-force + lapsed + surrendered), % — null when no data */
  persistencyRate: number | null;
  monthlyApe: { month: string; ape: number }[];
  productMix: { name: string; value: number }[];
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function computeOverviewMetrics(
  policies: Policy[],
  commissions: Commission[],
  now = new Date()
): OverviewMetrics {
  const year = now.getFullYear();
  const month = now.getMonth();

  const issuedThisYear = policies.filter((p) => {
    if (!p.issue_date || p.status === "pending") return false;
    return new Date(p.issue_date).getFullYear() === year;
  });

  const ytdApe = issuedThisYear.reduce((sum, p) => sum + policyApe(p), 0);
  const mtdApe = issuedThisYear
    .filter((p) => new Date(p.issue_date!).getMonth() === month)
    .reduce((sum, p) => sum + policyApe(p), 0);

  const ytdCommission = commissions
    .filter(
      (c) =>
        c.status === "received" &&
        c.received_date &&
        new Date(c.received_date).getFullYear() === year
    )
    .reduce((sum, c) => sum + c.amount, 0);

  const activePolicies = policies.filter((p) => p.status === "inforce").length;

  const persistencyDenom = policies.filter((p) =>
    ["inforce", "lapsed", "surrendered"].includes(p.status)
  ).length;
  const persistencyRate =
    persistencyDenom === 0
      ? null
      : Math.round((activePolicies / persistencyDenom) * 1000) / 10;

  const monthlyApe = MONTH_LABELS.map((label, i) => ({
    month: label,
    ape: issuedThisYear
      .filter((p) => new Date(p.issue_date!).getMonth() === i)
      .reduce((sum, p) => sum + policyApe(p), 0),
  }));

  const mixMap = new Map<string, number>();
  for (const p of issuedThisYear) {
    const key = p.product_type || "Unspecified";
    mixMap.set(key, (mixMap.get(key) ?? 0) + policyApe(p));
  }
  const productMix = Array.from(mixMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    ytdApe,
    mtdApe,
    ytdCommission,
    activePolicies,
    persistencyRate,
    monthlyApe,
    productMix,
  };
}
