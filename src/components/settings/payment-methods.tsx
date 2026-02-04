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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Landmark, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { addPaymentMethod, deletePaymentMethod } from "@/actions/settings";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  details: any;
  isDefault: boolean;
}

const PAYMENT_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
  { value: "UPI", label: "UPI", icon: Wallet },
  { value: "PAYPAL", label: "PayPal", icon: CreditCard },
  { value: "STRIPE", label: "Stripe", icon: CreditCard },
  { value: "WISE", label: "Wise", icon: Landmark },
  { value: "OTHER", label: "Other", icon: CreditCard },
];

export function PaymentMethods({ methods }: { methods: PaymentMethod[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("BANK_TRANSFER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const isDefault = formData.get("isDefault") === "on";
    
    let details: any = {};
    
    if (type === "BANK_TRANSFER" || type === "WISE") {
        details = {
            accountName: formData.get("accountName"),
            accountNumber: formData.get("accountNumber"),
            bankName: formData.get("bankName"),
            routingNumber: formData.get("routingNumber"), // ACH
            swiftCode: formData.get("swiftCode"),
            ifscCode: formData.get("ifscCode"), // India
            currency: formData.get("currency"),
            beneficiaryAddress: formData.get("beneficiaryAddress"),
        };
    } else if (type === "UPI") {
        details = {
            upiId: formData.get("upiId"),
        };
    } else {
        details = {
            instructions: formData.get("instructions"),
        };
    }

    Object.keys(details).forEach(key => details[key] === "" && delete details[key]);

    try {
      await addPaymentMethod({ name, type, details, isDefault });
      toast.success("Payment method added");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to add payment method");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
      if (!confirm("Are you sure?")) return;
      try {
          await deletePaymentMethod(id);
          toast.success("Deleted");
      } catch (error) {
          toast.error("Failed to delete");
      }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
           <CardTitle>Payment Methods</CardTitle>
           <CardDescription>
             Manage payment instructions to display on your invoices.
           </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                        Buyers will see these details on the invoice.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Method Name</Label>
                        <Input name="name" placeholder="e.g. Bank Transfer (USD)" required />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                        <div className="flex items-center gap-2">
                                            <t.icon className="h-4 w-4" />
                                            {t.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic Fields */}
                    {(type === "BANK_TRANSFER" || type === "WISE") && (
                        <div className="space-y-3 border-l-2 pl-3 border-muted">
                            <div className="space-y-1">
                                <Label className="text-xs">Account Holder Name</Label>
                                <Input name="accountName" placeholder="Business Name" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Bank Name</Label>
                                <Input name="bankName" placeholder="Bank Name" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Account Number</Label>
                                <Input name="accountNumber" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Routing (ACH/Fedwire)</Label>
                                    <Input name="routingNumber" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">SWIFT / IBAN</Label>
                                    <Input name="swiftCode" />
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Account Currency</Label>
                                <Input name="currency" placeholder="USD" />
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Beneficiary Address</Label>
                                <Textarea name="beneficiaryAddress" placeholder="Address..." rows={2} />
                            </div>
                        </div>
                    )}

                    {type === "UPI" && (
                         <div className="space-y-3 border-l-2 pl-3 border-muted">
                            <div className="space-y-1">
                                <Label>UPI ID (VPA)</Label>
                                <Input name="upiId" placeholder="name@bank" required />
                            </div>
                        </div>
                    )}

                    {(type === "PAYPAL" || type === "STRIPE" || type === "OTHER") && (
                         <div className="space-y-3 border-l-2 pl-3 border-muted">
                             <div className="space-y-1">
                                <Label>Payment Instructions / Link</Label>
                                <Textarea name="instructions" placeholder="Enter payment link or instructions..." rows={4} />
                             </div>
                         </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox id="isDefault" name="isDefault" />
                        <Label htmlFor="isDefault">Set as default for new invoices</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Save Method"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
              {methods.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                      No payment methods added.
                  </div>
              )}
              {methods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-secondary rounded-full">
                             {method.type === "BANK_TRANSFER" || method.type === "WISE" ? <Landmark className="h-4 w-4" /> : 
                              method.type === "UPI" ? <Wallet className="h-4 w-4" /> :
                              <CreditCard className="h-4 w-4" />}
                          </div>
                          <div>
                              <div className="font-medium flex items-center gap-2">
                                  {method.name}
                                  {method.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 line-clamp-1 max-w-[300px]">
                                    {method.type === "BANK_TRANSFER" || method.type === "WISE" ? (
                                        <>
                                            {method.details.bankName} • {method.details.accountNumber}
                                        </>
                                    ) : method.type === "UPI" ? (
                                        method.details.upiId
                                    ) : (
                                        method.details.instructions || "No details"
                                    )}
                              </div>
                          </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </div>
              ))}
          </div>
      </CardContent>
    </Card>
  );
}
