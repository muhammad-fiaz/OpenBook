import { getNotifications, getMyInvitations } from "@/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { InvitationList } from "@/components/notifications/invitation-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function NotificationsPage() {
  const [notifications, invitations] = await Promise.all([
    getNotifications(),
    getMyInvitations(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">
          Notifications, invitations, and updates
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {invitations.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationList notifications={notifications} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationList invitations={invitations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
