import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoiceById } from "@/actions/queries";
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
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/financial";
import { InvoicePreviewSkeleton } from "@/components/skeletons";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { InvoicePDFViewer } from "@/components/invoice-pdf-viewer";

async function InvoiceDetailContent({ id }: { id: string }) {
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={invoice.status} />
              <span className="text-sm text-muted-foreground">
                {invoice.originalCurrency}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/invoice/${invoice.publicId}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Public Link
            </Link>
          </Button>
          <InvoicePDFViewer invoice={invoice} mode="button" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Info */}
        <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Bill To</p>
                <p className="font-medium">{invoice.client.name}</p>
                {invoice.client.company && (
                  <p className="text-sm">{invoice.client.company}</p>
                )}
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.email}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Dates</p>
                <p className="text-sm">
                  Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice, invoice.originalCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.taxRate)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.amount, invoice.originalCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatCurrency(invoice.subtotal, invoice.originalCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    {formatCurrency(invoice.tax, invoice.originalCurrency)}
                  </span>
                </div>
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(invoice.discount, invoice.originalCurrency)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {formatCurrency(invoice.total, invoice.originalCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Base Total (INR)</span>
                  <span>{formatCurrency(invoice.baseTotal)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {invoice.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <InvoicePDFViewer invoice={invoice} mode="preview" />
            </CardContent>
        </Card>
        </div>

        {/* Payment Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatCurrency(invoice.baseTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Paid</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.totalPaid)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Outstanding</span>
                <span className="font-bold text-amber-600">
                  {formatCurrency(invoice.outstanding)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(p.originalAmount, p.originalCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.paymentDate).toLocaleDateString()} •{" "}
                          {p.paymentMethod}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<InvoicePreviewSkeleton />}>
      <InvoiceDetailContent id={id} />
    </Suspense>
  );
}
