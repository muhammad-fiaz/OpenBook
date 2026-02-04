"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Setting } from "@prisma/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateInvoiceSettings } from "@/actions/settings";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  invoicePrefix: z.string().min(1, "Prefix is required"),
});

interface InvoiceDefaultsFormProps {
  settings: Setting[];
}

export function InvoiceDefaultsForm({ settings }: InvoiceDefaultsFormProps) {
  const [isPending, startTransition] = useTransition();

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultTerms: getSetting("invoice_default_terms"),
      defaultNotes: getSetting("invoice_default_notes"),
      invoicePrefix: getSetting("invoice_prefix") || "INV-",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateInvoiceSettings({
            defaultTerms: values.defaultTerms || "",
            defaultNotes: values.defaultNotes || "",
            invoicePrefix: values.invoicePrefix,
        });
        toast.success("Invoice defaults updated");
      } catch (error) {
        toast.error("Failed to update defaults");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Defaults</CardTitle>
        <CardDescription>
          Set default terms and templates for new invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="defaultTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Payment due within 30 days..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="defaultNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Thank you for your business!" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Defaults
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
