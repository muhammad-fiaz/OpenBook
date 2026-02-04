import { ChatSkeleton } from "@/components/skeletons";

export default function ChatLoading() {
  return (
    <div className="h-full w-full min-h-screen">
      <ChatSkeleton />
    </div>
  );
}
