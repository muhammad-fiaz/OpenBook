import { NotificationsSkeleton } from "@/components/skeletons";

export default function NotificationsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <NotificationsSkeleton />
    </div>
  );
}
