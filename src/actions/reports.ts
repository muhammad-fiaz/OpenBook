"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/financial";

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

export async function getRevenueReport(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      issueDate: { gte: start, lte: end },
      status: { not: "DRAFT" },
    },
    select: {
      issueDate: true,
      total: true,
      baseTotal: true,
      originalCurrency: true,
      status: true,
    },
    orderBy: { issueDate: "asc" },
  });

  const monthlyMap = new Map<string, { total: number; paid: number; count: number }>();
  for (const inv of invoices) {
    const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key) ?? { total: 0, paid: 0, count: 0 };
    entry.total += inv.baseTotal.toNumber();
    if (inv.status === "PAID") entry.paid += inv.baseTotal.toNumber();
    entry.count++;
    monthlyMap.set(key, entry);
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalRevenue = invoices.reduce((sum, i) => sum + i.baseTotal.toNumber(), 0);
  const paidRevenue = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.baseTotal.toNumber(), 0);

  return { monthly, totalRevenue, paidRevenue, invoiceCount: invoices.length };
}


export async function getExpenseReport(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
    },
    select: {
      date: true,
      baseAmount: true,
      category: { select: { name: true } },
      description: true,
      originalCurrency: true,
    },
    orderBy: { date: "asc" },
  });

  const categoryMap = new Map<string, number>();
  for (const tx of transactions) {
    const cat = tx.category?.name ?? "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + tx.baseAmount.toNumber());
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const monthlyMap = new Map<string, number>();
  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + tx.baseAmount.toNumber());
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalExpense = transactions.reduce((sum, t) => sum + t.baseAmount.toNumber(), 0);

  return { byCategory, monthly, totalExpense, transactionCount: transactions.length };
}

export async function getProfitLossReport(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      status: "PAID",
      issueDate: { gte: start, lte: end },
    },
    select: { baseTotal: true, issueDate: true },
  });

  const incomeTransactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "INCOME",
      date: { gte: start, lte: end },
    },
    select: { baseAmount: true, date: true },
  });

  const expenseTransactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
    },
    select: { baseAmount: true, date: true, category: { select: { name: true } } },
  });

  const totalInvoiceRevenue = paidInvoices.reduce((s, i) => s + i.baseTotal.toNumber(), 0);
  const totalOtherIncome = incomeTransactions.reduce((s, t) => s + t.baseAmount.toNumber(), 0);
  const totalIncome = totalInvoiceRevenue + totalOtherIncome;
  const totalExpenses = expenseTransactions.reduce((s, t) => s + t.baseAmount.toNumber(), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const monthlyPL = new Map<string, { income: number; expense: number }>();

  for (const inv of paidInvoices) {
    const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyPL.get(key) ?? { income: 0, expense: 0 };
    entry.income += inv.baseTotal.toNumber();
    monthlyPL.set(key, entry);
  }

  for (const tx of incomeTransactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyPL.get(key) ?? { income: 0, expense: 0 };
    entry.income += tx.baseAmount.toNumber();
    monthlyPL.set(key, entry);
  }

  for (const tx of expenseTransactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyPL.get(key) ?? { income: 0, expense: 0 };
    entry.expense += tx.baseAmount.toNumber();
    monthlyPL.set(key, entry);
  }

  const monthly = Array.from(monthlyPL.entries())
    .map(([month, data]) => ({ month, income: data.income, expense: data.expense, profit: data.income - data.expense }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const expenseByCategory = new Map<string, number>();
  for (const tx of expenseTransactions) {
    const cat = tx.category?.name ?? "Uncategorized";
    expenseByCategory.set(cat, (expenseByCategory.get(cat) ?? 0) + tx.baseAmount.toNumber());
  }
  const topExpenseCategories = Array.from(expenseByCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalInvoiceRevenue,
    totalOtherIncome,
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    monthly,
    topExpenseCategories,
  };
}


export async function getTopClients(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    include: {
      invoices: {
        where: { issueDate: { gte: start, lte: end } },
        select: { baseTotal: true, status: true },
      },
    },
  });

  return clients
    .map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      totalBilled: c.invoices.reduce((s, i) => s + i.baseTotal.toNumber(), 0),
      totalPaid: c.invoices
        .filter((i) => i.status === "PAID")
        .reduce((s, i) => s + i.baseTotal.toNumber(), 0),
      invoiceCount: c.invoices.length,
    }))
    .filter((c) => c.invoiceCount > 0)
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 20);
}


