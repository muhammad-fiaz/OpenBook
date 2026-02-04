import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStore {
  isOnboardingComplete: boolean;
  baseCurrency: string | null;
  setBaseCurrency: (currency: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      baseCurrency: null,
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      resetOnboarding: () => set({ isOnboardingComplete: false, baseCurrency: null }),
    }),
    {
      name: "openbook-onboarding",
    }
  )
);
