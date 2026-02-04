import { Suspense } from "react";
import {
  getDashboardStats,
  getMonthlyRevenueTrend,
  getPaymentDistribution,
  getClientRanking,
} from "@/actions/queries";
import { StatsCards } from "@/components/dashboard/stats-cards";
import {
  RevenueChart,
  DistributionChart,
  AgingReportChart,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/financial";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/skeletons";

async function AnalyticsContent() {
  const [stats, revenue, distribution, clients] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenueTrend(),
    getPaymentDistribution(),
    getClientRanking(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed financial analytics and reports
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenue} />
        <AgingReportChart agingBuckets={stats.agingBuckets} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DistributionChart
          title="By Provider"
          data={distribution.byProvider.map((p) => ({
            name: p.provider,
            value: Number(p.amount),
            count: p.count,
          }))}
        />
        <DistributionChart
          title="By Method"
          data={distribution.byMethod.map((m) => ({
            name: m.method,
            value: Number(m.amount),
            count: m.count,
          }))}
        />
      </div>

      {/* Client Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Client Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Revenue (INR)</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No client data available
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client, idx) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">#{idx + 1}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.company ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.invoiceCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Detailed financial analytics and reports</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={`cs-${i.toString()}`} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={5} />
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
