"use server";

import { getInvoices, getClients, getTransactions, getPayments } from "@/actions/queries";
import { getQuotes } from "@/actions/quotes";
import { getTimeEntries, getProjects } from "@/actions/time-tracking";
import { getProducts } from "@/actions/products";
import { formatCurrency } from "@/lib/financial";

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
}

export async function exportInvoicesToCSV(filters?: { from?: Date; to?: Date; status?: string }) {
  const invoices = await getInvoices(filters);
  const headers = [
    "Invoice Number", "Client", "Company", "Issue Date", "Due Date",
    "Base Total", "Total Paid", "Outstanding", "Status", "Currency", "Original Total",
  ];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber, inv.clientName, inv.clientCompany ?? "",
    new Date(inv.issueDate).toLocaleDateString(),
    new Date(inv.dueDate).toLocaleDateString(),
    inv.baseTotal, inv.totalPaid, inv.outstanding,
    inv.status, inv.originalCurrency, inv.total,
  ]);
  return toCSV(headers, rows);
}

export async function exportClientsToCSV() {
  const clients = await getClients();
  const headers = ["Name", "Company", "Email", "Phone", "Currency"];
  const rows = clients.map((c) => [
    c.name, c.company ?? "", c.email ?? "", c.phone ?? "",
    c.currency ?? "",
  ]);
  return toCSV(headers, rows);
}

export async function exportTransactionsToCSV() {
  const txns = await getTransactions();
  const headers = ["Date", "Type", "Category", "Description", "Amount", "Currency"];
  const rows = txns.map((t) => [
    new Date(t.date).toLocaleDateString(), t.type,
    t.categoryName ?? "", t.description ?? "", t.baseAmount, t.originalCurrency,
  ]);
  return toCSV(headers, rows);
}

export async function exportQuotesToCSV() {
  const quotes = await getQuotes();
  const headers = ["Quote Number", "Client", "Issue Date", "Expiry Date", "Total", "Currency", "Status"];
  const rows = quotes.map((q) => [
    q.quoteNumber, q.clientName, new Date(q.issueDate).toLocaleDateString(),
    new Date(q.expiryDate).toLocaleDateString(), q.total, q.originalCurrency, q.status,
  ]);
  return toCSV(headers, rows);
}

export async function exportTimeEntriesToCSV() {
  const entries = await getTimeEntries();
  const headers = ["Date", "Project", "User", "Description", "Hours", "Rate", "Amount", "Billable", "Billed"];
  const rows = entries.map((e) => [
    new Date(e.date).toLocaleDateString(), e.projectName, e.userName,
    e.description ?? "", e.hours, e.hourlyRate, e.amount,
    e.isBillable ? "Yes" : "No", e.isBilled ? "Yes" : "No",
  ]);
  return toCSV(headers, rows);
}

export async function exportProductsToCSV() {
  const products = await getProducts();
  const headers = ["Name", "SKU", "Type", "Unit Price", "Currency", "Tax Rate", "Unit", "Active"];
  const rows = products.map((p) => [
    p.name, p.sku ?? "", p.type, p.unitPrice, p.currency, p.taxRate,
    p.unit ?? "", p.isActive ? "Yes" : "No",
  ]);
  return toCSV(headers, rows);
}

export async function exportPaymentsToCSV() {
  const payments = await getPayments();
  const headers = ["Invoice Number", "Amount", "Currency", "Provider", "Method", "Status", "Payment Date", "Reference"];
  const rows = payments.map((p) => [
    p.invoiceNumber, p.originalAmount, p.originalCurrency,
    p.provider, p.paymentMethod, p.status,
    new Date(p.paymentDate).toLocaleDateString(), p.referenceNumber ?? "",
  ]);
  return toCSV(headers, rows);
}
