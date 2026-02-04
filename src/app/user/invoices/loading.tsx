import { ListPageSkeleton } from "@/components/skeletons";

export default function InvoicesLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ListPageSkeleton />
    </div>
  );
}
