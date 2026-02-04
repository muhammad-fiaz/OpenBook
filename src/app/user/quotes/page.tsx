"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getQuotes,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
  convertQuoteToInvoice,
} from "@/actions/quotes";
import { getClients } from "@/actions/queries";
import { getProducts } from "@/actions/products";
import { exportQuotesToCSV } from "@/actions/export";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons";
import { formatCurrency } from "@/lib/financial";
import { currencies } from "@/lib/currencies";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Trash2,
  FileCheck,
  ArrowRight,
  Send,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EXPIRED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  CONVERTED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

interface QuoteItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const [quotesData, clientsData, productsData] = await Promise.all([
        getQuotes({ status: statusFilter }),
        getClients(),
        getProducts(),
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setProducts(productsData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function addLineItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  }

  function removeLineItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: string, value: any) {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      const updated = [...items];
      updated[index] = {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.unitPrice),
        taxRate: Number(product.taxRate),
      };
      setItems(updated);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTax = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.taxRate / 100), 0);
  const total = subtotal + totalTax;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createQuote({
        quoteNumber: formData.get("quoteNumber") as string,
        clientId: formData.get("clientId") as string,
        issueDate: formData.get("issueDate") as string,
        expiryDate: formData.get("expiryDate") as string,
        originalCurrency: formData.get("currency") as string,
        exchangeRate: Number.parseFloat(formData.get("exchangeRate") as string) || 1,
        notes: (formData.get("notes") as string) || undefined,
        shipping: Number.parseFloat(formData.get("shipping") as string) || 0,
        discount: Number.parseFloat(formData.get("discount") as string) || 0,
        items,
      });
      toast.success("Quote created");
      setDialogOpen(false);
      setItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
      fetchData();
    } catch {
      toast.error("Failed to create quote");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateQuoteStatus(id, status);
      toast.success(`Quote marked as ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleConvert(id: string) {
    if (!confirm("Convert this quote to an invoice?")) return;
    try {
      const result = await convertQuoteToInvoice(id);
      toast.success("Quote converted to invoice");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to convert quote");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quote?")) return;
    try {
      await deleteQuote(id);
      toast.success("Quote deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete quote");
    }
  }

  async function handleExport() {
    try {
      const csv = await exportQuotesToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Quotes exported");
    } catch {
      toast.error("Export failed");
    }
  }

  if (loading) return (
    <div className="min-h-screen space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">Create and manage quotes, convert to invoices</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={`qs-${i}`} />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  );

  return (
    <motion.div className="space-y-6" {...fadeIn} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">Create and manage quotes, convert to invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoteNumber">Quote Number *</Label>
                    <Input id="quoteNumber" name="quoteNumber" required placeholder="QT-00001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    <Select name="clientId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.company ? `(${c.company})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date *</Label>
                    <Input id="issueDate" name="issueDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input id="expiryDate" name="expiryDate" type="date" required defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue="INR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">Exchange Rate</Label>
                    <Input id="exchangeRate" name="exchangeRate" type="number" step="0.0001" defaultValue="1" />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="mr-1 h-3 w-3" /> Add Item
                    </Button>
                  </div>
                  {items.map((item, index) => (
                    <div key={`item-${index}`} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 space-y-1">
                        {index === 0 && <Label className="text-xs">Description</Label>}
                        <div className="flex gap-1">
                          <Select onValueChange={(v) => selectProduct(index, v)}>
                            <SelectTrigger className="w-16">
                              <SelectValue placeholder="..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.filter((p: any) => p.isActive).map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Qty</Label>}
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Price</Label>}
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Tax %</Label>}
                        <Input
                          type="number"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => updateLineItem(index, "taxRate", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 text-right font-mono text-sm pt-1">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} disabled={items.length === 1}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-8 pt-2 border-t text-sm">
                    <span className="text-muted-foreground">Subtotal: {subtotal.toFixed(2)}</span>
                    <span className="text-muted-foreground">Tax: {totalTax.toFixed(2)}</span>
                    <span className="font-semibold">Total: {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Shipping</Label>
                    <Input id="shipping" name="shipping" type="number" step="0.01" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount</Label>
                    <Input id="discount" name="discount" type="number" step="0.01" defaultValue="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                <DialogFooter>
                  <Button type="submit">Create Quote</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{quotes.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quotes.filter((q) => q.status === "SENT").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{quotes.filter((q) => q.status === "APPROVED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{quotes.filter((q) => q.status === "CONVERTED").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Quotes ({quotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium">No quotes yet</p>
              <p className="text-sm text-muted-foreground">Create your first quote to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {quotes.map((quote) => (
                      <motion.tr
                        key={quote.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div>{quote.clientName}</div>
                            {quote.clientCompany && (
                              <div className="text-xs text-muted-foreground">{quote.clientCompany}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(quote.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(quote.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(Number(quote.total), quote.originalCurrency)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[quote.status] ?? ""}`}>
                            {quote.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {quote.status === "DRAFT" && (
                              <Button variant="ghost" size="icon" title="Send" onClick={() => handleStatusChange(quote.id, "SENT")}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {quote.status === "SENT" && (
                              <>
                                <Button variant="ghost" size="icon" title="Approve" onClick={() => handleStatusChange(quote.id, "APPROVED")}>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Reject" onClick={() => handleStatusChange(quote.id, "REJECTED")}>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {(quote.status === "APPROVED" || quote.status === "SENT") && (
                              <Button variant="ghost" size="icon" title="Convert to Invoice" onClick={() => handleConvert(quote.id)}>
                                <ArrowRight className="h-4 w-4 text-purple-600" />
                              </Button>
                            )}
                            {quote.status !== "CONVERTED" && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
