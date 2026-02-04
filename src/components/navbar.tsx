"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";
import { MobileSidebar } from "@/components/app-sidebar";
import { useSidebarStore } from "@/stores/sidebar-store";
import { GlobalSearch } from "@/components/global-search";
import { getUnreadNotificationCount } from "@/actions/notifications";

export function Navbar() {
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
    const interval = setInterval(() => {
      getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <MobileSidebar />
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden md:flex" 
          onClick={() => setCollapsed(!isCollapsed)}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="relative w-full md:w-auto">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
          <Link href="/user/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || "OB"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/user/settings?tab=profile" className="cursor-pointer">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/settings" className="cursor-pointer">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
