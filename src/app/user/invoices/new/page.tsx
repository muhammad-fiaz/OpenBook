"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createInvoice } from "@/actions/mutations";
import { getPaymentMethods } from "@/actions/settings";
import { getProducts } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [shipping, setShipping] = useState(0);
  const [shippingTaxRate, setShippingTaxRate] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const [methods, prods] = await Promise.all([
             getPaymentMethods(),
             getProducts()
        ]);
        setPaymentMethods(methods);
        setProducts(prods);

        const defaultMethod = methods.find((m: any) => m.isDefault);
        if (defaultMethod) {
            setPaymentMethodId(defaultMethod.id);
        }
    };
    loadData();
  }, []);

  const [items, setItems] = useState<InvoiceItemRow[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  function addItem() {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItemRow,
    value: string | number,
  ) {
    const updated = [...items];
    if (field === "description") {
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setItems(updated);
  }

  function selectProduct(index: number, productId: string) {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const updated = [...items];
      updated[index] = {
          ...updated[index],
          description: product.name,
          unitPrice: parseFloat(product.unitPrice),
          taxRate: parseFloat(product.taxRate),
      };
      setItems(updated);
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const tax = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice * (item.taxRate / 100),
    0,
  );
  
  const shippingTax = shipping * (shippingTaxRate / 100);
  const total = subtotal + tax + shipping + shippingTax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createInvoice({
        invoiceNumber,
        clientId,
        issueDate,
        dueDate,
        originalCurrency: currency,
        exchangeRate,
        notes: notes || undefined,
        terms: terms || undefined,
        paymentMethodId: paymentMethodId === "none" ? undefined : paymentMethodId,
        items,
        shipping,
        shippingTaxRate,
      });

      toast.success("Invoice created successfully");
      router.push(`/user/invoices/${result.id}`);
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for your client
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Invoice Number *</Label>
                    <Input
                      id="invoice-number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-id">Client ID *</Label>
                    <Input
                      id="client-id"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Client UUID"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issue-date">Issue Date</Label>
                    <Input
                      id="issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date *</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="INR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchange-rate">
                      Exchange Rate (to INR)
                    </Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      step="0.00000001"
                      value={exchangeRate}
                      onChange={(e) =>
                        setExchangeRate(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, idx) => (
                  <motion.div
                    key={`item-row-${idx.toString()}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid gap-3 md:grid-cols-12 items-end"
                  >
                    <div className="md:col-span-4 space-y-2">
                      <div className="flex justify-between items-center">
                          <Label>Description</Label>
                          {products.length > 0 && (
                             <Select onValueChange={(val) => selectProduct(idx, val)}>
                                <SelectTrigger className="h-6 w-32.5 text-xs">
                                    <SelectValue placeholder="Add Product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="noselect" disabled>Select Product</SelectItem>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="text-xs">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                          )}
                      </div>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        placeholder="Service description"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(idx, "taxRate", e.target.value)
                        }
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center pt-6">
                      <span className="text-sm font-medium">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center pt-6">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethodId || "none"} onValueChange={(val) => setPaymentMethodId(val === "none" ? "" : val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                    {method.name} ({method.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Payment terms..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shipping Input Block */}
                 <div className="space-y-2">
                   <Label className="text-sm">Shipping / Fees</Label>
                   <div className="flex gap-2">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Amount" 
                        value={shipping} 
                        onChange={(e) => setShipping(Number(e.target.value))} 
                      />
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Tax %" 
                        value={shippingTaxRate} 
                        onChange={(e) => setShippingTaxRate(Number(e.target.value))} 
                        className="w-24"
                      />
                   </div>
                </div>
                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Tax</span>
                  <span>{tax.toFixed(2)} {currency}</span>
                </div>
                {shipping > 0 && (
                  <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping.toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping Tax ({shippingTaxRate}%)</span>
                    <span>{shippingTax.toFixed(2)} {currency}</span>
                  </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{total.toFixed(2)} {currency}</span>
                </div>
                {currency !== "INR" && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Base (INR)</span>
                    <span>{(total * exchangeRate).toFixed(2)} INR</span>
                  </div>
                )}

                <Separator />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
