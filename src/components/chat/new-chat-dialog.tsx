"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Users, User, Hash, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getOrgMembersForChat,
  getOrCreateDirectChat,
  createGroupChat,
  createTeamChat,
} from "@/actions/chat";

interface OrgMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function NewChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      getOrgMembersForChat()
        .then(setMembers)
        .catch(() => toast.error("Failed to load members"))
        .finally(() => setLoading(false));
      setSelectedMembers([]);
      setGroupName("");
    }
  }, [open]);

  function handleDirectChat(memberId: string) {
    startTransition(async () => {
      try {
        await getOrCreateDirectChat(memberId);
        toast.success("Chat opened");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create chat");
      }
    });
  }

  function handleCreateGroup() {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedMembers.length < 1) {
      toast.error("Select at least one member");
      return;
    }
    startTransition(async () => {
      try {
        await createGroupChat(groupName, selectedMembers);
        toast.success("Group chat created");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create group");
      }
    });
  }

  function handleCreateTeam() {
    startTransition(async () => {
      try {
        await createTeamChat();
        toast.success("Team chat created");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create team chat");
      }
    });
  }

  function toggleMember(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message, create a group, or open a team chat.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="direct">
              <User className="mr-2 h-4 w-4" />
              Direct
            </TabsTrigger>
            <TabsTrigger value="group">
              <Hash className="mr-2 h-4 w-4" />
              Group
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Direct Message Tab */}
          <TabsContent value="direct" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No other members in your organization
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleDirectChat(member.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleDirectChat(member.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Group Chat Tab */}
          <TabsContent value="group" className="space-y-3">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g. Project Alpha"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Members</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No members available</p>
                ) : (
                  members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg p-2 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGroup} disabled={isPending || !groupName.trim() || selectedMembers.length === 0}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Group
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Team Chat Tab */}
          <TabsContent value="team" className="space-y-3">
            <div className="text-center py-4">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Create a chat with all members of your organization.
                Only one team chat can exist per organization.
              </p>
              <Button onClick={handleCreateTeam} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                Create Team Chat
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
