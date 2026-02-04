import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { baseCurrency } = await req.json();

  if (!baseCurrency) {
    return NextResponse.json({ error: "Currency is required" }, { status: 400 });
  }

  const organization = await prisma.organization.findFirst({
    where: { users: { some: { id: session.user.id } } },
  });

  if (organization) {
    await prisma.organization.update({
      where: { id: organization.id },
      data: { baseCurrency },
    });
  } else {
    await prisma.organization.create({
      data: {
        name: `${session.user.name}'s Organization`,
        slug: `${session.user.name?.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        baseCurrency,
        users: { connect: { id: session.user.id } },
      },
    });
  }

  return NextResponse.json({ success: true });
}
