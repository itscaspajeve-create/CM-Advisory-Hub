import {
  BadgePercent,
  CalendarDays,
  FileCheck2,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { computeOverviewMetrics } from "@/lib/metrics";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_MDRT_GOAL, SETTINGS_KEYS } from "@/lib/constants";
import type { Commission, Policy } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MdrtGoalCard } from "@/components/dashboard/mdrt-goal-card";
import { ApeTrendChart } from "@/components/dashboard/ape-trend-chart";
import { ProductMixChart } from "@/components/dashboard/product-mix-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = createClient();

  const [{ data: policies }, { data: commissions }, { data: goalSetting }] =
    await Promise.all([
      supabase.from("policies").select("*"),
      supabase.from("commissions").select("*"),
      supabase
        .from("settings")
        .select("value")
        .eq("key", SETTINGS_KEYS.mdrtGoal)
        .maybeSingle(),
    ]);

  const metrics = computeOverviewMetrics(
    (policies ?? []) as Policy[],
    (commissions ?? []) as Commission[]
  );
  const mdrtGoal = goalSetting?.value ? Number(goalSetting.value) : DEFAULT_MDRT_GOAL;
  const year = new Date().getFullYear();

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`Your production at a glance · ${year}`}
      />

      {/* KPI cards: stack on phones, grid on larger screens */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="YTD APE"
          value={formatCurrency(metrics.ytdApe)}
          icon={TrendingUp}
        />
        <KpiCard
          label="MTD APE"
          value={formatCurrency(metrics.mtdApe)}
          icon={CalendarDays}
        />
        <KpiCard
          label="YTD Commission"
          value={formatCurrency(metrics.ytdCommission)}
          sublabel="Received this year"
          icon={Wallet}
        />
        <KpiCard
          label="Active Policies"
          value={String(metrics.activePolicies)}
          sublabel="In-force"
          icon={FileCheck2}
        />
        <KpiCard
          label="Persistency"
          value={
            metrics.persistencyRate == null ? "—" : `${metrics.persistencyRate}%`
          }
          sublabel="In-force vs lapsed/surrendered"
          icon={BadgePercent}
        />
        <MdrtGoalCard ytdApe={metrics.ytdApe} goal={mdrtGoal} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly APE · {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApeTrendChart data={metrics.monthlyApe} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Product Mix · YTD APE by type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductMixChart data={metrics.productMix} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
