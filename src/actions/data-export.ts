"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrgId(): Promise<string | null> {
  const session = await auth.api.getSession({
     headers: await headers()
  });
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
  });

  return user?.organizationId || null;
}

export async function exportAllData() {
  const orgId = await getOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const [
    products,
    clients,
    invoices,
    transactions,
    payments,
    taxes,
    fees,
    organization
  ] = await Promise.all([
    prisma.product.findMany({ where: { organizationId: orgId } }),
    prisma.client.findMany({ where: { organizationId: orgId } }),
    prisma.invoice.findMany({ 
        where: { organizationId: orgId },
        include: { items: true, payments: true } 
    }),
    prisma.transaction.findMany({ where: { organizationId: orgId } }),
    prisma.payment.findMany({ where: { organizationId: orgId } }),
    prisma.tax.findMany({ where: { organizationId: orgId } }),
    prisma.fee.findMany({ where: { organizationId: orgId } }),
    prisma.organization.findUnique({ where: { id: orgId } })
  ]);

  return {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    organization,
    data: {
        products,
        clients,
        invoices,
        transactions,
        payments,
        taxes,
        fees
    }
  };
}

// Note: Import functionality is complex due to ID conflicts and references.
// For now we will support export fully. Import would typically require clearing data or smart merging.
