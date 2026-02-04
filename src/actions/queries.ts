"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeTotalPaid, computeOutstanding, computeAgingBuckets } from "@/lib/financial";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

async function getOrgId(required = true): Promise<string | null> {
  const session = await auth.api.getSession({
     headers: await headers()
  });
  
  if (!session?.user?.id) {
    if (required) throw new Error("Unauthorized");
    return null;
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, name: true, email: true }
  });

  return user?.organizationId || null;
}

type DateRangePreset = "ALL" | "THIS_MONTH" | "LAST_MONTH" | "LAST_6_MONTHS" | "LAST_YEAR" | "THIS_YEAR" | string;

function getDateRange(range?: DateRangePreset): { gte?: Date; lte?: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!range || range === "ALL") return {};

    if (range === "THIS_MONTH") {
        return { 
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
    if (range === "LAST_MONTH") {
        return {
             gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
             lte: new Date(now.getFullYear(), now.getMonth(), 0)
        };
    }
    if (range === "LAST_6_MONTHS") {
        return {
            gte: new Date(now.getFullYear(), now.getMonth() - 6, 1)
        };
    }
    if (range === "THIS_YEAR") {
        return {
            gte: new Date(now.getFullYear(), 0, 1)
        };
    }
    if (range === "LAST_YEAR") {
        return {
             gte: new Date(now.getFullYear() - 1, 0, 1),
             lte: new Date(now.getFullYear() - 1, 11, 31)
        };
    }

    return {};
}

export async function getDashboardStats(rangePreset?: string) {
  const orgId = await getOrgId(false);
  
  if (!orgId) {
      return {
          totalIncome: "0",
          totalExpense: "0",
          netProfit: "0",
          totalPaid: "0",
          outstandingReceivables: "0",
          overdueReceivables: "0",
          upcomingReceivables: "0",
          averageDealSize: "0",
          agingBuckets: { 
              current: "0", 
              thirtyDays: "0", 
              sixtyDays: "0", 
              ninetyDays: "0", 
              over90Days: "0" 
          },
      };
  }

  const dateFilter = getDateRange(rangePreset);

  const [totalIncome, totalExpense, invoices, payments] = await Promise.all([
    prisma.transaction.aggregate({
      where: { 
          organizationId: orgId, 
          type: "INCOME",
          ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {})
      },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { 
          organizationId: orgId, 
          type: "EXPENSE",
          ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {})
      },
      _sum: { baseAmount: true },
    }),
    prisma.invoice.findMany({
      where: { 
          organizationId: orgId, 
          status: { not: "CANCELLED" },
          ...(dateFilter.gte || dateFilter.lte ? { issueDate: dateFilter } : {})
      },
      include: { payments: { where: { status: "SUCCESS" } } },
    }),
    prisma.payment.aggregate({
      where: { 
          organizationId: orgId, 
          status: "SUCCESS",
          ...(dateFilter.gte || dateFilter.lte ? { paymentDate: dateFilter } : {})
      },
      _sum: { baseAmount: true },
    }),
  ]);

  const income = totalIncome._sum.baseAmount ?? new Decimal(0);
  const expense = totalExpense._sum.baseAmount ?? new Decimal(0);
  const netProfit = new Decimal(income.toString()).sub(new Decimal(expense.toString()));
  const totalPaid = payments._sum.baseAmount ?? new Decimal(0);

  const now = new Date();
  let outstandingReceivables = new Decimal(0);
  let overdueReceivables = new Decimal(0);
  let upcomingReceivables = new Decimal(0);
  let totalInvoicedAmount = new Decimal(0);

  const agingInput = invoices.map((inv) => {
    const paid = computeTotalPaid(inv.payments);
    const outstanding = computeOutstanding(inv.baseTotal, paid);

    totalInvoicedAmount = totalInvoicedAmount.add(inv.baseTotal);

    if (outstanding.gt(0)) {
      outstandingReceivables = outstandingReceivables.add(outstanding);
      if (new Date(inv.dueDate) < now) {
        overdueReceivables = overdueReceivables.add(outstanding);
      } else {
        upcomingReceivables = upcomingReceivables.add(outstanding);
      }
    }

    return {
      dueDate: inv.dueDate,
      baseTotal: inv.baseTotal,
      totalPaid: paid,
    };
  });

  const agingBuckets = computeAgingBuckets(agingInput);
  const rawAvg = invoices.length > 0 ? totalInvoicedAmount.div(invoices.length) : new Decimal(0);

  return {
    totalIncome: income.toString(),
    totalExpense: expense.toString(),
    netProfit: netProfit.toString(),
    totalPaid: totalPaid.toString(),
    outstandingReceivables: outstandingReceivables.toString(),
    overdueReceivables: overdueReceivables.toString(),
    upcomingReceivables: upcomingReceivables.toString(),
    averageDealSize: rawAvg.toString(),
    agingBuckets: {
      current: agingBuckets.current.toString(),
      thirtyDays: agingBuckets.thirtyDays.toString(),
      sixtyDays: agingBuckets.sixtyDays.toString(),
      ninetyDays: agingBuckets.ninetyDays.toString(),
      over90Days: agingBuckets.over90Days.toString(),
    },
  };
}

