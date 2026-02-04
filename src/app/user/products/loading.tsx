import { ListPageSkeleton } from "@/components/skeletons";

export default function ProductsLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ListPageSkeleton />
    </div>
  );
}
