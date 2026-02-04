"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSession } from "@/lib/auth-client";
import { FullPageSpinner } from "@/components/skeletons";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { isOnboardingComplete, baseCurrency } = useOnboardingStore();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/sign-in");
    }
    if (!isPending && session && !isOnboardingComplete && !baseCurrency) {
      router.push("/onboarding");
    }
  }, [session, isPending, isOnboardingComplete, baseCurrency, router]);

  if (isPending) {
    return <FullPageSpinner text="Loading your workspace..." />;
  }

  if (!session) {
    return null;
  }

  if (!isOnboardingComplete && !baseCurrency) {
    return null;
  }

  return <>{children}</>;
}
