import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const invite = await prisma.invitation.findFirst({
            where: { email: user.email, status: "PENDING" }
          });
          
          if (invite) {
             await prisma.$transaction([
                prisma.user.update({
                   where: { id: user.id },
                   data: { 
                      organizationId: invite.organizationId,
                      role: invite.role 
                   }
                }),
                prisma.organizationMember.create({
                   data: {
                      userId: user.id,
                      organizationId: invite.organizationId,
                      role: invite.role,
                   }
                }),
                prisma.invitation.update({
                   where: { id: invite.id },
                   data: { status: "ACCEPTED" }
                })
             ]);
          }
        },
      },
    },
  },
});