export async function getTopProducts(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    include: {
      invoiceItems: {
        where: { invoice: { issueDate: { gte: start, lte: end } } },
        select: { quantity: true, amount: true },
      },
      quoteItems: {
        where: { quote: { issueDate: { gte: start, lte: end } } },
        select: { quantity: true, amount: true },
      },
    },
  });

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      totalQuantitySold: p.invoiceItems.reduce((s, i) => s + i.quantity.toNumber(), 0),
      totalRevenue: p.invoiceItems.reduce((s, i) => s + i.amount.toNumber(), 0),
      totalQuoted: p.quoteItems.reduce((s, i) => s + i.amount.toNumber(), 0),
    }))
    .filter((p) => p.totalQuantitySold > 0 || p.totalQuoted > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20);
}


export async function getARAgingDetailed() {
  const { orgId } = await getSessionUser();

  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
    },
    include: {
      client: { select: { name: true, company: true } },
      payments: { select: { originalAmount: true } },
    },
  });

  const now = new Date();
  const aging = unpaidInvoices.map((inv) => {
    const totalPaid = inv.payments.reduce((s: number, p: { originalAmount: { toNumber: () => number } }) => s + p.originalAmount.toNumber(), 0);
    const outstanding = inv.total.toNumber() - totalPaid;
    const daysPastDue = Math.max(
      0,
      Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    let bucket: string;
    if (daysPastDue <= 0) bucket = "Current";
    else if (daysPastDue <= 30) bucket = "1-30 days";
    else if (daysPastDue <= 60) bucket = "31-60 days";
    else if (daysPastDue <= 90) bucket = "61-90 days";
    else bucket = "90+ days";

    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      clientCompany: inv.client.company,
      dueDate: inv.dueDate.toISOString(),
      total: inv.total.toString(),
      outstanding: outstanding.toFixed(2),
      daysPastDue,
      bucket,
      originalCurrency: inv.originalCurrency,
    };
  });

  const buckets = ["Current", "1-30 days", "31-60 days", "61-90 days", "90+ days"];
  const summary = buckets.map((bucket) => ({
    bucket,
    total: aging
      .filter((a) => a.bucket === bucket)
      .reduce((s, a) => s + Number.parseFloat(a.outstanding), 0),
    count: aging.filter((a) => a.bucket === bucket).length,
  }));

  return { invoices: aging, summary };
}


export async function getCashFlowReport(startDate: string, endDate: string) {
  const { orgId } = await getSessionUser();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const payments = await prisma.payment.findMany({
    where: {
      invoice: { organizationId: orgId },
      paymentDate: { gte: start, lte: end },
    },
    select: { originalAmount: true, paymentDate: true },
  });

  const expenses = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
    },
    select: { baseAmount: true, date: true },
  });

  const monthlyMap = new Map<string, { inflow: number; outflow: number }>();

  for (const p of payments) {
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key) ?? { inflow: 0, outflow: 0 };
    entry.inflow += p.originalAmount.toNumber();
    monthlyMap.set(key, entry);
  }

  for (const e of expenses) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key) ?? { inflow: 0, outflow: 0 };
    entry.outflow += e.baseAmount.toNumber();
    monthlyMap.set(key, entry);
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalInflow = payments.reduce((s, p) => s + p.originalAmount.toNumber(), 0);
  const totalOutflow = expenses.reduce((s, e) => s + e.baseAmount.toNumber(), 0);

  return { monthly, totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow };
}
