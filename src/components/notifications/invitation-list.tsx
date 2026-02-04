"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  Check,
  X,
  Building,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation, declineInvitation } from "@/actions/notifications";

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  organization: { id: string; name: string; slug: string; logo: string | null };
  inviter: { id: string; name: string; email: string; image: string | null };
}

export function InvitationList({ invitations }: { invitations: InvitationItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept(id: string) {
    startTransition(async () => {
      try {
        await acceptInvitation(id);
        toast.success("Invitation accepted! Welcome to the team.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to accept");
      }
    });
  }

  function handleDecline(id: string) {
    startTransition(async () => {
      try {
        await declineInvitation(id);
        toast.success("Invitation declined");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to decline");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground">
            <Mail className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No pending invitations</p>
            <p className="text-sm">When someone invites you to their organization, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invite) => {
              const isExpired = new Date() > new Date(invite.expiresAt);
              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Building className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{invite.organization.name}</p>
                      <Badge variant="secondary" className="text-xs">{invite.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Invited by {invite.inviter.name} ({invite.inviter.email})
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {isExpired ? (
                        <span className="text-destructive">Expired</span>
                      ) : (
                        <span>Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isPending || isExpired}
                      onClick={() => handleAccept(invite.id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDecline(invite.id)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
