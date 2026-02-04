"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebarStore();

  return (
    <OnboardingGuard>
      <TooltipProvider>
        <div className="min-h-screen bg-background relative">
          <AppSidebar />
          <div
            className={cn(
              "flex min-h-screen flex-col transition-all duration-200 ease-in-out",
              isMobile ? "ml-0" : (isCollapsed ? "ml-20" : "ml-64")
            )}
          >
            <Navbar />
            <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-3.5rem)] overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </OnboardingGuard>
  );
}
