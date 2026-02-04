import { Suspense } from "react";
import { getPayments } from "@/actions/queries";
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
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/financial";
import { TableSkeleton } from "@/components/skeletons";
import { DashboardDateFilter } from "@/components/dashboard/date-filter";

async function PaymentsContent({ range }: { range?: string }) {
  const payments = await getPayments(range);

  return (
    <div className="space-y-6 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View all payment records across invoices
          </p>
        </div>
        <DashboardDateFilter />
      </div>

      <Card className="min-h-125">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm">Payments received within this range will appear here.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Base (INR)</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.invoiceNumber}
                    </TableCell>
                    <TableCell>{p.provider}</TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.originalAmount, p.originalCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.baseAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.referenceNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const range = typeof params.range === "string" ? params.range : undefined;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <p className="text-muted-foreground">View all payment records</p>
             </div>
          </div>
          <TableSkeleton rows={5} />
        </div>
      }
    >
      <PaymentsContent range={range} />
    </Suspense>
  );
}
