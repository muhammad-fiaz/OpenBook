"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getUserOrganizations, switchOrganization } from "@/actions/settings";
import { Organization } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, Building2, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";

export function SidebarOrganizationSwitcher() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { data: session } = useSession();
  const router = useRouter();
  const { isCollapsed } = useSidebarStore();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const orgs = await getUserOrganizations();
        setOrganizations(orgs as any);
      } catch (e) {
        console.error(e);
      }
    }
    if (session?.user) {
        load();
    }
  }, [session]);
  
  const currentOrg = organizations.find(o => o.id === (session?.user as any)?.organizationId) || organizations[0];

  async function handleSwitch(orgId: string) {
      if (orgId === currentOrg?.id) return;
      
      startTransition(async () => {
        try {
            await switchOrganization(orgId);
            router.refresh();
        } catch (e) {
            console.error(e);
        }
      });
  }

  if (!currentOrg) return (
      <div className="flex items-center justify-center h-12 w-full px-2">
           <div className="h-8 w-8 rounded-lg bg-sidebar-accent animate-pulse" />
      </div>
  );

  return (
    <div className="p-2 w-full">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            className={cn(
                "w-full justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center px-0" : ""
            )}
            disabled={isPending}
            >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Building2 className="h-4 w-4" />}
            </div>
            
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-1 items-center justify-between overflow-hidden text-left"
                >
                    <div className="grid gap-0.5 leading-none">
                        <span className="font-semibold truncate">{currentOrg.name}</span>
                        <span className="text-xs text-muted-foreground truncate">Select Organization</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </motion.div>
                )}
            </AnimatePresence>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            className="w-60 min-w-60"
            align="start"
            side={isCollapsed ? "right" : "bottom"}
            sideOffset={isCollapsed ? 10 : 5}
        >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
            </DropdownMenuLabel>
            <DropdownMenuGroup>
            {organizations.map((org) => (
                <DropdownMenuItem
                key={org.id}
                onSelect={() => handleSwitch(org.id)}
                className="gap-2 p-2"
                >
                <div className="flex h-6 w-6 items-center justify-center rounded-sm border bg-background">
                    <Building2 className="h-4 w-4" />
                </div>
                {org.name}
                {currentOrg.id === org.id && (
                    <Check className="ml-auto h-4 w-4" />
                )}
                </DropdownMenuItem>
            ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onSelect={() => router.push("/onboarding?new=true")}>
            <div className="flex h-6 w-6 items-center justify-center rounded-sm border bg-background">
                <PlusCircle className="h-4 w-4" />
            </div>
            Create Organization
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}
