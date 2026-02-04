"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getOrganizationSettings, updateBaseCurrency } from "@/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "CNY", label: "Chinese Yuan (¥)" },
];

export function CurrencySetupCheck() {
  const [isOpen, setIsOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      try {
        const settings = await getOrganizationSettings();
        const metadata = settings?.org?.metadata as Record<string, any> | null;
        if (!metadata?.onboardingComplete) {
            setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to check onboarding status");
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateBaseCurrency(currency);
      toast.success("Base currency updated");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update currency");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to OpenBook</DialogTitle>
          <DialogDescription>
            Please select your organization's base currency. This will be used for all financial reporting.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Select onValueChange={setCurrency} defaultValue={currency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
