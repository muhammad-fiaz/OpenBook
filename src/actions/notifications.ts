"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, organizationId: true, role: true, name: true },
  });

  if (!user) throw new Error("User not found");
  return user;
}

export async function getNotifications() {
  const user = await getSessionUser();
  if (!user.organizationId) return [];

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications;
}

export async function getUnreadNotificationCount() {
  const user = await getSessionUser();
  if (!user.organizationId) return 0;

  return prisma.notification.count({
    where: { recipientId: user.id, isRead: false },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getSessionUser();

  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/user/notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const user = await getSessionUser();

  await prisma.notification.updateMany({
    where: { recipientId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/user/notifications");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const user = await getSessionUser();

  await prisma.notification.deleteMany({
    where: { id: notificationId, recipientId: user.id },
  });

  revalidatePath("/user/notifications");
  return { success: true };
}

export async function clearAllNotifications() {
  const user = await getSessionUser();

  await prisma.notification.deleteMany({
    where: { recipientId: user.id },
  });

  revalidatePath("/user/notifications");
  return { success: true };
}

export async function sendNotification(data: {
  type: string;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  organizationId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      recipientId: data.recipientId,
      senderId: data.senderId ?? null,
      organizationId: data.organizationId,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });

  return notification;
}

export async function getMyInvitations() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) return [];

  const invitations = await prisma.invitation.findMany({
    where: { email: user.email, status: "PENDING" },
    include: {
      organization: { select: { id: true, name: true, slug: true, logo: true } },
      inviter: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
}

export async function acceptInvitation(invitationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, organizationId: true },
  });

  if (!user) throw new Error("User not found");

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { organization: true },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email !== user.email) throw new Error("This invitation is not for you");
  if (invitation.status !== "PENDING") throw new Error("Invitation is no longer pending");
  if (new Date() > invitation.expiresAt) throw new Error("Invitation has expired");
  if (user.organizationId) throw new Error("You must leave your current organization first");

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    }),
  ]);

  await sendNotification({
    type: "TEAM",
    title: "Invitation Accepted",
    message: `${user.email} has accepted your invitation to join the organization.`,
    recipientId: invitation.inviterId,
    senderId: user.id,
    organizationId: invitation.organizationId,
    entityType: "INVITATION",
    entityId: invitationId,
  });

  revalidatePath("/user");
  return { success: true };
}

export async function declineInvitation(invitationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });

  if (!user) throw new Error("User not found");

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email !== user.email) throw new Error("This invitation is not for you");

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED" },
  });

  await sendNotification({
    type: "TEAM",
    title: "Invitation Declined",
    message: `${user.email} has declined your invitation.`,
    recipientId: invitation.inviterId,
    senderId: user.id,
    organizationId: invitation.organizationId,
    entityType: "INVITATION",
    entityId: invitationId,
  });

  revalidatePath("/user/notifications");
  return { success: true };
}

export async function cancelInvitation(invitationId: string) {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    throw new Error("Permission denied");
  }

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.organizationId !== user.organizationId) throw new Error("Not your organization");

  await prisma.invitation.delete({ where: { id: invitationId } });

  revalidatePath("/user/settings");
  return { success: true };
}
