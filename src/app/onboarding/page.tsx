import { Metadata } from "next";
import { Suspense } from "react";
import OnboardingClient from "./onboarding-client";

export const metadata: Metadata = {
  title: "Setup Your Currency",
  description: "Select your organization's base currency for financial reporting",
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OnboardingClient />
    </Suspense>
  );
}
