"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { sendNotification } from "@/actions/notifications";

export async function getTeamMembers() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
  });

  if (!currentUser?.organizationId) return null;

  const members = await prisma.user.findMany({
    where: { organizationId: currentUser.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true
    },
    orderBy: { createdAt: "asc" }
  });

  return members;
}

export async function addTeamMember(email: string, role: UserRole) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true }
  });

  if (!currentUser?.organizationId) throw new Error("No organization found");
  
  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      throw new Error("You do not have permission to add members");
  }

  const userToAdd = await prisma.user.findUnique({
      where: { email },
  });

  if (userToAdd?.organizationId === currentUser.organizationId) {
       throw new Error("User is already a member of this organization");
  }

  const existingInvite = await prisma.invitation.findFirst({
      where: { 
          email, 
          organizationId: currentUser.organizationId,
          status: "PENDING"
      }
  });

  if (existingInvite) {
      throw new Error("Invitation already pending for this email");
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.invitation.create({
      data: {
          email,
          role,
          organizationId: currentUser.organizationId,
          inviterId: session.user.id,
          token,
          expiresAt
      }
  });

  console.log(`[INVITE] Created invite for ${email}: /auth/join?token=${token}`);

  if (userToAdd) {
    await sendNotification({
      type: "INVITATION",
      title: "Organization Invitation",
      message: `You have been invited to join an organization as ${role}. Check your inbox.`,
      recipientId: userToAdd.id,
      senderId: session.user.id,
      organizationId: currentUser.organizationId,
      entityType: "INVITATION",
    });
  }

  revalidatePath("/user/settings");
  return { success: true, message: "Invitation sent" };
}

export async function getPendingInvitations() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return [];

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
    });

    if (!currentUser?.organizationId) return [];

    return prisma.invitation.findMany({
        where: { 
            organizationId: currentUser.organizationId,
            status: "PENDING"
        },
        orderBy: { createdAt: "desc" }
    });
}


export async function removeTeamMember(userId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true }
    });

    if (!currentUser?.organizationId) throw new Error("No organization found");

    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
        throw new Error("You do not have permission to remove members");
    }

    const memberToRemove = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!memberToRemove) throw new Error("Member not found");

    if (memberToRemove.organizationId !== currentUser.organizationId) {
        throw new Error("Member is not in your organization");
    }

    if (memberToRemove.id === session.user.id) {
        throw new Error("You cannot remove yourself. Use 'Leave Organization' instead.");
    }
    
    if (currentUser.role === "ADMIN" && memberToRemove.role === "OWNER") {
        throw new Error("Admins cannot remove Owners");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            organizationId: null,
            role: "MEMBER" // Reset role to default member
        }
    });

    await sendNotification({
        type: "TEAM",
        title: "Removed from Organization",
        message: "You have been removed from the organization.",
        recipientId: userId,
        senderId: session.user.id,
        organizationId: currentUser.organizationId,
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function updateMemberRole(userId: string, newRole: UserRole) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true }
    });

    if (!currentUser?.organizationId) throw new Error("No organization found");

    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
        throw new Error("Permission denied");
    }
    
    const memberToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (memberToUpdate?.organizationId !== currentUser.organizationId) {
        throw new Error("Member not found in organization");
    }
    
    if (currentUser.role === "ADMIN") {
        if (newRole === "OWNER" || memberToUpdate.role === "OWNER") {
            throw new Error("Admins cannot manage Owner roles");
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function leaveOrganization() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user?.organizationId) throw new Error("You are not in an organization.");
    
    if (user.role === "OWNER") {
         const otherOwners = await prisma.user.count({ 
             where: { 
                 organizationId: user.organizationId, 
                 role: "OWNER",
                 id: { not: user.id }
             } 
         });
         
         if (otherOwners === 0) {
             throw new Error("You are the only owner. Please transfer ownership or delete the organization.");
         }
    }

    const orgId = user.organizationId;

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            organizationId: null,
            role: "MEMBER"
        }
    });

    const remaining = await prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true },
    });

    for (const member of remaining) {
        await sendNotification({
            type: "TEAM",
            title: "Member Left",
            message: `${user.name} has left the organization.`,
            recipientId: member.id,
            senderId: user.id,
            organizationId: orgId,
        });
    }

    revalidatePath("/user");
    return { success: true };
}

export async function deleteOrganization() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, organizationId: true, role: true, name: true },
    });

    if (!user?.organizationId) throw new Error("No organization found");
    if (user.role !== "OWNER") throw new Error("Only the Owner can delete the organization");

    const orgId = user.organizationId;

    const members = await prisma.user.findMany({
        where: { organizationId: orgId, id: { not: user.id } },
        select: { id: true },
    });

    await prisma.user.updateMany({
        where: { organizationId: orgId },
        data: { organizationId: null, role: "MEMBER" },
    });

    await prisma.organization.delete({
        where: { id: orgId },
    });

    revalidatePath("/user");
    return { success: true };
}

