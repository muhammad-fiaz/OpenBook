"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Plus,
  Users,
  Hash,
  User,
  Search,
  MoreVertical,
  Trash2,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { deleteChatRoom, leaveChatRoom, clearChatForMe } from "@/actions/chat";

interface ChatMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface ChatRoomData {
  id: string;
  name: string | null;
  type: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  members: ChatMember[];
  messages: Array<{ content: string; createdAt: Date; senderId: string; isDeleted: boolean }>;
}

export function ChatLayout({ initialRooms }: { initialRooms: ChatRoomData[] }) {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedRoom = initialRooms.find((r) => r.id === selectedRoomId);

  const filteredRooms = initialRooms.filter((room) => {
    const roomName = getRoomDisplayName(room);
    return roomName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function getRoomDisplayName(room: ChatRoomData): string {
    if (room.name) return room.name;
    if (room.type === "DIRECT") {
      const otherMember = room.members.find((m) => m.user.name !== ""); // we'll improve this
      return otherMember?.user.name || "Direct Message";
    }
    return "Chat Room";
  }

  function getRoomIcon(type: string) {
    switch (type) {
      case "DIRECT": return User;
      case "GROUP": return Hash;
      case "TEAM": return Users;
      default: return MessageSquare;
    }
  }

  function handleDeleteRoom(roomId: string) {
    startTransition(async () => {
      try {
        await deleteChatRoom(roomId);
        if (selectedRoomId === roomId) setSelectedRoomId(null);
        toast.success("Chat deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete");
      }
    });
  }

  function handleLeaveRoom(roomId: string) {
    startTransition(async () => {
      try {
        await leaveChatRoom(roomId);
        if (selectedRoomId === roomId) setSelectedRoomId(null);
        toast.success("Left chat room");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to leave");
      }
    });
  }

  function handleClearChat(roomId: string) {
    startTransition(async () => {
      try {
        await clearChatForMe(roomId);
        toast.success("Chat cleared for you");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to clear");
      }
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-220px)]">
        {/* Sidebar - Chat List */}
        <Card className="lg:col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowNewChat(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat with your team</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredRooms.map((room) => {
                    const RoomIcon = getRoomIcon(room.type);
                    const lastMessage = room.messages[0];
                    const isSelected = selectedRoomId === room.id;

                    return (
                      <div
                        key={room.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer transition-colors group",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50",
                        )}
                        onClick={() => setSelectedRoomId(room.id)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedRoomId(room.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <RoomIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{getRoomDisplayName(room)}</p>
                            {lastMessage && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {lastMessage.isDeleted ? "Message deleted" : lastMessage.content}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{room.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{room.members.length} members</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleClearChat(room.id)} disabled={isPending}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear chat for me
                            </DropdownMenuItem>
                            {room.type !== "DIRECT" && (
                              <DropdownMenuItem onClick={() => handleLeaveRoom(room.id)} disabled={isPending}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteRoom(room.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete chat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden">
          {selectedRoom ? (
            <ChatWindow
              room={selectedRoom}
              roomDisplayName={getRoomDisplayName(selectedRoom)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing chats or start a new one</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowNewChat(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
          )}
        </Card>
      </div>

      <NewChatDialog open={showNewChat} onOpenChange={setShowNewChat} />
    </>
  );
}
