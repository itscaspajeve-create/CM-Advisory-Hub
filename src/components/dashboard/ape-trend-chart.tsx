"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";

interface ApeTrendChartProps {
  data: { month: string; ape: number }[];
}

/** Single-series monthly APE bar chart — no legend needed (title names it). */
export function ApeTrendChart({ data }: ApeTrendChartProps) {
  return (
    <div className="h-56 w-full md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e1e0d9" strokeWidth={1} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={{ stroke: "#c3c2b7" }}
            tick={{ fill: "#898781", fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#898781", fontSize: 11 }}
            tickFormatter={(v: number) => formatCurrency(v, "PHP", true)}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(value) => [formatCurrency(Number(value)), "APE"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e1e0d9",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="ape"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
