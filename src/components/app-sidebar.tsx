"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  CreditCard,
  Users,
  Settings,
  BookOpen,
  Bell,
  MessageSquare,
  Package,
  FileCheck,
  Clock,
  PieChart,
  Heart,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/user/dashboard" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/user/analytics" },
  { id: "income", label: "Income", icon: ArrowDownCircle, href: "/user/income" },
  { id: "expenses", label: "Expenses", icon: ArrowUpCircle, href: "/user/expenses" },
  { id: "invoices", label: "Invoices", icon: FileText, href: "/user/invoices" },
  { id: "quotes", label: "Quotes", icon: FileCheck, href: "/user/quotes" },
  { id: "products", label: "Products", icon: Package, href: "/user/products" },
  { id: "payments", label: "Payments", icon: CreditCard, href: "/user/payments" },
  { id: "clients", label: "Clients", icon: Users, href: "/user/clients" },
  { id: "transactions", label: "Transactions", icon: CreditCard, href: "/user/transactions" },
  { id: "time-tracking", label: "Time Tracking", icon: Clock, href: "/user/time-tracking" },
  { id: "reports", label: "Reports", icon: PieChart, href: "/user/reports" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/user/chat" },
  { id: "notifications", label: "Inbox", icon: Bell, href: "/user/notifications" },
  { id: "settings", label: "Settings", icon: Settings, href: "/user/settings" },
];

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function MobileSidebar() {
  const pathname = usePathname();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center border-b px-4">
             <Link href="/user/dashboard" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">OpenBook</span>
            </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
             const isActive =
            item.href === "/user/dashboard"
              ? pathname === "/user/dashboard"
              : pathname.startsWith(item.href);

             return (
               <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
               >
                 <item.icon className="h-4 w-4 shrink-0" />
                 <span>{item.label}</span>
               </Link>
             )
          })}

        </nav>
        <div className="border-t p-3 space-y-1">
          <Link
            href="https://github.com/sponsors/muhammad-fiaz"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Github className="h-4 w-4 shrink-0" />
            <span>Sponsor on GitHub</span>
          </Link>
          <Link
            href="https://pay.muhammadfiaz.com"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Heart className="h-4 w-4 shrink-0 text-red-500 fill-red-500/10" />
            <span>Donate</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { SidebarOrganizationSwitcher } from "@/components/sidebar-organization-switcher";
import { useSidebarStore } from "@/stores/sidebar-store";
import { AnimatePresence } from "framer-motion";

export function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground"
    >
      {/* Organization Switcher */}
      <div className={cn("flex h-14 items-center border-b", isCollapsed ? "justify-center px-0" : "px-2")}>
        <SidebarOrganizationSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/user/dashboard"
              ? pathname === "/user/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <motion.span
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
               {isCollapsed && (
                  <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent z-[-1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sponsor & Donate - Fixed Bottom */}
      <div className={cn("border-t p-3 space-y-1", isCollapsed ? "flex flex-col items-center" : "")}>
        <Link
          href="https://github.com/sponsors/muhammad-fiaz"
          target="_blank"
          className={cn(
             "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
             isCollapsed && "justify-center px-2"
          )}
        >
          <Github className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sponsor on GitHub</span>}
        </Link>
        <Link
          href="https://pay.muhammadfiaz.com"
          target="_blank"
          className={cn(
             "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
             isCollapsed && "justify-center px-2"
          )}
        >
          <Heart className="h-4 w-4 shrink-0 text-red-500 fill-red-500/10" />
          {!isCollapsed && <span>Donate</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
