import { DashboardSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <DashboardSkeleton />
    </div>
  );
}
