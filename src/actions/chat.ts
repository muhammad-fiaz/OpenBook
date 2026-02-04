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
    select: { id: true, organizationId: true, role: true, name: true, email: true },
  });

  if (!user) throw new Error("User not found");
  return user;
}


export async function getOrCreateDirectChat(otherUserId: string) {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, organizationId: true, name: true },
  });

  if (!otherUser || otherUser.organizationId !== user.organizationId) {
    throw new Error("User not found in your organization");
  }

  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type: "DIRECT",
      organizationId: user.organizationId,
      AND: [
        { members: { some: { userId: user.id } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (existingRoom) return existingRoom;

  const room = await prisma.chatRoom.create({
    data: {
      type: "DIRECT",
      organizationId: user.organizationId,
      members: {
        create: [
          { userId: user.id, role: "MEMBER" },
          { userId: otherUserId, role: "MEMBER" },
        ],
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  return room;
}


export async function createGroupChat(name: string, memberIds: string[]) {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");

  if (!name.trim()) throw new Error("Group name is required");
  if (memberIds.length < 1) throw new Error("At least one other member is required");

  const members = await prisma.user.findMany({
    where: { id: { in: memberIds }, organizationId: user.organizationId },
    select: { id: true },
  });

  if (members.length !== memberIds.length) {
    throw new Error("Some members were not found in your organization");
  }

  const allMemberIds = [...new Set([user.id, ...memberIds])];

  const room = await prisma.chatRoom.create({
    data: {
      name,
      type: "GROUP",
      organizationId: user.organizationId,
      members: {
        create: allMemberIds.map((mid) => ({
          userId: mid,
          role: mid === user.id ? "ADMIN" : "MEMBER",
        })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  revalidatePath("/user/chat");
  return room;
}

export async function createTeamChat() {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");
  if (user.role !== "OWNER" && user.role !== "ADMIN") throw new Error("Permission denied");

  const existing = await prisma.chatRoom.findFirst({
    where: { type: "TEAM", organizationId: user.organizationId },
  });

  if (existing) throw new Error("Team chat already exists");

  const orgMembers = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true },
  });

  const room = await prisma.chatRoom.create({
    data: {
      name: "Team Chat",
      type: "TEAM",
      organizationId: user.organizationId,
      members: {
        create: orgMembers.map((m) => ({
          userId: m.id,
          role: m.id === user.id ? "ADMIN" : "MEMBER",
        })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  revalidatePath("/user/chat");
  return room;
}

export async function getChatRooms() {
  const user = await getSessionUser();
  if (!user.organizationId) return [];

  const rooms = await prisma.chatRoom.findMany({
    where: {
      organizationId: user.organizationId,
      members: { some: { userId: user.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, isDeleted: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rooms;
}

export async function getChatMessages(chatRoomId: string, cursor?: string) {
  const user = await getSessionUser();
  if (!user.organizationId) return { messages: [], nextCursor: null };

  const membership = await prisma.chatRoomMember.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: user.id } },
  });

  if (!membership) throw new Error("You are not a member of this chat");

  const take = 50;
  const messages = await prisma.chatMessage.findMany({
    where: {
      chatRoomId,
      NOT: { deletedForUsers: { has: user.id } },
    },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > take;
  const trimmed = hasMore ? messages.slice(0, take) : messages;

  return {
    messages: trimmed.reverse(),
    nextCursor: hasMore ? trimmed[0]?.id : null,
  };
}

export async function sendChatMessage(chatRoomId: string, content: string) {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");
  if (!content.trim()) throw new Error("Message cannot be empty");

  const membership = await prisma.chatRoomMember.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: user.id } },
  });

  if (!membership) throw new Error("You are not a member of this chat");

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderId: user.id,
      content: content.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/user/chat");
  return message;
}

export async function deleteMessageForMe(messageId: string) {
  const user = await getSessionUser();

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");

  const existing = message.deletedForUsers || [];
  if (!existing.includes(user.id)) {
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedForUsers: [...existing, user.id] },
    });
  }

  revalidatePath("/user/chat");
  return { success: true };
}

export async function deleteMessageForEveryone(messageId: string) {
  const user = await getSessionUser();

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");

  if (message.senderId !== user.id) {
    throw new Error("You can only delete your own messages for everyone");
  }

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { isDeleted: true, content: "This message was deleted" },
  });

  revalidatePath("/user/chat");
  return { success: true };
}

export async function clearChatForMe(chatRoomId: string) {
  const user = await getSessionUser();

  const membership = await prisma.chatRoomMember.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: user.id } },
  });
  if (!membership) throw new Error("Not a member of this chat");

  const messages = await prisma.chatMessage.findMany({
    where: {
      chatRoomId,
      NOT: { deletedForUsers: { has: user.id } },
    },
    select: { id: true, deletedForUsers: true },
  });

  for (const msg of messages) {
    await prisma.chatMessage.update({
      where: { id: msg.id },
      data: { deletedForUsers: [...msg.deletedForUsers, user.id] },
    });
  }

  revalidatePath("/user/chat");
  return { success: true };
}

export async function leaveChatRoom(chatRoomId: string) {
  const user = await getSessionUser();

  const membership = await prisma.chatRoomMember.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: user.id } },
  });
  if (!membership) throw new Error("Not a member");

  await prisma.chatRoomMember.delete({
    where: { chatRoomId_userId: { chatRoomId, userId: user.id } },
  });

  const remaining = await prisma.chatRoomMember.count({ where: { chatRoomId } });
  if (remaining === 0) {
    await prisma.chatRoom.delete({ where: { id: chatRoomId } });
  }

  revalidatePath("/user/chat");
  return { success: true };
}

export async function deleteChatRoom(chatRoomId: string) {
  const user = await getSessionUser();
  if (!user.organizationId) throw new Error("No organization found");

  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { members: true },
  });

  if (!room) throw new Error("Chat room not found");
  if (room.organizationId !== user.organizationId) throw new Error("Not your organization");

  const memberRecord = room.members.find((m) => m.userId === user.id);
  const isRoomAdmin = memberRecord?.role === "ADMIN";
  const isOrgAdmin = user.role === "OWNER" || user.role === "ADMIN";

  if (!isRoomAdmin && !isOrgAdmin) throw new Error("Permission denied");

  await prisma.chatRoom.delete({ where: { id: chatRoomId } });

  revalidatePath("/user/chat");
  return { success: true };
}

export async function getOrgMembersForChat() {
  const user = await getSessionUser();
  if (!user.organizationId) return [];

  return prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      id: { not: user.id },
    },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}
