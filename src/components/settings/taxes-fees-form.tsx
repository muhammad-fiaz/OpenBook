"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Percent, Coins } from "lucide-react";
import { toast } from "sonner";
import { createTax, deleteTax, createFee, deleteFee } from "@/actions/taxes-fees";
import { formatCurrency } from "@/lib/financial";
import { useRouter } from "next/navigation";

export function TaxesFeesForm({ taxes, fees }: { taxes: any[], fees: any[] }) {
  const [taxOpen, setTaxOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreateTax(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createTax(
        formData.get("name") as string,
        Number(formData.get("rate")),
        formData.get("description") as string
      );
      toast.success("Tax added");
      setTaxOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add tax");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createFee(
        formData.get("name") as string,
        Number(formData.get("amount")),
        formData.get("currency") as string || "INR",
        formData.get("description") as string
      );
      toast.success("Fee added");
      setFeeOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add fee");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTax(id: string) {
    if (!confirm("Delete this tax?")) return;
    try {
      await deleteTax(id);
      toast.success("Tax deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete tax");
    }
  }

  async function handleDeleteFee(id: string) {
    if (!confirm("Delete this fee?")) return;
    try {
      await deleteFee(id);
      toast.success("Fee deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete fee");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Taxes Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Taxes</CardTitle>
            <CardDescription>Manage tax rates</CardDescription>
          </div>
          <Dialog open={taxOpen} onOpenChange={setTaxOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Tax</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tax Rate</DialogTitle>
                <DialogDescription>Define a new tax percentage.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTax} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxName">Name</Label>
                  <Input id="taxName" name="name" placeholder="VAT, GST, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Rate (%)</Label>
                  <Input id="taxRate" name="rate" type="number" step="0.01" placeholder="18" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxDesc">Description</Label>
                  <Textarea id="taxDesc" name="description" placeholder="Optional description" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">No taxes defined.</div>
          ) : (
            taxes.map((tax) => (
              <div key={tax.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Percent className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{tax.name}</div>
                    <div className="text-sm text-muted-foreground">{tax.rate}%</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTax(tax.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Fees Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fees</CardTitle>
            <CardDescription>Manage fixed fees</CardDescription>
          </div>
          <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Add Fee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fixed Fee</DialogTitle>
                <DialogDescription>Define a fixed fee amount.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feeName">Name</Label>
                  <Input id="feeName" name="name" placeholder="Setup Fee, Shipping, etc." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="feeAmount">Amount</Label>
                    <Input id="feeAmount" name="amount" type="number" step="0.01" placeholder="100.00" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="feeCurrency">Currency</Label>
                    <Input id="feeCurrency" name="currency" defaultValue="INR" placeholder="INR" required />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeDesc">Description</Label>
                  <Textarea id="feeDesc" name="description" placeholder="Optional description" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {fees.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">No fees defined.</div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between rounded-lg border p-3">
                 <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{fee.name}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(fee.amount, fee.currency)}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteFee(fee.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
