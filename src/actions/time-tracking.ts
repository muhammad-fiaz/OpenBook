"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

export async function getProjects(filters?: { status?: string; clientId?: string }) {
  const { orgId } = await getSessionUser();
  const projects = await prisma.project.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    include: {
      client: { select: { name: true, company: true } },
      _count: { select: { timeEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projectIds = projects.map((p) => p.id);
  const hoursSummary = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projectIds } },
    _sum: { hours: true },
  });
  const hoursMap = new Map(
    hoursSummary.map((h) => [h.projectId, h._sum.hours?.toNumber() ?? 0])
  );

  const billableHoursSummary = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projectIds }, isBillable: true },
    _sum: { hours: true },
  });
  const billableMap = new Map(
    billableHoursSummary.map((h) => [h.projectId, h._sum.hours?.toNumber() ?? 0])
  );

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    clientName: p.client?.name ?? null,
    clientCompany: p.client?.company ?? null,
    status: p.status,
    hourlyRate: p.hourlyRate?.toString() ?? "0",
    budget: p.budget?.toString() ?? null,
    currency: p.currency,
    totalHours: hoursMap.get(p.id) ?? 0,
    billableHours: billableMap.get(p.id) ?? 0,
    entryCount: p._count.timeEntries,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getProjectById(id: string) {
  const { orgId } = await getSessionUser();
  const project = await prisma.project.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: { select: { name: true, company: true } },
      timeEntries: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });
  if (!project) return null;

  return {
    ...project,
    hourlyRate: project.hourlyRate?.toString() ?? "0",
    budget: project.budget?.toString() ?? null,
    createdAt: project.createdAt.toISOString(),
    timeEntries: project.timeEntries.map((e) => ({
      ...e,
      hours: e.hours.toString(),
      hourlyRate: e.hourlyRate?.toString() ?? "0",
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };
}

interface CreateProjectInput {
  name: string;
  description?: string;
  clientId?: string;
  hourlyRate?: number;
  budget?: number;
  currency: string;
}

export async function createProject(input: CreateProjectInput) {
  const { orgId } = await getSessionUser();
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId || null,
      hourlyRate: input.hourlyRate !== undefined ? new Decimal(input.hourlyRate.toFixed(4)) : null,
      budget: input.budget ? new Decimal(input.budget.toFixed(4)) : null,
      currency: input.currency,
      organizationId: orgId,
    },
  });
  revalidatePath("/user/time-tracking");
  return { id: project.id };
}

export async function updateProject(id: string, input: Partial<CreateProjectInput> & { status?: string }) {
  const { orgId } = await getSessionUser();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.clientId !== undefined) data.clientId = input.clientId || null;
  if (input.hourlyRate !== undefined) data.hourlyRate = new Decimal(input.hourlyRate.toFixed(4));
  if (input.budget !== undefined) data.budget = input.budget ? new Decimal(input.budget.toFixed(4)) : null;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.status !== undefined) data.status = input.status;

  await prisma.project.updateMany({
    where: { id, organizationId: orgId },
    data,
  });
  revalidatePath("/user/time-tracking");
  return { success: true };
}

export async function deleteProject(id: string) {
  const { orgId } = await getSessionUser();
  await prisma.project.deleteMany({ where: { id, organizationId: orgId } });
  revalidatePath("/user/time-tracking");
  return { success: true };
}

export async function getTimeEntries(filters?: {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  isBillable?: boolean;
}) {
  const { orgId } = await getSessionUser();
  const entries = await prisma.timeEntry.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.isBillable !== undefined ? { isBillable: filters.isBillable } : {}),
      ...(filters?.startDate || filters?.endDate
        ? {
            date: {
              ...(filters?.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters?.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
    },
    include: {
      project: { select: { name: true, currency: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return entries.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    projectName: e.project.name,
    projectCurrency: e.project.currency,
    userName: e.user.name ?? e.user.email,
    description: e.description,
    date: e.date.toISOString(),
    hours: e.hours.toString(),
    hourlyRate: e.hourlyRate?.toString() ?? "0",
    isBillable: e.isBillable,
    isBilled: e.isBilled,
    amount: ((e.hours.toNumber()) * (e.hourlyRate?.toNumber() ?? 0)).toFixed(2),
  }));
}

interface CreateTimeEntryInput {
  projectId: string;
  description?: string;
  date: string;
  hours: number;
  hourlyRate?: number;
  isBillable?: boolean;
}

export async function createTimeEntry(input: CreateTimeEntryInput) {
  const { userId, orgId } = await getSessionUser();

  let hourlyRate = input.hourlyRate;
  if (hourlyRate === undefined) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: orgId },
      select: { hourlyRate: true },
    });
    if (!project) throw new Error("Project not found");
    hourlyRate = project.hourlyRate?.toNumber() ?? 0;
  }

  const entry = await prisma.timeEntry.create({
    data: {
      projectId: input.projectId,
      userId,
      organizationId: orgId,
      description: input.description,
      date: new Date(input.date),
      hours: new Decimal(input.hours.toFixed(4)),
      hourlyRate: new Decimal(hourlyRate.toFixed(4)),
      isBillable: input.isBillable ?? true,
    },
  });

  revalidatePath("/user/time-tracking");
  return { id: entry.id };
}

export async function updateTimeEntry(id: string, input: Partial<CreateTimeEntryInput>) {
  const { orgId } = await getSessionUser();

  const data: Record<string, unknown> = {};
  if (input.description !== undefined) data.description = input.description;
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.hours !== undefined) data.hours = new Decimal(input.hours.toFixed(4));
  if (input.hourlyRate !== undefined) data.hourlyRate = new Decimal(input.hourlyRate.toFixed(4));
  if (input.isBillable !== undefined) data.isBillable = input.isBillable;

  await prisma.timeEntry.updateMany({
    where: { id, organizationId: orgId },
    data,
  });

  revalidatePath("/user/time-tracking");
  return { success: true };
}

export async function deleteTimeEntry(id: string) {
  const { orgId } = await getSessionUser();
  await prisma.timeEntry.deleteMany({ where: { id, organizationId: orgId } });
  revalidatePath("/user/time-tracking");
  return { success: true };
}


export async function getTimeTrackingSummary() {
  const { orgId } = await getSessionUser();

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { timeEntries: true } },
    },
  });

  const totalHoursResult = await prisma.timeEntry.aggregate({
    where: { organizationId: orgId },
    _sum: { hours: true },
  });

  const billableHoursResult = await prisma.timeEntry.aggregate({
    where: { organizationId: orgId, isBillable: true },
    _sum: { hours: true },
  });

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const thisMonthHours = await prisma.timeEntry.aggregate({
    where: {
      organizationId: orgId,
      date: { gte: thisMonth },
    },
    _sum: { hours: true },
  });

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
    totalHours: totalHoursResult._sum.hours?.toNumber() ?? 0,
    billableHours: billableHoursResult._sum.hours?.toNumber() ?? 0,
    thisMonthHours: thisMonthHours._sum.hours?.toNumber() ?? 0,
  };
}