export async function getMonthlyRevenueTrend(rangePreset?: string) {
  const orgId = await getOrgId(false);
  if (!orgId) return [];

  const dateFilter = getDateRange(rangePreset);
  
  let dateQuery: any = { organizationId: orgId };
  if (dateFilter.gte || dateFilter.lte) {
      dateQuery.date = dateFilter;
  } else {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      dateQuery.date = { gte: twelveMonthsAgo };
  }

  const transactions = await prisma.transaction.findMany({
    where: dateQuery,
    select: { type: true, baseAmount: true, date: true },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    const amount = Number(tx.baseAmount.toString());

    if (tx.type === "INCOME") {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }
    monthlyMap.set(key, existing);
  }

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
    profit: data.income - data.expense,
  }));
}

export async function getPaymentDistribution(rangePreset?: string) {
  const orgId = await getOrgId(false);
  if (!orgId) return { byProvider: [], byMethod: [] };

  const dateFilter = getDateRange(rangePreset);
  
  const widthDateFilter = dateFilter.gte || dateFilter.lte ? { paymentDate: dateFilter } : {};

  const [byProvider, byMethod] = await Promise.all([
    prisma.payment.groupBy({
      by: ["provider"],
      where: { 
          organizationId: orgId, 
          status: "SUCCESS",
          ...widthDateFilter
      },
      _sum: { baseAmount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: { 
          organizationId: orgId, 
          status: "SUCCESS",
          ...widthDateFilter
      },
      _sum: { baseAmount: true },
      _count: true,
    }),
  ]);

  return {
    byProvider: byProvider.map((p) => ({
      provider: p.provider,
      amount: p._sum.baseAmount?.toString() ?? "0",
      count: p._count,
    })),
    byMethod: byMethod.map((m) => ({
      method: m.paymentMethod,
      amount: m._sum.baseAmount?.toString() ?? "0",
      count: m._count,
    })),
  };
}

export async function getClientRanking() {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    include: {
      invoices: {
        where: { status: { not: "CANCELLED" } },
        select: { baseTotal: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return clients
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      totalRevenue: c.invoices
        .reduce((sum: number, inv: any) => sum + Number(inv.baseTotal.toString()), 0)
        .toString(),
      invoiceCount: c.invoices.length,
    }))
    .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue));
}


export async function getInvoices(filters?: { from?: Date; to?: Date; status?: string }) {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const where: Prisma.InvoiceWhereInput = { 
    organizationId: orgId,
    ...(filters?.status ? { status: filters.status as any } : {}),
    ...(filters?.from || filters?.to ? {
        issueDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {})
        }
    } : {})
  };

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { name: true, company: true } },
      payments: { where: { status: "SUCCESS" }, select: { baseAmount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => {
    const totalPaid = computeTotalPaid(inv.payments);
    const outstanding = computeOutstanding(inv.baseTotal, totalPaid);

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      publicId: inv.publicId,
      clientName: inv.client.name,
      clientCompany: inv.client.company,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      total: inv.total.toString(),
      baseTotal: inv.baseTotal.toString(),
      originalCurrency: inv.originalCurrency,
      status: inv.status,
      totalPaid: totalPaid.toString(),
      outstanding: outstanding.toString(),
    };
  });
}

export async function getInvoiceById(id: string) {
  const orgId = await getOrgId();
  if (!orgId) return null;

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      template: true,
    },
  });

  if (!invoice) return null;

  const totalPaid = computeTotalPaid(invoice.payments);
  const outstanding = computeOutstanding(invoice.baseTotal, totalPaid);

  return {
    ...invoice,
    totalPaid: totalPaid.toString(),
    outstanding: outstanding.toString(),
    subtotal: invoice.subtotal.toString(),
    tax: invoice.tax.toString(),
    discount: invoice.discount.toString(),
    total: invoice.total.toString(),
    baseTotal: invoice.baseTotal.toString(),
    exchangeRate: invoice.exchangeRate.toString(),
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
      taxRate: item.taxRate.toString(),
      taxAmount: item.taxAmount.toString(),
    })),
    payments: invoice.payments.map((p) => ({
      ...p,
      originalAmount: p.originalAmount.toString(),
      exchangeRate: p.exchangeRate.toString(),
      baseAmount: p.baseAmount.toString(),
      paymentDate: p.paymentDate.toISOString(),
    })),
  };
}

