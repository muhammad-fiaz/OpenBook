"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const Decimal = Prisma.Decimal;

async function getOrgId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (!user?.organizationId) throw new Error("No organization found");
  return user.organizationId;
}

export async function getTaxes() {
  const orgId = await getOrgId();
  const taxes = await prisma.tax.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return taxes.map(t => ({
      ...t,
      rate: t.rate.toNumber(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function createTax(name: string, rate: number, description?: string) {
  const orgId = await getOrgId();
  const tax = await prisma.tax.create({
    data: {
      name,
      rate: new Decimal(rate),
      description,
      organizationId: orgId,
    },
  });
  revalidatePath("/user/settings");
  return tax;
}

export async function deleteTax(id: string) {
    const orgId = await getOrgId();
    await prisma.tax.delete({
        where: { id, organizationId: orgId }
    });
    revalidatePath("/user/settings");
}

export async function getFees() {
    const orgId = await getOrgId();
    const fees = await prisma.fee.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return fees.map(f => ({
        ...f,
        amount: f.amount.toNumber(),
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
    }));
  }
  
  export async function createFee(name: string, amount: number, currency: string = "INR", description?: string) {
    const orgId = await getOrgId();
    const fee = await prisma.fee.create({
      data: {
        name,
        amount: new Decimal(amount),
        currency,
        description,
        organizationId: orgId,
      },
    });
    revalidatePath("/user/settings");
    return fee;
  }
  
  export async function deleteFee(id: string) {
      const orgId = await getOrgId();
      await prisma.fee.delete({
          where: { id, organizationId: orgId }
      });
      revalidatePath("/user/settings");
  }
