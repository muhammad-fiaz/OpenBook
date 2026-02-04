import { getChatRooms } from "@/actions/chat";
import { ChatLayout } from "@/components/chat/chat-layout";

export default async function ChatPage() {
  const rooms = await getChatRooms();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">
          Communicate with your team members
        </p>
      </div>
      <ChatLayout initialRooms={rooms} />
    </div>
  );
}
