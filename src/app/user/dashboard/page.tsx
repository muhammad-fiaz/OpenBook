import { Suspense } from "react";
import { getDashboardStats, getMonthlyRevenueTrend, getPaymentDistribution } from "@/actions/queries";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart, DistributionChart, AgingReportChart } from "@/components/dashboard/charts";
import { CardSkeleton, ChartSkeleton } from "@/components/skeletons";
import { DashboardDateFilter } from "@/components/dashboard/date-filter";
import { CreateOrganization } from "@/components/settings/team/team-management";
import { getOrganizationSettings } from "@/actions/settings";
import { getTimeTrackingSummary } from "@/actions/time-tracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileCheck, Package, BarChart3 } from "lucide-react";
import Link from "next/link";

type Props = {
    searchParams: Promise<{ range?: string }>;
};

async function DashboardContent({ range }: { range?: string }) {
  const orgSettings = await getOrganizationSettings();
  
  if (!orgSettings?.org) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">One last step!</h1>
              <p className="text-muted-foreground">You need to create an organization to get started.</p>
              <CreateOrganization />
          </div>
      );
  }

  const [stats, revenue, distribution, timeSummary] = await Promise.all([
    getDashboardStats(range),
    getMonthlyRevenueTrend(range),
    getPaymentDistribution(range),
    getTimeTrackingSummary().catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
           <p className="text-muted-foreground">Welcome back! Here is your organization's financial summary.</p>
        </div>
        <DashboardDateFilter />
      </div>

      <StatsCards stats={stats} />

      {/* Quick Access Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        <Link href="/user/time-tracking" className="h-full">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Time This Month</CardTitle>
              <Clock className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{timeSummary ? `${timeSummary.thisMonthHours.toFixed(1)}h` : "0.0h"}</p>
              <p className="text-xs text-muted-foreground">{timeSummary ? timeSummary.activeProjects : 0} active projects</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/user/products" className="h-full">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage products &amp; services</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/user/quotes" className="h-full">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quotes</CardTitle>
              <FileCheck className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Create &amp; convert quotes</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/user/reports" className="h-full">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View analytics &amp; reports</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
             <RevenueChart data={revenue} />
        </div>
        <div>
             <AgingReportChart agingBuckets={stats.agingBuckets} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DistributionChart
          title="Income by Payment Provider"
          data={distribution.byProvider.map((p) => ({
            name: p.provider,
            value: Number(p.amount),
            count: p.count,
          }))}
        />
        <DistributionChart
          title="Income by Payment Method"
          data={distribution.byMethod.map((m) => ({
            name: m.method,
            value: Number(m.amount),
            count: m.count,
          }))}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  const { range } = await searchParams;
  
  return (
    <Suspense
      key={range}
      fallback={
        <div className="min-h-screen space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Financial overview at a glance</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <CardSkeleton key={`card-skel-${i.toString()}`} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      }
    >
      <DashboardContent range={range} />
    </Suspense>
  );
}
