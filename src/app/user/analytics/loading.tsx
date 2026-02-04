import { DashboardSkeleton } from "@/components/skeletons";

export default function AnalyticsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <DashboardSkeleton />
    </div>
  );
}
