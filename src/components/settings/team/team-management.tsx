"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import { addTeamMember, removeTeamMember, updateMemberRole, leaveOrganization, getJoinRequests, approveJoinRequest, rejectJoinRequest } from "@/actions/team";
import { createOrganization } from "@/actions/settings";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, MoreHorizontal, UserX, Crown, LogOut, Check, UserCheck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(UserRole),
});

export function TeamManagement({ members, currentUser }: { members: any[], currentUser: any }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [joinRequests, setJoinRequests] = useState<any[]>([]);
    const router = useRouter();

    const canManage = currentUser.role === "OWNER" || currentUser.role === "ADMIN";

    useEffect(() => {
        if (canManage) {
            getJoinRequests().then(setJoinRequests).catch(() => {});
        }
    }, [canManage]);

    const form = useForm<z.infer<typeof addMemberSchema>>({
        resolver: zodResolver(addMemberSchema),
        defaultValues: {
            email: "",
            role: "MEMBER",
        }
    });

    function onAddMember(values: z.infer<typeof addMemberSchema>) {
        startTransition(async () => {
            try {
                await addTeamMember(values.email, values.role);
                toast.success("Member added successfully");
                setIsAddOpen(false);
                form.reset();
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to add member");
            }
        });
    }

    function onRemoveMember(userId: string) {
        if (!confirm("Are you sure you want to remove this member?")) return;
        startTransition(async () => {
            try {
                await removeTeamMember(userId);
                toast.success("Member removed");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    }

    function onLeaveOrg() {
        if (!confirm("Are you sure you want to leave this organization?")) return;
        startTransition(async () => {
             try {
                await leaveOrganization();
                toast.success("You have left the organization");
                router.push("/user/dashboard");
             } catch (error: any) {
                 toast.error(error.message);
             }
        });
    }

    function onApproveRequest(requestId: string) {
        startTransition(async () => {
            try {
                await approveJoinRequest(requestId);
                toast.success("Join request approved");
                setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to approve request");
            }
        });
    }

    function onRejectRequest(requestId: string) {
        startTransition(async () => {
            try {
                await rejectJoinRequest(requestId);
                toast.success("Join request declined");
                setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
            } catch (error: any) {
                toast.error(error.message || "Failed to decline request");
            }
        });
    }

    return (
        <div className="space-y-6">
        {canManage && joinRequests.length > 0 && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Join Requests</CardTitle>
                        <Badge variant="secondary">{joinRequests.length}</Badge>
                    </div>
                    <CardDescription>
                        Users requesting to join your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {joinRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={request.user?.image || ""} />
                                        <AvatarFallback>{request.user?.name?.charAt(0) || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{request.user?.name}</div>
                                        <div className="text-sm text-muted-foreground">{request.user?.email}</div>
                                        {request.message && (
                                            <p className="text-sm text-muted-foreground mt-1 italic">
                                                &quot;{request.message}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onRejectRequest(request.id)}
                                        disabled={isPending}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Decline
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onApproveRequest(request.id)}
                                        disabled={isPending}
                                    >
                                        <UserCheck className="mr-1 h-3 w-3" />
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Manage who has access to this organization
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onLeaveOrg} disabled={isPending}>
                         <LogOut className="mr-2 h-4 w-4"/>
                         Leave Org
                    </Button>
                    {canManage && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Member</DialogTitle>
                                    <DialogDescription>
                                        Add a user by their email address. They must already have an account.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onAddMember)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="colleague@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="MEMBER">Member</SelectItem>
                                                            <SelectItem value="VIEWER">Viewer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="submit" disabled={isPending}>
                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Member
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={member.image || ""} />
                                    <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {member.name}
                                        {member.id === currentUser.id && <span className="text-xs text-muted-foreground">(You)</span>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {member.role === "OWNER" && (
                                        <Badge variant="default" className="gap-1 bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 dark:text-yellow-400 border-yellow-500/50">
                                            <Crown className="w-3 h-3" />
                                            Owner
                                        </Badge>
                                    )}
                                    {member.role === "ADMIN" && (
                                        <Badge variant="secondary">
                                            Admin
                                        </Badge>
                                    )}
                                    {member.role === "MEMBER" && (
                                        <Badge variant="outline">
                                            Member
                                        </Badge>
                                    )}
                                    {member.role === "VIEWER" && (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            Viewer
                                        </Badge>
                                    )}
                                </div>
                                {canManage && member.role !== "OWNER" && member.id !== currentUser.id && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onRemoveMember(member.id)} className="text-red-600">
                                                <UserX className="mr-2 h-4 w-4" />
                                                Remove from Team
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        </div>
    );
}

const createOrgSchema = z.object({
    name: z.string().min(2, "Name is required"),
});

export function CreateOrganization() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof createOrgSchema>>({
        resolver: zodResolver(createOrgSchema),
        defaultValues: { name: "" }
    });

    function onSubmit(values: z.infer<typeof createOrgSchema>) {
        startTransition(async () => {
            try {
                await createOrganization({ name: values.name });
                toast.success("Organization created successfully");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    }

    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>
                    You are not part of any organization. Create one to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Organization
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
