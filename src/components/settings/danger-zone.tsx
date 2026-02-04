"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle, LogOut, Shield } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { deleteAllData, deleteAccount } from "@/actions/settings";
import { leaveOrganization, deleteOrganization } from "@/actions/team";
import { signOut } from "@/lib/auth-client";

interface DangerZoneProps {
  userRole?: string;
  hasOrganization?: boolean;
}

export function DangerZone({ userRole, hasOrganization }: DangerZoneProps) {
  const router = useRouter();
  const [isDeleteDataPending, startDeleteDataTransition] = useTransition();
  const [isDeleteAccountPending, startDeleteAccountTransition] = useTransition();
  const [isDeleteOrgPending, startDeleteOrgTransition] = useTransition();
  const [isLeavePending, startLeaveTransition] = useTransition();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteOrgConfirmation, setDeleteOrgConfirmation] = useState("");

  const isOwner = userRole === "OWNER";

  function onDeleteData() {
    startDeleteDataTransition(async () => {
      try {
        await deleteAllData();
        toast.success("All data has been deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete data");
      }
    });
  }

  function onDeleteAccount() {
    startDeleteAccountTransition(async () => {
      try {
        await deleteAccount();
        await signOut();
        toast.success("Account deleted successfully");
        router.push("/");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete account");
      }
    });
  }

  function onLeaveOrg() {
    startLeaveTransition(async () => {
      try {
        await leaveOrganization();
        toast.success("You have left the organization");
        router.push("/user/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to leave");
      }
    });
  }

  function onDeleteOrg() {
    startDeleteOrgTransition(async () => {
      try {
        await deleteOrganization();
        toast.success("Organization deleted. All members have been removed.");
        router.push("/user/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete organization");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
             Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Leave Organization (non-owner members) */}
          {hasOrganization && !isOwner && (
            <div className="flex items-center justify-between p-4 border rounded-lg border-orange-100 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
              <div className="space-y-1">
                <h4 className="font-medium text-orange-900 dark:text-orange-200">Leave Organization</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Leave the current organization. You will lose access to all organization data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Organization?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will lose access to all organization data, invoices, clients, and team features.
                      You can rejoin only if you are invited again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onLeaveOrg} className="bg-orange-600 hover:bg-orange-700">
                      {isLeavePending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, leave"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete All Data (Owner only) */}
          {isOwner && (
            <div className="flex items-center justify-between p-4 border rounded-lg border-red-100 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
              <div className="space-y-1">
                  <h4 className="font-medium text-red-900 dark:text-red-200">Delete All Data</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                      Permanently delete all invoices, clients, payments, and transactions. This does not delete your account or organization.
                  </p>
              </div>
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all your specific business data.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteData} className="bg-red-600 hover:bg-red-700">
                          {isDeleteDataPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Yes, delete data"}
                      </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete Organization (Owner only) */}
          {isOwner && hasOrganization && (
            <div className="flex items-center justify-between p-4 border rounded-lg border-red-100 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
              <div className="space-y-1">
                <h4 className="font-medium text-red-900 dark:text-red-200">Delete Organization</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete the organization and all its data. All members will be removed.
                  This action affects <strong>every member</strong> of the organization.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Delete Org
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the organization, all members will be removed, and all business data
                      (invoices, clients, payments, transactions, chat history) will be destroyed.
                      This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="py-4">
                      <Label>Type <span className="font-bold">delete organization</span> to confirm</Label>
                      <Input
                        value={deleteOrgConfirmation}
                        onChange={(e) => setDeleteOrgConfirmation(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={deleteOrgConfirmation !== "delete organization" || isDeleteOrgPending}
                      onClick={onDeleteOrg}
                    >
                      {isDeleteOrgPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Organization"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-100 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
            <div className="space-y-1">
                <h4 className="font-medium text-red-900 dark:text-red-200">Delete Account</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                    Permanently delete your account and all associated data.
                    {hasOrganization && isOwner && (
                      <span className="block mt-1 font-medium">
                        Warning: As the owner, deleting your account will also delete the organization and affect all members.
                      </span>
                    )}
                </p>
            </div>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        {hasOrganization && isOwner && (
                          <span className="block mt-2 font-medium text-destructive">
                            As the organization owner, this will also delete the entire organization and affect all members.
                          </span>
                        )}
                    </AlertDialogDescription>
                    <div className="py-4">
                        <Label>Type <span className="font-bold">delete my account</span> to confirm</Label>
                        <Input 
                            value={deleteConfirmation} 
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button 
                        variant="destructive"
                        disabled={deleteConfirmation !== "delete my account" || isDeleteAccountPending}
                        onClick={onDeleteAccount}
                    >
                        {isDeleteAccountPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Delete Account"}
                    </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
