"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type SearchResult = {
  type: "client" | "invoice" | "product" | "project" | "quote";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
};

export async function searchEverything(query: string): Promise<SearchResult[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
  });

  if (!user?.organizationId) {
    return [];
  }

  const organizationId = user.organizationId;
  const search = query.trim();

  if (search.length < 2) {
    return [];
  }

  const results: SearchResult[] = [];

  const [clients, invoices, products, projects, quotes] = await Promise.all([
    prisma.client.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      take: 3,
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
        ],
      },
      take: 3,
      include: { client: true },
    }),
    prisma.product.findMany({
      where: {
        organizationId,
        name: { contains: search, mode: "insensitive" },
      },
      take: 3,
    }),
    prisma.project.findMany({
      where: {
        organizationId,
        name: { contains: search, mode: "insensitive" },
      },
      take: 3,
    }),
    prisma.quote.findMany({
      where: {
        organizationId,
        quoteNumber: { contains: search, mode: "insensitive" },
      },
      take: 3,
      include: { client: true },
    }),
  ]);

  results.push(
    ...clients.map((c) => ({
      type: "client" as const,
      id: c.id,
      title: c.name,
      subtitle: c.email || undefined,
      url: `/user/clients/${c.id}`,
    }))
  );

  results.push(
    ...invoices.map((i) => ({
      type: "invoice" as const,
      id: i.id,
      title: i.invoiceNumber,
      subtitle: `Invoice for ${i.client.name}`,
      url: `/user/invoices/${i.id}`,
    }))
  );

  results.push(
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      title: p.name,
      subtitle: `${p.unitPrice} ${p.currency}`,
      url: `/user/products`, 
    }))
  );

  results.push(
    ...projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: "Project",
      url: `/user/time-tracking`,
    }))
  );

  results.push(
    ...quotes.map((q) => ({
      type: "quote" as const,
      id: q.id,
      title: q.quoteNumber,
      subtitle: `Quote for ${q.client.name}`,
      url: `/user/quotes`, 
    }))
  );

  return results;
}
