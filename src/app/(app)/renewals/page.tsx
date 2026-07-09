import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Phone } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { PolicyWithClient } from "@/lib/types";
import {
  daysUntil,
  formatCurrency,
  formatDate,
  nextAnniversary,
} from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PolicyStatusBadge } from "@/components/clients/status-badge";
import { ReminderStatusControl } from "@/components/renewals/reminder-status-control";

export const metadata: Metadata = { title: "Renewals & Alerts" };
export const dynamic = "force-dynamic";

interface UpcomingRenewal {
  policy: PolicyWithClient;
  date: Date;
  days: number;
}

export default async function RenewalsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("policies")
    .select("*, clients(id, full_name, phone)");

  const policies = (data ?? []) as unknown as PolicyWithClient[];

  const upcoming: UpcomingRenewal[] = policies
    .filter((p) => p.status === "inforce")
    .flatMap((p) => {
      const date = nextAnniversary(p);
      if (!date) return [];
      const days = daysUntil(date);
      return days <= 90 ? [{ policy: p, date, days }] : [];
    })
    .sort((a, b) => a.days - b.days);

  const buckets: { label: string; items: UpcomingRenewal[] }[] = [
    { label: "Next 30 days", items: upcoming.filter((u) => u.days <= 30) },
    {
      label: "31–60 days",
      items: upcoming.filter((u) => u.days > 30 && u.days <= 60),
    },
    {
      label: "61–90 days",
      items: upcoming.filter((u) => u.days > 60 && u.days <= 90),
    },
  ];

  const atRisk = policies.filter((p) => p.status === "lapsed");
  const pending = policies.filter((p) => p.status === "pending");

  return (
    <div>
      <PageHeader
        title="Renewals & Alerts"
        description={`${upcoming.length} anniversaries in 90 days · ${atRisk.length} at risk`}
      />

      {/* At-risk first — this is the daily check */}
      {atRisk.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Lapsed / at-risk ({atRisk.length})
          </h2>
          <ul className="space-y-2">
            {atRisk.map((p) => (
              <RenewalRow key={p.id} policy={p} highlight />
            ))}
          </ul>
        </section>
      )}

      {buckets.map((bucket) => (
        <section key={bucket.label} className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> {bucket.label} (
            {bucket.items.length})
          </h2>
          {bucket.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No anniversaries in this window.
            </p>
          ) : (
            <ul className="space-y-2">
              {bucket.items.map((u) => (
                <RenewalRow
                  key={u.policy.id}
                  policy={u.policy}
                  days={u.days}
                  date={u.date}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Pending issuance ({pending.length})
          </h2>
          <ul className="space-y-2">
            {pending.map((p) => (
              <RenewalRow key={p.id} policy={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RenewalRow({
  policy,
  days,
  date,
  highlight,
}: {
  policy: PolicyWithClient;
  days?: number;
  date?: Date;
  highlight?: boolean;
}) {
  const client = policy.clients;
  return (
    <li>
      <Card className={highlight ? "border-destructive/40" : undefined}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {client ? (
                <Link
                  href={`/clients/${client.id}`}
                  className="truncate font-medium underline-offset-4 hover:underline"
                >
                  {client.full_name}
                </Link>
              ) : (
                <span className="font-medium">Unknown client</span>
              )}
              {days != null && (
                <Badge variant={days <= 30 ? "warning" : "secondary"}>
                  {days === 0 ? "Today" : `in ${days}d`}
                </Badge>
              )}
              {highlight && <PolicyStatusBadge status={policy.status} />}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {policy.product_name} · #{policy.policy_number}
              {date ? ` · Anniversary ${formatDate(date.toISOString())}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Premium {formatCurrency(policy.premium_amount, policy.currency)}
            </p>
            <div className="mt-2">
              <ReminderStatusControl
                policyId={policy.id}
                value={policy.reminder_status}
              />
            </div>
          </div>
          {client?.phone && (
            <a
              href={`tel:${client.phone}`}
              aria-label={`Call ${client.full_name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
