import { NextResponse } from "next/server";
import { generate } from "@pdfme/generator";
import { text, image, barcodes, line } from "@pdfme/schemas";
import type { Template } from "@pdfme/common";
import { getInvoiceById } from "@/actions/queries";
import { formatCurrency } from "@/lib/financial";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Build pdfme table data
  const tableContent = invoice.items.map((item) => [
    item.description,
    Number(item.quantity).toString(),
    formatCurrency(item.unitPrice, invoice.originalCurrency),
    `${Number(item.taxRate)}%`,
    formatCurrency(item.amount, invoice.originalCurrency),
  ]);

  const template: Template = {
    basePdf: { width: 210, height: 297, padding: [15, 15, 15, 15] },
    schemas: [
      [
        {
          name: "title",
          type: "text",
          position: { x: 15, y: 15 },
          width: 100,
          height: 12,
          fontSize: 24,
          fontColor: "#111827",
          content: "INVOICE",
        },
        {
          name: "invoiceNumber",
          type: "text",
          position: { x: 120, y: 15 },
          width: 75,
          height: 8,
          fontSize: 12,
          alignment: "right",
          fontColor: "#6b7280",
          content: `#${invoice.invoiceNumber}`,
        },
        {
          name: "dates",
          type: "text",
          position: { x: 120, y: 25 },
          width: 75,
          height: 12,
          fontSize: 9,
          alignment: "right",
          fontColor: "#6b7280",
          lineHeight: 1.5,
          content: `Issue: ${new Date(invoice.issueDate).toLocaleDateString()}\nDue: ${new Date(invoice.dueDate).toLocaleDateString()}`,
        },
        {
          name: "separator1",
          type: "line",
          position: { x: 15, y: 42 },
          width: 180,
          height: 0.3,
          color: "#e5e7eb",
          content: "",
        },
        {
          name: "billTo",
          type: "text",
          position: { x: 15, y: 48 },
          width: 90,
          height: 20,
          fontSize: 10,
          fontColor: "#374151",
          lineHeight: 1.5,
          content: `Bill To:\n${invoice.client.name}${invoice.client.company ? `\n${invoice.client.company}` : ""}${invoice.client.email ? `\n${invoice.client.email}` : ""}`,
        },
        {
          name: "status",
          type: "text",
          position: { x: 120, y: 48 },
          width: 75,
          height: 8,
          fontSize: 11,
          alignment: "right",
          fontColor: invoice.status === "PAID" ? "#16a34a" : invoice.status === "OVERDUE" ? "#dc2626" : "#d97706",
          content: `Status: ${invoice.status}`,
        },
        {
          name: "itemsTable",
          type: "table",
          position: { x: 15, y: 78 },
          width: 180,
          height: 50,
          content: JSON.stringify(tableContent),
          showHead: true,
          head: ["Description", "Qty", "Unit Price", "Tax", "Amount"],
          headWidthPercentages: [40, 10, 20, 10, 20],
          tableStyles: {
            borderWidth: 0.3,
            borderColor: "#e5e7eb",
          },
          headStyles: {
            fontSize: 9,
            characterSpacing: 0,
            alignment: "left",
            verticalAlignment: "middle",
            lineHeight: 1,
            fontColor: "#ffffff",
            borderColor: "",
            backgroundColor: "#1f2937",
            borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
            padding: { top: 4, right: 4, bottom: 4, left: 4 },
          },
          bodyStyles: {
            fontSize: 9,
            characterSpacing: 0,
            alignment: "left",
            verticalAlignment: "middle",
            lineHeight: 1,
            fontColor: "#374151",
            borderColor: "#e5e7eb",
            backgroundColor: "",
            alternateBackgroundColor: "#f9fafb",
            borderWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
            padding: { top: 4, right: 4, bottom: 4, left: 4 },
          },
          columnStyles: {},
        },
        {
          name: "totals",
          type: "text",
          position: { x: 120, y: 200 },
          width: 75,
          height: 40,
          fontSize: 10,
          alignment: "right",
          fontColor: "#374151",
          lineHeight: 1.8,
          content: `Subtotal: ${formatCurrency(invoice.subtotal, invoice.originalCurrency)}\nTax: ${formatCurrency(invoice.tax, invoice.originalCurrency)}${Number(invoice.discount) > 0 ? `\nDiscount: -${formatCurrency(invoice.discount, invoice.originalCurrency)}` : ""}\nTotal: ${formatCurrency(invoice.total, invoice.originalCurrency)}\nBase (INR): ${formatCurrency(invoice.baseTotal)}`,
        },
        {
          name: "footer",
          type: "text",
          position: { x: 15, y: 260 },
          width: 180,
          height: 20,
          fontSize: 8,
          fontColor: "#9ca3af",
          lineHeight: 1.5,
          content: `${invoice.notes ? `Notes: ${invoice.notes}\n` : ""}${invoice.terms ? `Terms: ${invoice.terms}` : ""}`,
        },
      ],
    ],
  };

  const inputs = [
    {
      title: "INVOICE",
      invoiceNumber: `#${invoice.invoiceNumber}`,
      dates: `Issue: ${new Date(invoice.issueDate).toLocaleDateString()}\nDue: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      billTo: `Bill To:\n${invoice.client.name}${invoice.client.company ? `\n${invoice.client.company}` : ""}`,
      status: `Status: ${invoice.status}`,
      itemsTable: tableContent,
      totals: `Subtotal: ${formatCurrency(invoice.subtotal, invoice.originalCurrency)}\nTax: ${formatCurrency(invoice.tax, invoice.originalCurrency)}\nTotal: ${formatCurrency(invoice.total, invoice.originalCurrency)}`,
      footer: invoice.notes ?? "",
    },
  ];

  const plugins = {
    text,
    image,
    qrcode: barcodes.qrcode,
    line,
    table: (await import("@pdfme/schemas")).table,
  };

  const pdf = await generate({ template, inputs, plugins });

  return new NextResponse(pdf.buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
