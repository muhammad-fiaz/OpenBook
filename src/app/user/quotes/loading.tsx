import { ListPageSkeleton } from "@/components/skeletons";

export default function QuotesLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ListPageSkeleton />
    </div>
  );
}
