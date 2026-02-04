"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getInvoices } from "@/actions/queries";
import { exportInvoicesToCSV } from "@/actions/export";
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
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/financial";
import { TableSkeleton } from "@/components/skeletons";
import { Plus, ExternalLink, Download } from "lucide-react";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function InvoicesContent() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
     fetchData();
  }, [dateRange, statusFilter]);

  async function fetchData() {
     setLoading(true);
     try {
         const data = await getInvoices({
             from: dateRange?.from,
             to: dateRange?.to,
             status: statusFilter === "ALL" ? undefined : statusFilter
         });
         setInvoices(data);
     } catch(e) {
         toast.error("Failed to fetch invoices");
     } finally {
         setLoading(false);
     }
  }

  async function handleExport() {
      try {
          const csv = await exportInvoicesToCSV({
             from: dateRange?.from,
             to: dateRange?.to,
             status: statusFilter === "ALL" ? undefined : statusFilter
          });
          
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `invoices_export_${new Date().toISOString()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e) {
          toast.error("Export failed");
      }
  }

  const sortedInvoices = React.useMemo(() => {
    if (!sortConfig) return invoices;
    return [...invoices].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [invoices, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track invoices</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button asChild>
            <Link href="/user/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
            </Link>
            </Button>
        </div>
      </div>

       <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
            </SelectContent>
          </Select>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
              <TableSkeleton />
          ) : sortedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-center text-muted-foreground">
              <p className="text-lg font-medium">No invoices found</p>
              <p className="text-sm">Try adjusting your filters or create a new invoice.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort("invoiceNumber")}>Invoice #</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("clientName")}>Client</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("issueDate")}>Issue Date</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("dueDate")}>Due Date</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => requestSort("baseTotal")}>Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {sortedInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/user/invoices/${inv.id}`}
                        className="text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>{inv.clientName}</div>
                      {inv.clientCompany && (
                        <div className="text-xs text-muted-foreground">
                          {inv.clientCompany}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(inv.baseTotal)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(inv.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(inv.outstanding) > 0 ? (
                        <span className="text-amber-600">
                          {formatCurrency(inv.outstanding)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/invoice/${inv.publicId}`}
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
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

export default function InvoicesPage() {
  return <InvoicesContent />;
}
