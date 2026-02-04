import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

/**
 * Currency conversion utility - all financial calculations must be server-side
 */
export function convertToBase(
  originalAmount: Decimal | number,
  exchangeRate: Decimal | number,
): Decimal {
  const amount = new Decimal(originalAmount.toString());
  const rate = new Decimal(exchangeRate.toString());
  return amount.mul(rate);
}

/**
 * Compute total paid for an invoice from its payment records
 */
export function computeTotalPaid(
  payments: Array<{ baseAmount: Decimal | number; status: string }>,
): Decimal {
  return payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => {
      return sum.add(new Decimal(p.baseAmount.toString()));
    }, new Decimal(0));
}

/**
 * Compute outstanding amount
 */
export function computeOutstanding(
  baseTotal: Decimal | number,
  totalPaid: Decimal | number,
): Decimal {
  const total = new Decimal(baseTotal.toString());
  const paid = new Decimal(totalPaid.toString());
  return total.sub(paid);
}

/**
 * Compute aging buckets from invoices
 */
export interface AgingBuckets {
  current: Decimal;
  thirtyDays: Decimal;
  sixtyDays: Decimal;
  ninetyDays: Decimal;
  over90Days: Decimal;
}

export function computeAgingBuckets(
  invoices: Array<{
    dueDate: Date;
    baseTotal: Decimal | number;
    totalPaid: Decimal | number;
  }>,
): AgingBuckets {
  const now = new Date();
  const buckets: AgingBuckets = {
    current: new Decimal(0),
    thirtyDays: new Decimal(0),
    sixtyDays: new Decimal(0),
    ninetyDays: new Decimal(0),
    over90Days: new Decimal(0),
  };

  for (const inv of invoices) {
    const outstanding = computeOutstanding(inv.baseTotal, inv.totalPaid);
    if (outstanding.lte(0)) continue;

    const diffMs = now.getTime() - new Date(inv.dueDate).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      buckets.current = buckets.current.add(outstanding);
    } else if (diffDays <= 30) {
      buckets.thirtyDays = buckets.thirtyDays.add(outstanding);
    } else if (diffDays <= 60) {
      buckets.sixtyDays = buckets.sixtyDays.add(outstanding);
    } else if (diffDays <= 90) {
      buckets.ninetyDays = buckets.ninetyDays.add(outstanding);
    } else {
      buckets.over90Days = buckets.over90Days.add(outstanding);
    }
  }

  return buckets;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: Decimal | number | string,
  currency = "INR",
): string {
  const num = Number(amount.toString());
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Determine dynamic invoice status based on payments
 */
export function computeInvoiceStatus(
  baseTotal: Decimal | number,
  totalPaid: Decimal | number,
  dueDate: Date,
  currentStatus: string,
): string {
  if (currentStatus === "CANCELLED" || currentStatus === "DRAFT") return currentStatus;
  
  const total = new Decimal(baseTotal.toString());
  const paid = new Decimal(totalPaid.toString());
  const now = new Date();

  if (paid.gte(total)) return "PAID";
  if (paid.gt(0) && paid.lt(total)) return "PARTIALLY_PAID";
  if (now > new Date(dueDate) && paid.lt(total)) return "OVERDUE";
  return "SENT";
}
