"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { convertToBase, computeInvoiceStatus, computeTotalPaid } from "@/lib/financial";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { revalidatePath } from "next/cache";

async function getOrgId(): Promise<string> {
  const session = await auth.api.getSession({
     headers: await headers()
  });
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, name: true, email: true }
  });

  if (!user?.organizationId) {
       throw new Error("Organization not found. Please create one on dashboard first.");
  }

  return user.organizationId;
}

interface CreateInvoiceInput {
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  originalCurrency: string;
  exchangeRate: number;
  notes?: string;
  terms?: string;
  templateId?: string;
  paymentMethodId?: string;
  shipping?: number;
  shippingTaxRate?: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const orgId = await getOrgId();

  const items = input.items.map((item) => {
    const amount = item.quantity * item.unitPrice;
    const taxAmount = amount * (item.taxRate / 100);
    return { ...item, amount, taxAmount };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const itemsTax = items.reduce((sum, item) => sum + item.taxAmount, 0);

  const shipping = input.shipping || 0;
  const shippingTaxRate = input.shippingTaxRate || 0;
  const shippingTax = shipping * (shippingTaxRate / 100);

  const tax = itemsTax + shippingTax;
  const total = subtotal + shipping + tax;
  
  const baseTotal = convertToBase(total, input.exchangeRate);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: input.invoiceNumber,
      clientId: input.clientId,
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      subtotal: new Decimal(subtotal.toFixed(4)),
      tax: new Decimal(tax.toFixed(4)),
      shipping: new Decimal(shipping.toFixed(4)),
      shippingTaxRate: new Decimal(shippingTaxRate.toFixed(4)),
      discount: new Decimal(0),
      total: new Decimal(total.toFixed(4)),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Decimal(input.exchangeRate.toFixed(8)),
      baseTotal,
      status: "DRAFT",
      notes: input.notes,
      terms: input.terms,
      templateId: input.templateId,
      paymentMethodId: input.paymentMethodId,
      organizationId: orgId,
      items: {
        create: items.map((item, index) => ({
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

  revalidatePath("/user/invoices");
  return { id: invoice.id, publicId: invoice.publicId };
}

interface RecordPaymentInput {
  invoiceId: string;
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  provider: string;
  paymentMethod: string;
  paymentDate: string;
  providerTransactionId?: string;
  referenceNumber?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export async function recordPayment(input: RecordPaymentInput) {
  const orgId = await getOrgId();
  const baseAmount = convertToBase(input.originalAmount, input.exchangeRate);

  const payment = await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      originalAmount: new Decimal(input.originalAmount.toFixed(4)),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Decimal(input.exchangeRate.toFixed(8)),
      baseAmount,
      provider: input.provider as "STRIPE" | "RAZORPAY" | "PAYPAL" | "WISE" | "BANK_TRANSFER" | "SWIFT" | "ACH" | "UPI" | "MANUAL" | "OTHER",
      paymentMethod: input.paymentMethod as "CARD" | "ACH" | "SWIFT" | "NET_BANKING" | "UPI" | "WIRE" | "CASH" | "OTHER",
      status: "SUCCESS",
      paymentDate: new Date(input.paymentDate),
      providerTransactionId: input.providerTransactionId,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      metadata: (input.metadata as Record<string, string>) ?? undefined,
      organizationId: orgId,
      internalTransactionId: `INT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: { where: { status: "SUCCESS" } } },
  });

  if (invoice) {
    const totalPaid = computeTotalPaid(invoice.payments);
    const newStatus = computeInvoiceStatus(
      invoice.baseTotal,
      totalPaid,
      invoice.dueDate,
      invoice.status,
    );

    await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: { status: newStatus as "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" },
    });
  }

  revalidatePath("/user/invoices");
  revalidatePath("/user/payments");
  return { id: payment.id };
}

interface CreateTransactionInput {
  type: "INCOME" | "EXPENSE";
  description: string;
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  taxAmount?: number;
  date: string;
  categoryId?: string;
  notes?: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  const orgId = await getOrgId();
  const baseAmount = convertToBase(input.originalAmount, input.exchangeRate);

  const transaction = await prisma.transaction.create({
    data: {
      type: input.type,
      description: input.description,
      originalAmount: new Decimal(input.originalAmount.toFixed(4)),
      originalCurrency: input.originalCurrency,
      exchangeRate: new Decimal(input.exchangeRate.toFixed(8)),
      baseAmount,
      taxAmount: input.taxAmount ? new Decimal(input.taxAmount.toFixed(4)) : new Decimal(0),
      date: new Date(input.date),
      categoryId: input.categoryId,
      notes: input.notes,
      organizationId: orgId,
    },
  });

  revalidatePath("/user/transactions");
  revalidatePath("/user/income");
  revalidatePath("/user/expenses");
  revalidatePath("/user/dashboard");
  return { id: transaction.id };
}

interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  currency?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  paymentTerms?: string;
  isBusiness?: boolean;
  workEmail?: string;
  personalEmail?: string;
  workAddress?: string;
  personalAddress?: string;
  socialMedia?: any;
}

export async function createClient(input: CreateClientInput) {
  const orgId = await getOrgId();

  const client = await prisma.client.create({
    data: {
      ...input,
      currency: input.currency ?? "INR",
      organizationId: orgId,
    },
  });

  revalidatePath("/user/clients");
  return { id: client.id };
}
