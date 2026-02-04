import { OrganizationForm } from "@/components/settings/organization-form";
import { InvoiceDefaultsForm } from "@/components/settings/invoice-defaults-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecurityForm } from "@/components/settings/security-form";
import { DangerZone } from "@/components/settings/danger-zone";
import { TeamManagement, CreateOrganization } from "@/components/settings/team/team-management";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getOrganizationSettings } from "@/actions/settings";
import { getTeamMembers } from "@/actions/team";
import { getPaymentMethods } from "@/actions/settings";
import { getTaxes, getFees } from "@/actions/taxes-fees";
import { PaymentMethods } from "@/components/settings/payment-methods";
import { TaxesFeesForm } from "@/components/settings/taxes-fees-form";
import { DataManagement } from "@/components/settings/data-management";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const tab = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : "organization";
  const data = await getOrganizationSettings();

  if (!data?.org || !data?.user) {
    if (!data?.user) {
      redirect("/auth/sign-in");
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and security preferences
          </p>
        </div>

        <Tabs defaultValue={tab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            <CreateOrganization />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ProfileForm user={data.user} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityForm />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  const { org, user } = data;
  const teamMembers = await getTeamMembers();
  const paymentMethods = await getPaymentMethods();
  const taxes = await getTaxes();
  const fees = await getFees();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team, profile, and security preferences
        </p>
      </div>

      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="taxes-fees">Taxes & Fees</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="organization" className="space-y-4">
            <OrganizationForm initialData={org} />
            <InvoiceDefaultsForm settings={org.settings} />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
             <TeamManagement members={teamMembers || []} currentUser={user} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
             <PaymentMethods methods={paymentMethods} />
        </TabsContent>

        <TabsContent value="taxes-fees" className="space-y-4">
            <TaxesFeesForm taxes={taxes} fees={fees} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
            <ProfileForm user={user} />
            <DangerZone userRole={user.role ?? undefined} hasOrganization={!!org} />
        </TabsContent>

         <TabsContent value="security" className="space-y-4">
            <SecurityForm />
        </TabsContent>
        <TabsContent value="data" className="space-y-4">
             <DataManagement />
        </TabsContent>      </Tabs>
    </div>
  );
}
