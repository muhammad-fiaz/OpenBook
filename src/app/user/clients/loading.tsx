import { ListPageSkeleton } from "@/components/skeletons";

export default function ClientsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ListPageSkeleton />
    </div>
  );
}
