"use client";

import { useEffect, useRef, useState } from "react";
import { generate } from "@pdfme/generator";
import { Template } from "@pdfme/common";
import { invoiceTemplate } from "@/lib/pdf-template";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface InvoicePDFViewerProps {
  invoice: any; 
  mode?: "button" | "preview";
}

export function InvoicePDFViewer({ invoice, mode = "preview" }: InvoicePDFViewerProps) {
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  const inputs: Record<string, string>[] = [
    {
      companyName: "INVOICE",
      invoiceTitle: "INVOICE",
      invoiceNumber: invoice.invoiceNumber,
      date: new Date(invoice.issueDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      clientName: invoice.client.name,
      clientAddress: invoice.client.billingAddress || invoice.client.email,
      
      subtotal: `${invoice.subtotal} ${invoice.originalCurrency}`,
      tax: `${invoice.tax} ${invoice.originalCurrency}`,
      total: `${invoice.total} ${invoice.originalCurrency}`,

      paymentInfo: (invoice.paymentMethod ? 
        `${invoice.paymentMethod.name}\n${JSON.stringify(invoice.paymentMethod.details, null, 2)}\n\n` 
        : "") + (invoice.terms || ""),

      ...invoice.items.reduce((acc: any, item: any, index: number) => {
        if (index >= 15) return acc;
        return {
          ...acc,
          [`item_desc_${index}`]: item.description,
          [`item_qty_${index}`]: item.quantity.toString(),
          [`item_price_${index}`]: item.unitPrice.toString(),
          [`item_total_${index}`]: item.amount.toString(),
        };
      }, {}),
    },
  ];

  const generatePDF = async () => {
    const template: Template = invoiceTemplate;
    const pdf = await generate({ template, inputs });
    return new Blob([pdf.buffer], { type: "application/pdf" });
  };

  useEffect(() => {
    if (mode === "preview") {
        let url = "";
        generatePDF().then((blob) => {
        url = URL.createObjectURL(blob);
        if (pdfRef.current) {
            pdfRef.current.src = url;
            setLoading(false);
        }
        });
        return () => URL.revokeObjectURL(url);
    }
  }, [invoice, mode]);

  const handleDownload = async () => {
    try {
        const blob = await generatePDF();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
    }
  };

  if (mode === "button") {
      return (
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      );
  }

  return (
    <div className="border rounded-lg overflow-hidden h-[600px] bg-gray-100 flex items-center justify-center">
        <iframe
        ref={pdfRef}
        className="w-full h-full"
        title="Invoice PDF"
        />
    </div>
  );
}
