"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              // biome-ignore lint/style/noInlineStyles: Recharts style
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="hsl(142, 76%, 36%)" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name="Expense" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="hsl(45, 93%, 47%)" name="Profit" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface DistributionChartProps {
  title: string;
  data: Array<{ name: string; value: number; count: number }>;
}

export function DistributionChart({ title, data }: DistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }: { name?: string | number; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index.toString()}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // biome-ignore lint/style/noInlineStyles: Recharts style
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AgingReportProps {
  agingBuckets: {
    current: string;
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
    over90Days: string;
  };
}

export function AgingReportChart({ agingBuckets }: AgingReportProps) {
  const data = [
    { name: "Current", amount: Number(agingBuckets.current) },
    { name: "1-30 Days", amount: Number(agingBuckets.thirtyDays) },
    { name: "31-60 Days", amount: Number(agingBuckets.sixtyDays) },
    { name: "61-90 Days", amount: Number(agingBuckets.ninetyDays) },
    { name: "90+ Days", amount: Number(agingBuckets.over90Days) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aging Report</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              // biome-ignore lint/style/noInlineStyles: Recharts style
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="amount" name="Outstanding (INR)" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`aging-${index.toString()}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