export async function transferOwnership(newOwnerId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, organizationId: true, role: true, name: true },
    });

    if (!user?.organizationId) throw new Error("No organization found");
    if (user.role !== "OWNER") throw new Error("Only the Owner can transfer ownership");

    const newOwner = await prisma.user.findUnique({
        where: { id: newOwnerId },
        select: { id: true, organizationId: true, name: true },
    });

    if (!newOwner || newOwner.organizationId !== user.organizationId) {
        throw new Error("User not found in your organization");
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: newOwnerId },
            data: { role: "OWNER" },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
        }),
    ]);

    await sendNotification({
        type: "TEAM",
        title: "Ownership Transferred",
        message: `${user.name} has transferred organization ownership to you.`,
        recipientId: newOwnerId,
        senderId: user.id,
        organizationId: user.organizationId,
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function validateOrganization(orgId: string) {
    if (!orgId?.trim()) return { exists: false, error: "Organization ID is required" };

    const org = await prisma.organization.findUnique({
        where: { id: orgId.trim() },
        select: { id: true, name: true, slug: true, logo: true },
    });

    if (!org) return { exists: false, error: "Organization not found. Please check the ID and try again." };

    return { exists: true, organization: org };
}

export async function requestToJoinOrganization(orgId: string, message?: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const org = await prisma.organization.findUnique({
        where: { id: orgId.trim() },
        select: { id: true, name: true },
    });

    if (!org) throw new Error("Organization not found. Please verify the organization ID.");

    const existingMembership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId: session.user.id,
                organizationId: org.id,
            },
        },
    });

    if (existingMembership) throw new Error("You are already a member of this organization.");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
    });

    if (user?.organizationId === org.id) throw new Error("You are already in this organization.");

    const existingRequest = await prisma.joinRequest.findUnique({
        where: {
            userId_organizationId: {
                userId: session.user.id,
                organizationId: org.id,
            },
        },
    });

    if (existingRequest) {
        if (existingRequest.status === "PENDING") {
            throw new Error("You already have a pending request to join this organization.");
        }
        if (existingRequest.status === "REJECTED") {
            await prisma.joinRequest.update({
                where: { id: existingRequest.id },
                data: { status: "PENDING", message: message || null },
            });
        }
    } else {
        await prisma.joinRequest.create({
            data: {
                userId: session.user.id,
                organizationId: org.id,
                message: message || null,
            },
        });
    }

    const admins = await prisma.user.findMany({
        where: {
            organizationId: org.id,
            role: { in: ["OWNER", "ADMIN"] },
        },
        select: { id: true },
    });

    for (const admin of admins) {
        await sendNotification({
            type: "TEAM",
            title: "Join Request",
            message: `${session.user.name} has requested to join ${org.name}.`,
            recipientId: admin.id,
            senderId: session.user.id,
            organizationId: org.id,
        });
    }

    revalidatePath("/user/settings");
    return { success: true, orgName: org.name };
}

export async function getJoinRequests() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true },
    });

    if (!user?.organizationId) return [];

    if (user.role !== "OWNER" && user.role !== "ADMIN") return [];

    const requests = await prisma.joinRequest.findMany({
        where: {
            organizationId: user.organizationId,
            status: "PENDING",
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return requests;
}

export async function approveJoinRequest(requestId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true, name: true },
    });

    if (!currentUser?.organizationId) throw new Error("No organization found");
    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
        throw new Error("Only Owners and Admins can approve join requests");
    }

    const request = await prisma.joinRequest.findUnique({
        where: { id: requestId },
        include: { user: { select: { id: true, name: true } } },
    });

    if (!request || request.organizationId !== currentUser.organizationId) {
        throw new Error("Join request not found");
    }

    if (request.status !== "PENDING") {
        throw new Error("This request has already been processed");
    }

    await prisma.$transaction([
        prisma.joinRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED" },
        }),
        prisma.organizationMember.create({
            data: {
                userId: request.userId,
                organizationId: request.organizationId,
                role: "MEMBER",
            },
        }),
        prisma.user.update({
            where: { id: request.userId },
            data: {
                organizationId: request.organizationId,
                role: "MEMBER",
            },
        }),
    ]);

    await sendNotification({
        type: "TEAM",
        title: "Request Approved",
        message: `Your request to join the organization has been approved by ${currentUser.name}.`,
        recipientId: request.userId,
        senderId: session.user.id,
        organizationId: request.organizationId,
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function rejectJoinRequest(requestId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true, name: true },
    });

    if (!currentUser?.organizationId) throw new Error("No organization found");
    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
        throw new Error("Only Owners and Admins can reject join requests");
    }

    const request = await prisma.joinRequest.findUnique({
        where: { id: requestId },
    });

    if (!request || request.organizationId !== currentUser.organizationId) {
        throw new Error("Join request not found");
    }

    if (request.status !== "PENDING") {
        throw new Error("This request has already been processed");
    }

    await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
    });

    await sendNotification({
        type: "TEAM",
        title: "Request Declined",
        message: `Your request to join the organization has been declined.`,
        recipientId: request.userId,
        senderId: session.user.id,
        organizationId: request.organizationId,
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function getMyJoinRequests() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const requests = await prisma.joinRequest.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            organization: {
                select: { id: true, name: true, slug: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return requests;
}
