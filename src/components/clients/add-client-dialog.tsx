"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/actions/mutations";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "JPY", "CNY"];

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      country: formData.get("country") as string,
      postalCode: formData.get("postalCode") as string,
      taxId: formData.get("taxId") as string,
      currency: formData.get("currency") as string,
      shippingAddress: formData.get("shippingAddress") as string,
      shippingCity: formData.get("shippingCity") as string,
      shippingState: formData.get("shippingState") as string,
      shippingCountry: formData.get("shippingCountry") as string,
      shippingPostalCode: formData.get("shippingPostalCode") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      isBusiness: formData.get("isBusiness") === "on",
      workEmail: formData.get("workEmail") as string,
      personalEmail: formData.get("personalEmail") as string,
      workAddress: formData.get("workAddress") as string,
      personalAddress: formData.get("personalAddress") as string,
      socialMedia: {
          twitter: formData.get("twitter"),
          facebook: formData.get("facebook"),
          instagram: formData.get("instagram"),
          linkedin: formData.get("linkedin"),
      },
    };

    try {
      await createClient(data);
      toast.success("Client added successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
             Enter client details for invoicing and communication.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            <div className="flex items-center gap-2 mb-2">
                <Input type="checkbox" id="isBusiness" name="isBusiness" className="h-4 w-4 rounded border-gray-300" defaultChecked />
                <Label htmlFor="isBusiness">Is this a Business Client?</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Name *</Label>
                 <Input id="name" name="name" required placeholder="To differentiate" />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="company">Company / Legal Name</Label>
                 <Input id="company" name="company" placeholder="Business Name" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Primary Email</Label>
                    <Input id="email" name="email" type="email" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                </div>
            </div>

            <details className="text-sm group">
                <summary className="cursor-pointer font-medium text-primary hover:underline mb-2">Detailed Contact Info</summary>
                <div className="grid gap-3 pl-2 border-l-2 my-2">
                    <div className="grid gap-2">
                        <Label htmlFor="workEmail">Work Email</Label>
                        <Input id="workEmail" name="workEmail" type="email" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="personalEmail">Personal Email</Label>
                        <Input id="personalEmail" name="personalEmail" type="email" />
                    </div>
                </div>
            </details>

            <details className="text-sm group">
                <summary className="cursor-pointer font-medium text-primary hover:underline mb-2">Addresses</summary>
                <div className="grid gap-3 pl-2 border-l-2 my-2">
                        <div className="grid gap-2">
                        <Label htmlFor="address">Primary Address</Label>
                        <Input id="address" name="address" />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="shippingAddress">Shipping Address</Label>
                        <Input id="shippingAddress" name="shippingAddress" />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="workAddress">Work Address</Label>
                        <Input id="workAddress" name="workAddress" />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="personalAddress">Personal Address</Label>
                        <Input id="personalAddress" name="personalAddress" />
                        </div>
                </div>
            </details>

             <details className="text-sm group">
                <summary className="cursor-pointer font-medium text-primary hover:underline mb-2">Social Media</summary>
                 <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 my-2">
                     <div className="grid gap-2">
                        <Label htmlFor="twitter">Twitter (X)</Label>
                        <Input id="twitter" name="twitter" placeholder="@handle" />
                     </div>
                      <div className="grid gap-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input id="linkedin" name="linkedin" />
                     </div>
                      <div className="grid gap-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input id="facebook" name="facebook" />
                     </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input id="instagram" name="instagram" />
                     </div>
                </div>
            </details>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" name="company" placeholder="Acme Inc." />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+1 234 567 890" />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border-t pt-4 mt-2">
               <h4 className="text-sm font-medium mb-3 text-primary">Billing Address</h4>
               <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" name="address" placeholder="123 Main St" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input id="state" name="state" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal/Zip Code</Label>
                        <Input id="postalCode" name="postalCode" />
                    </div>
                 </div>
               </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-4 mt-2">
               <h4 className="text-sm font-medium mb-3 text-primary">Shipping Address (Optional)</h4>
               <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="shippingAddress">Street Address</Label>
                    <Input id="shippingAddress" name="shippingAddress" placeholder="Same as billing if empty" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="shippingCity">City</Label>
                        <Input id="shippingCity" name="shippingCity" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shippingState">State/Province</Label>
                        <Input id="shippingState" name="shippingState" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="shippingCountry">Country</Label>
                        <Input id="shippingCountry" name="shippingCountry" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shippingPostalCode">Postal/Zip Code</Label>
                        <Input id="shippingPostalCode" name="shippingPostalCode" />
                    </div>
                 </div>
               </div>
            </div>

            {/* Financial Details */}
            <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 text-primary">Financial Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select name="currency" defaultValue="INR">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / VAT No.</Label>
                    <Input id="taxId" name="taxId" />
                    </div>
                </div>
                 <div className="space-y-2 mt-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select name="paymentTerms" defaultValue="Net 30">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                             <SelectItem value="Net 15">Net 15</SelectItem>
                             <SelectItem value="Net 30">Net 30</SelectItem>
                             <SelectItem value="Net 60">Net 60</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
