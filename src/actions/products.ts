"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const Decimal = Prisma.Decimal;

async function getOrgId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (!user?.organizationId) throw new Error("No organization found");
  return user.organizationId;
}

export async function getProducts() {
  const orgId = await getOrgId();
  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    unitPrice: p.unitPrice.toString(),
    currency: p.currency,
    taxRate: p.taxRate.toString(),
    unit: p.unit,
    type: p.type,
    image: p.image,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getProductById(id: string) {
  const orgId = await getOrgId();
  const product = await prisma.product.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!product) return null;
  return {
    ...product,
    unitPrice: product.unitPrice.toString(),
    taxRate: product.taxRate.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
  unit?: string;
  type?: string;
  image?: string;
}

export async function createProduct(input: CreateProductInput) {
  const orgId = await getOrgId();
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      sku: input.sku,
      unitPrice: new Decimal(input.unitPrice.toFixed(4)),
      currency: input.currency ?? "INR",
      taxRate: new Decimal((input.taxRate ?? 0).toFixed(4)),
      unit: input.unit ?? "unit",
      type: input.type ?? "SERVICE",
      image: input.image,
      organizationId: orgId,
    },
  });
  revalidatePath("/user/products");
  return { id: product.id };
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const orgId = await getOrgId();
  await prisma.product.updateMany({
    where: { id, organizationId: orgId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.unitPrice !== undefined && { unitPrice: new Decimal(input.unitPrice.toFixed(4)) }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.taxRate !== undefined && { taxRate: new Decimal(input.taxRate.toFixed(4)) }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.image !== undefined && { image: input.image }),
    },
  });
  revalidatePath("/user/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const orgId = await getOrgId();
  await prisma.product.deleteMany({ where: { id, organizationId: orgId } });
  revalidatePath("/user/products");
  return { success: true };
}

export async function toggleProductActive(id: string) {
  const orgId = await getOrgId();
  const product = await prisma.product.findFirst({ where: { id, organizationId: orgId } });
  if (!product) throw new Error("Product not found");
  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });
  revalidatePath("/user/products");
  return { success: true };
}
