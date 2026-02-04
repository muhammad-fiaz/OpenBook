"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Send,
  MoreVertical,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getChatMessages,
  sendChatMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "@/actions/chat";

interface ChatMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface ChatRoom {
  id: string;
  name: string | null;
  type: string;
  members: ChatMember[];
}

interface MessageData {
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  sender: { id: string; name: string; email: string; image: string | null };
}

export function ChatWindow({ room, roomDisplayName }: { room: ChatRoom; roomDisplayName: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, startSendTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getChatMessages(room.id);
        setMessages(data.messages as MessageData[]);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [room.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getChatMessages(room.id);
        setMessages(data.messages as MessageData[]);
      } catch {
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [room.id]);

  function handleSend() {
    if (!newMessage.trim()) return;
    const msg = newMessage;
    setNewMessage("");

    startSendTransition(async () => {
      try {
        const sent = await sendChatMessage(room.id, msg);
        setMessages((prev) => [...prev, sent as MessageData]);
        inputRef.current?.focus();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send");
        setNewMessage(msg);
      }
    });
  }

  function handleDeleteForMe(messageId: string) {
    startDeleteTransition(async () => {
      try {
        await deleteMessageForMe(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  function handleDeleteForEveryone(messageId: string) {
    startDeleteTransition(async () => {
      try {
        await deleteMessageForEveryone(messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: "This message was deleted" }
              : m,
          ),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete");
      }
    });
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <>
      <CardHeader className="shrink-0 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{roomDisplayName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {room.members.length} member{room.members.length !== 1 ? "s" : ""}
                <span className="mx-1">·</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{room.type}</Badge>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 group">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(message.sender.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{message.sender.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(message.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm mt-0.5",
                        message.isDeleted ? "italic text-muted-foreground" : "",
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                  {!message.isDeleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteForMe(message.id)} disabled={isDeleting}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete for me
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteForEveryone(message.id)}
                          disabled={isDeleting}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete for everyone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="shrink-0 border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </>
  );
}