export async function getPublicInvoice(publicId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicId },
    include: {
      client: { select: { name: true, company: true, email: true } },
      items: { orderBy: { sortOrder: "asc" } },
      payments: {
        where: { status: "SUCCESS" },
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          originalAmount: true,
          originalCurrency: true,
          baseAmount: true,
          paymentMethod: true,
          paymentDate: true,
          status: true,
        },
      },
      organization: { select: { name: true, logo: true, brandColor: true } },
    },
  });

  if (!invoice) return null;

  const totalPaid = computeTotalPaid(invoice.payments);
  const outstanding = computeOutstanding(invoice.baseTotal, totalPaid);

  return {
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.client.name,
    clientCompany: invoice.client.company,
    clientEmail: invoice.client.email,
    organizationName: invoice.organization.name,
    organizationLogo: invoice.organization.logo,
    brandColor: invoice.organization.brandColor,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    subtotal: invoice.subtotal.toString(),
    tax: invoice.tax.toString(),
    discount: invoice.discount.toString(),
    total: invoice.total.toString(),
    baseTotal: invoice.baseTotal.toString(),
    originalCurrency: invoice.originalCurrency,
    status: invoice.status,
    notes: invoice.notes,
    terms: invoice.terms,
    totalPaid: totalPaid.toString(),
    outstanding: outstanding.toString(),
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
      taxRate: item.taxRate.toString(),
      taxAmount: item.taxAmount.toString(),
    })),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      originalAmount: p.originalAmount.toString(),
      originalCurrency: p.originalCurrency,
      baseAmount: p.baseAmount.toString(),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate.toISOString(),
      status: p.status,
    })),
  };
}

export async function getTransactions(
  type?: "INCOME" | "EXPENSE",
  rangePreset?: string,
  sortBy: "date" | "amount" = "date",
  sortOrder: "asc" | "desc" = "desc",
  categoryId?: string,
  search?: string
) {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const dateFilter = getDateRange(rangePreset);

  const orderBy = sortBy === "amount" 
    ? { baseAmount: sortOrder } 
    : { date: sortOrder };

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      ...(type ? { type } : {}),
      ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {}),
      ...(categoryId && categoryId !== "ALL" ? { categoryId } : {}),
      ...(search ? {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ]
      } : {})
    },
    include: { category: { select: { name: true, color: true } } },
    orderBy: orderBy as any,
  });

  return transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    description: tx.description,
    originalAmount: tx.originalAmount.toString(),
    originalCurrency: tx.originalCurrency,
    exchangeRate: tx.exchangeRate.toString(),
    baseAmount: tx.baseAmount.toString(),
    date: tx.date.toISOString(),
    categoryName: tx.category?.name ?? null,
    categoryColor: tx.category?.color ?? null,
    notes: tx.notes,
  }));
}

export async function getCategories(type?: "INCOME" | "EXPENSE") {
  const orgId = await getOrgId();
  if (!orgId) return [];

  return prisma.category.findMany({
    where: {
      organizationId: orgId,
      ...(type ? { type } : {}),
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}


export async function getClients(rangePreset?: string) {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const dateFilter = getDateRange(rangePreset);

  const clients = await prisma.client.findMany({
    where: { 
        organizationId: orgId,
        ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {})
    },
    include: {
      _count: { select: { invoices: true } },
    },
    orderBy: { name: "asc" },
  });

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    phone: c.phone,
    country: c.country,
    currency: c.currency,
    invoiceCount: c._count.invoices,
  }));
}


export async function getPayments(rangePreset?: string) {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const dateFilter = getDateRange(rangePreset);

  const payments = await prisma.payment.findMany({
    where: { 
        organizationId: orgId,
        ...(dateFilter.gte || dateFilter.lte ? { paymentDate: dateFilter } : {})
    },
    include: {
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    invoiceNumber: p.invoice?.invoiceNumber ?? "N/A",
    originalAmount: p.originalAmount.toString(),
    originalCurrency: p.originalCurrency,
    baseAmount: p.baseAmount.toString(),
    provider: p.provider,
    paymentMethod: p.paymentMethod,
    status: p.status,
    paymentDate: p.paymentDate.toISOString(),
    referenceNumber: p.referenceNumber,
  }));
}
