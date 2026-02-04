import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicInvoice } from "@/actions/queries";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/financial";
import { InvoicePreviewSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice — OpenBook",
  description: "View invoice details",
};

async function PublicInvoiceContent({ publicId }: { publicId: string }) {
  const invoice = await getPublicInvoice(publicId);
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {invoice.organizationLogo ? (
              <img
                src={invoice.organizationLogo}
                alt={invoice.organizationName}
                className="mb-2 h-10 w-auto"
              />
            ) : (
              <h1
                className="text-2xl font-bold"
                style={
                  invoice.brandColor
                    ? { color: invoice.brandColor }
                    : undefined
                }
              >
                {invoice.organizationName}
              </h1>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-muted-foreground">
              INVOICE
            </h2>
            <p className="text-lg font-semibold">#{invoice.invoiceNumber}</p>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Invoice Details Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bill To
                </p>
                <p className="mt-1 font-medium">{invoice.clientName}</p>
                {invoice.clientCompany && (
                  <p className="text-sm">{invoice.clientCompany}</p>
                )}
                {invoice.clientEmail && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.clientEmail}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Issued:</span>{" "}
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Due:</span>{" "}
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Currency:</span>{" "}
                    {invoice.originalCurrency}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
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
                {invoice.items.map((item, idx) => (
                  <TableRow key={`item-${idx.toString()}`}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        item.unitPrice,
                        invoice.originalCurrency,
                      )}
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

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatCurrency(
                      invoice.subtotal,
                      invoice.originalCurrency,
                    )}
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
                      -
                      {formatCurrency(
                        invoice.discount,
                        invoice.originalCurrency,
                      )}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {formatCurrency(invoice.total, invoice.originalCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-xl font-bold">
                  {formatCurrency(invoice.baseTotal)}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(invoice.totalPaid)}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(invoice.outstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(p.originalAmount, p.originalCurrency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString()} •{" "}
                        {p.paymentMethod}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes & Terms */}
        {(invoice.notes ?? invoice.terms) && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by OpenBook</p>
        </div>
      </div>
    </div>
  );
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<InvoicePreviewSkeleton />}>
      <PublicInvoiceContent publicId={publicId} />
    </Suspense>
  );
}
