"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Check, Building2, Loader2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { currencies } from "@/lib/currencies";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { createOrganization } from "@/actions/settings";
import { validateOrganization, requestToJoinOrganization } from "@/actions/team";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const { data: session, isPending: isSessionPending } = useSession();

  const [step, setStep] = useState<'loading' | 'choose' | 'create-org' | 'join-org' | 'currency'>('loading');
  const [orgName, setOrgName] = useState("");
  const [createPending, setCreatePending] = useState(false);

  const [joinOrgId, setJoinOrgId] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [joinValidating, setJoinValidating] = useState(false);
  const [joinOrgInfo, setJoinOrgInfo] = useState<{ name: string; slug: string } | null>(null);
  const [joinError, setJoinError] = useState("");
  const [joinPending, setJoinPending] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const { setBaseCurrency, completeOnboarding } = useOnboardingStore();

  useEffect(() => {
    if (!isSessionPending) {
      if (isNew) {
        setStep('create-org');
      } else if (!(session?.user as any)?.organizationId) {
        setStep('choose');
      } else {
        setStep('currency');
      }
    }
  }, [isSessionPending, session, isNew]);

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase()) ||
      currency.country.toLowerCase().includes(search.toLowerCase())
  );

  const saveCurrencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      const response = await fetch("/api/settings/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCurrency: currency }),
      });
      if (!response.ok) throw new Error("Failed to save currency");
      return response.json();
    },
    onSuccess: () => {
      if (selectedCurrency) {
        setBaseCurrency(selectedCurrency);
        completeOnboarding();
        router.push("/user/dashboard");
        router.refresh();
      }
    },
  });

  const handleContinue = () => {
    if (selectedCurrency) {
      saveCurrencyMutation.mutate(selectedCurrency);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setCreatePending(true);
    try {
      await createOrganization({ name: orgName });
      setStep('currency');
    } catch (error: any) {
      toast.error(error?.message || "Failed to create organization");
    } finally {
      setCreatePending(false);
    }
  };

  const handleSkipOrg = () => {
    setStep('currency');
  };

  const handleValidateOrg = async () => {
    if (!joinOrgId.trim()) {
      setJoinError("Please enter an organization ID");
      return;
    }

    setJoinValidating(true);
    setJoinError("");
    setJoinOrgInfo(null);

    try {
      const result = await validateOrganization(joinOrgId.trim());
      if (result.exists && result.organization) {
        setJoinOrgInfo({ name: result.organization.name, slug: result.organization.slug });
      } else {
        setJoinError(result.error || "Organization not found");
      }
    } catch (error: any) {
      setJoinError(error?.message || "Failed to validate organization");
    } finally {
      setJoinValidating(false);
    }
  };

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinOrgId.trim() || !joinOrgInfo) return;

    setJoinPending(true);
    try {
      const result = await requestToJoinOrganization(joinOrgId.trim(), joinMessage || undefined);
      toast.success(`Join request sent to ${result.orgName}! You'll be notified when approved.`);
      setStep('currency');
    } catch (error: any) {
      toast.error(error?.message || "Failed to send join request");
    } finally {
      setJoinPending(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background to-muted">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
              <p className="text-muted-foreground text-sm">
                How would you like to get started?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('create-org')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create an Organization</p>
                  <p className="text-sm text-muted-foreground">Set up a new workspace for your business</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setStep('join-org')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
              >
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Join an Organization</p>
                  <p className="text-sm text-muted-foreground">Request to join using an organization ID</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center px-4">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={handleSkipOrg}
                className="w-full text-muted-foreground"
              >
                Skip for now — I'll set up later
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'join-org') {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background to-muted">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Join Organization</h1>
              <p className="text-muted-foreground text-sm">
                Enter the organization ID to request access
              </p>
            </div>

            <form onSubmit={handleJoinRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinOrgId">Organization ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="joinOrgId"
                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                    value={joinOrgId}
                    onChange={(e) => {
                      setJoinOrgId(e.target.value);
                      setJoinOrgInfo(null);
                      setJoinError("");
                    }}
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateOrg}
                    disabled={joinValidating || !joinOrgId.trim()}
                  >
                    {joinValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                {joinError && (
                  <p className="text-sm text-destructive">{joinError}</p>
                )}
                {joinOrgInfo && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {joinOrgInfo.name}
                      </p>
                      <p className="text-xs text-green-600/70 dark:text-green-500/70">
                        @{joinOrgInfo.slug}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {joinOrgInfo && (
                <div className="space-y-2">
                  <Label htmlFor="joinMessage">Message (optional)</Label>
                  <Textarea
                    id="joinMessage"
                    placeholder="Hi, I'd like to join your organization..."
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={joinPending || !joinOrgInfo}
                className="w-full"
                size="lg"
              >
                {joinPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Join Request
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('choose')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkipOrg}
                  className="flex-1 text-muted-foreground"
                >
                  Skip
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'create-org') {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background to-muted">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Create Organization</h1>
              <p className="text-muted-foreground text-sm">
                Name your workspace to get started
              </p>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={createPending || !orgName.trim()}
                className="w-full"
                size="lg"
              >
                {createPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create & Continue
              </Button>

              {!isNew && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('choose')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipOrg}
                    className="flex-1 text-muted-foreground"
                  >
                    Skip
                  </Button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Setup Currency</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Please select your organization's base currency ({orgName || "Default"}).
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search currency, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <ScrollArea className="h-[50vh] sm:h-[55vh] md:h-[500px] rounded-md border">
              <div className="p-2 sm:p-3 md:p-4 space-y-2">
                {filteredCurrencies.map((currency) => (
                  <motion.button
                    key={currency.code}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedCurrency(currency.code)}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-colors ${
                      selectedCurrency === currency.code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{currency.symbol}</span>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {currency.name} ({currency.code})
                        </div>
                        <div className="text-xs sm:text-sm opacity-70 truncate">{currency.country}</div>
                      </div>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ml-2" />
                    )}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>

            <Button
              onClick={handleContinue}
              disabled={!selectedCurrency || saveCurrencyMutation.isPending}
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
              size="lg"
            >
              {saveCurrencyMutation.isPending ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
