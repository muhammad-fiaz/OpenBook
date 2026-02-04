import { DashboardSkeleton } from "@/components/skeletons";

export default function ReportsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <DashboardSkeleton />
    </div>
  );
}
