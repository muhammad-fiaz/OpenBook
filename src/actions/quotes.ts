"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { convertToBase } from "@/lib/financial";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const Decimal = Prisma.Decimal;

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, organizationId: true, role: true },
  });
  if (!user?.organizationId) throw new Error("No organization found");
  return { userId: user.id, orgId: user.organizationId, role: user.role };
}

export async function getQuotes(filters?: { status?: string }) {
  const { orgId } = await getSessionUser();
  const quotes = await prisma.quote.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status && filters.status !== "ALL" ? { status: filters.status as any } : {}),
    },
    include: {
      client: { select: { name: true, company: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    publicId: q.publicId,
    clientName: q.client.name,
    clientCompany: q.client.company,
    issueDate: q.issueDate.toISOString(),
    expiryDate: q.expiryDate.toISOString(),
    total: q.total.toString(),
    baseTotal: q.baseTotal.toString(),
    originalCurrency: q.originalCurrency,
    status: q.status,
    itemCount: q.items.length,
    convertedInvoiceId: q.convertedInvoiceId,
  }));
}

export async function getQuoteById(id: string) {
  const { orgId } = await getSessionUser();
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!quote) return null;
  return {
    ...quote,
    subtotal: quote.subtotal.toString(),
    tax: quote.tax.toString(),
    shipping: quote.shipping.toString(),
    discount: quote.discount.toString(),
    total: quote.total.toString(),
    baseTotal: quote.baseTotal.toString(),
    exchangeRate: quote.exchangeRate.toString(),
    issueDate: quote.issueDate.toISOString(),
    expiryDate: quote.expiryDate.toISOString(),
    createdAt: quote.createdAt.toISOString(),
    items: quote.items.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
      taxRate: item.taxRate.toString(),
      taxAmount: item.taxAmount.toString(),
    })),
  };
}

interface CreateQuoteInput {
  quoteNumber: string;
  clientId: string;
  issueDate: string;
  expiryDate: string;
  originalCurrency: string;
  exchangeRate: number;
  notes?: string;
  terms?: string;
  shipping?: number;
  discount?: number;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
}

export async function createQuote(input: CreateQuoteInput) {
  const { userId, orgId } = await getSessionUser();

  const items = input.items.map((item) => {
    const amount = item.quantity * item.unitPrice;
    const taxAmount = amount * (item.taxRate / 100);
    return { ...item, amount, taxAmount };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const shipping = input.shipping || 0;
  const discount = input.discount || 0;
  const total = subtotal + shipping + tax - discount;
  const baseTotal = convertToBase(total, input.exchangeRate);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: input.quoteNumber,
      clientId: input.clientId,
      createdById: userId,
      issueDate: new Date(input.issueDate),
      expiryDate: new Date(input.expiryDate),
      subtotal: new Decimal(subtotal.toFixed(4)),
      tax: new Decimal(tax.toFixed(4)),
      shipping: new Decimal(shipping.toFixed(4)),
      discount: new Decimal(discount.toFixed(4)),
      total: new Decimal(total.toFixed(4)),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Decimal(input.exchangeRate.toFixed(8)),
      baseTotal,
      notes: input.notes,
      terms: input.terms,
      organizationId: orgId,
      items: {
        create: items.map((item, index) => ({
          productId: item.productId || null,
          description: item.description,
          quantity: new Decimal(item.quantity.toFixed(4)),
          unitPrice: new Decimal(item.unitPrice.toFixed(4)),
          amount: new Decimal(item.amount.toFixed(4)),
          taxRate: new Decimal(item.taxRate.toFixed(4)),
          taxAmount: new Decimal(item.taxAmount.toFixed(4)),
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/user/quotes");
  return { id: quote.id, publicId: quote.publicId };
}

export async function updateQuoteStatus(id: string, status: string) {
  const { orgId } = await getSessionUser();
  await prisma.quote.updateMany({
    where: { id, organizationId: orgId },
    data: { status: status as any },
  });
  revalidatePath("/user/quotes");
  return { success: true };
}

export async function deleteQuote(id: string) {
  const { orgId } = await getSessionUser();
  await prisma.quote.deleteMany({ where: { id, organizationId: orgId } });
  revalidatePath("/user/quotes");
  return { success: true };
}

export async function convertQuoteToInvoice(quoteId: string) {
  const { orgId } = await getSessionUser();

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status === "CONVERTED") throw new Error("Quote already converted to invoice");

  const lastInvoice = await prisma.invoice.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });
  const lastNum = lastInvoice?.invoiceNumber
    ? Number.parseInt(lastInvoice.invoiceNumber.replace(/\D/g, ""), 10) || 0
    : 0;
  const invoiceNumber = `INV-${String(lastNum + 1).padStart(5, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId: quote.clientId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: quote.subtotal,
      tax: quote.tax,
      shipping: quote.shipping,
      discount: quote.discount,
      total: quote.total,
      originalCurrency: quote.originalCurrency,
      exchangeRate: quote.exchangeRate,
      baseTotal: quote.baseTotal,
      status: "DRAFT",
      notes: quote.notes,
      terms: quote.terms,
      organizationId: orgId,
      items: {
        create: quote.items.map((item, index) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          sortOrder: index,
        })),
      },
    },
  });

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "CONVERTED", convertedInvoiceId: invoice.id },
  });

  revalidatePath("/user/quotes");
  revalidatePath("/user/invoices");
  return { invoiceId: invoice.id, invoicePublicId: invoice.publicId };
}
