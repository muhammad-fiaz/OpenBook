import { ListPageSkeleton } from "@/components/skeletons";

export default function TimeTrackingLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ListPageSkeleton />
    </div>
  );
}
