"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/format";

const SLOT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

interface ProductMixChartProps {
  data: { name: string; value: number }[];
}

/**
 * Donut of YTD APE by product type. Colors follow the entity in fixed slot
 * order (sorted by value once, on the server), with a text legend beside it
 * so identity never rides on color alone.
 */
export function ProductMixChart({ data }: ProductMixChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground md:h-64">
        No issued policies yet this year
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-auto flex-col items-center gap-2 md:h-64 md:flex-row md:gap-4">
      <div className="h-44 w-full max-w-[220px] shrink-0 md:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={SLOT_COLORS[i % SLOT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                String(name),
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e1e0d9",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1.5 pb-2 md:pb-0">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: SLOT_COLORS[i % SLOT_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
