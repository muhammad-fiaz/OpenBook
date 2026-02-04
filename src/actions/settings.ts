"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getOrganizationSettings() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, name: true, email: true, image: true, id: true, role: true, country: true, socialMedia: true }
  });

  if (!user) return null;

  if (!user.organizationId) {
    return { org: null, user };
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      settings: true
    }
  });
  
  return { org, user };
}

export async function updateBaseCurrency(currency: string) {
   const session = await auth.api.getSession({ headers: await headers() });
   if (!session?.user?.id) throw new Error("Unauthorized");
   
   const user = await prisma.user.findUnique({
       where: { id: session.user.id },
       select: { organizationId: true, role: true }
   });

   if (!user?.organizationId) throw new Error("No organization found");
   if (user.role !== "OWNER" && user.role !== "ADMIN") throw new Error("Permission denied");
   
   const org = await prisma.organization.findUnique({
       where: { id: user.organizationId },
       select: { metadata: true }
   });

   const currentMetadata = (org?.metadata as Record<string, any>) || {};

   await prisma.organization.update({
       where: { id: user.organizationId },
       data: { 
           baseCurrency: currency,
           metadata: {
               ...currentMetadata,
               onboardingComplete: true
           }
       }
   });
   
   revalidatePath("/user");
   return { success: true };
}

export async function updateOrganizationDetails(data: { name: string; slug: string; brandColor: string; logo: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) throw new Error("No organization found");
  if (user.role !== "OWNER" && user.role !== "ADMIN") throw new Error("Permission denied");

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name: data.name,
      slug: data.slug,
      brandColor: data.brandColor,
      logo: data.logo || null,
    }
  });

  revalidatePath("/user/settings");
  return { success: true };
}

export async function updateUserProfile(data: { name: string; country?: string; socialMedia?: any; image?: string }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");
  
    await prisma.user.update({
        where: { id: session.user.id },
        data: { 
            name: data.name,
            country: data.country,
            socialMedia: data.socialMedia,
            image: data.image
        }
    });
    
    revalidatePath("/user/settings");
    return { success: true };
}

export async function getUserOrganizations() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      organizationId: true,
      memberships: {
        include: {
          organization: true
        }
      }
    }
  });

  if (!user) return [];

  if (user.memberships.length === 0 && user.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: user.organizationId }});
      if (org) return [org];
  }

  return user.memberships.map(m => m.organization);
}

export async function switchOrganization(organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
          memberships: true
      }
  });

  if (!user) throw new Error("User not found");

  const membership = await prisma.organizationMember.findUnique({
      where: {
          userId_organizationId: {
              userId: user.id,
              organizationId
          }
      }
  });

  if (!membership) {
       if (user.organizationId === organizationId) {
           const org = await prisma.organization.findUnique({ where: { id: organizationId}});
           if (!org) throw new Error("Organization not found");
           
           await prisma.organizationMember.create({
               data: { userId: user.id, organizationId, role: user.role }
           });
           return { success: true };
       }
       throw new Error("Not a member");
  }

  await prisma.user.update({
      where: { id: user.id },
      data: { 
          organizationId,
          role: membership.role
      }
  });

  revalidatePath("/", "layout"); // Revalidate everything
  return { success: true };
}

export async function updateInvoiceSettings(data: { defaultTerms: string; defaultNotes: string; invoicePrefix: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) throw new Error("No organization found");
  if (user.role !== "OWNER" && user.role !== "ADMIN") throw new Error("Permission denied");

  const settingsToUpdate = [
    { key: "invoice_default_terms", value: data.defaultTerms },
    { key: "invoice_default_notes", value: data.defaultNotes },
    { key: "invoice_prefix", value: data.invoicePrefix },
  ];

  for (const setting of settingsToUpdate) {
    await prisma.setting.upsert({
      where: {
        organizationId_key: {
          organizationId: user.organizationId,
          key: setting.key,
        },
      },
      update: { value: setting.value },
      create: {
        organizationId: user.organizationId,
        key: setting.key,
        value: setting.value,
      },
    });
  }

  revalidatePath("/user/settings");
  return { success: true };
}

export async function deleteAllData() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) throw new Error("No organization found");
  if (user.role !== "OWNER") throw new Error("Only the Owner can delete all data");

  await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { chatRoom: { organizationId: user.organizationId } } }),
      prisma.chatRoomMember.deleteMany({ where: { chatRoom: { organizationId: user.organizationId } } }),
      prisma.chatRoom.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.notification.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.payment.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.deliveryNote.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.invoice.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.client.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.transaction.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.recurringTransaction.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.category.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.auditLog.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.customFieldValue.deleteMany({ where: { customField: { organizationId: user.organizationId } } }),
      prisma.customField.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.invoiceTemplate.deleteMany({ where: { organizationId: user.organizationId } }),
      prisma.setting.deleteMany({ where: { organizationId: user.organizationId } }),
  ]);

  revalidatePath("/user");
  return { success: true };
}

export async function deleteAccount() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true }
    });

    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { senderId: session.user.id } }),
      prisma.chatRoomMember.deleteMany({ where: { userId: session.user.id } }),
      prisma.notification.deleteMany({ where: { recipientId: session.user.id } }),
    ]);

    if (user?.organizationId) {
        if (user.role === "OWNER") {
            await prisma.organization.delete({
                where: { id: user.organizationId }
            });
        }
    }

    await prisma.user.delete({
        where: { id: session.user.id }
    });

    return { success: true };
}

export async function getPaymentMethods() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];
  
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
  });
  
  if (!user?.organizationId) return [];

  return prisma.organizationPaymentMethod.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' }
  });
}

export async function addPaymentMethod(data: { name: string; type: string; details: any; isDefault: boolean }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true }
    });

    if (!user?.organizationId) throw new Error("No organization found");
    if (data.isDefault) {
        await prisma.organizationPaymentMethod.updateMany({
            where: { organizationId: user.organizationId },
            data: { isDefault: false }
        });
    }

    await prisma.organizationPaymentMethod.create({
        data: {
            name: data.name,
            type: data.type,
            details: data.details,
            isDefault: data.isDefault,
            organizationId: user.organizationId
        }
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function deletePaymentMethod(id: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true }
    });

    if (!user?.organizationId) throw new Error("No organization found");
    if (user.role !== "OWNER" && user.role !== "ADMIN") throw new Error("Permission denied");

    await prisma.organizationPaymentMethod.delete({
        where: { id, organizationId: user.organizationId }
    });

    revalidatePath("/user/settings");
    return { success: true };
}

export async function createOrganization(data: { name: string }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(7);

    const org = await prisma.organization.create({
        data: {
            name: data.name,
            slug,
            baseCurrency: "USD",
        }
    });

    await prisma.organizationMember.create({
        data: {
            userId: session.user.id,
            organizationId: org.id,
            role: "OWNER"
        }
    });

    await prisma.user.update({
        where: { id: session.user.id },
        data: { 
            organizationId: org.id,
            role: "OWNER" 
        }
    });
    
    return { success: true, organizationId: org.id };
}
