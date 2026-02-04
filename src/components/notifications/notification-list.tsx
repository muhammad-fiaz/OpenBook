"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  Trash2,
  Mail,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/actions/notifications";

const typeIcons: Record<string, React.ElementType> = {
  INVITATION: Mail,
  TEAM: Users,
  INVOICE: FileText,
  PAYMENT: CreditCard,
  CHAT: MessageSquare,
  SYSTEM: Bell,
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  sender: { id: string; name: string; email: string; image: string | null } | null;
}

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      try {
        await markNotificationAsRead(id);
        router.refresh();
      } catch {
        toast.error("Failed to mark as read");
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead();
        toast.success("All notifications marked as read");
        router.refresh();
      } catch {
        toast.error("Failed to mark all as read");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteNotification(id);
        router.refresh();
      } catch {
        toast.error("Failed to delete notification");
      }
    });
  }

  function handleClearAll() {
    startTransition(async () => {
      try {
        await clearAllNotifications();
        toast.success("All notifications cleared");
        router.refresh();
      } catch {
        toast.error("Failed to clear notifications");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                    !notification.isRead
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      !notification.isRead ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {notification.sender && <span>From {notification.sender.name}</span>}
                      <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkRead(notification.id)} disabled={isPending}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(notification.id)} disabled={isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
