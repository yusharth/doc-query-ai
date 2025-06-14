"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileBreadcrumb } from "@/components/mobile-breadcrumb";
import { ChatMessage } from "@/components/chat-message";
import { TypingIndicator } from "@/components/typing-indicator";
import { Bot, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "error";
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatPageProps {
  onMenuClick?: () => void;
}

// Sample agent data
// const agentData = {
//   "1": { name: "Customer Support Agent", type: "RAG Chat" },
//   "2": { name: "Product FAQ Bot", type: "RAG Chat" },
//   "3": { name: "HR Policy Assistant", type: "RAG Chat" },
//   "4": { name: "Technical Support", type: "RAG Chat" },
//   "5": { name: "Sales Assistant", type: "RAG Chat" },
//   "6": { name: "Onboarding Guide", type: "RAG Chat" },
// };

export default function ChatPage({ onMenuClick }: ChatPageProps) {
  const params = useParams();
  const agentId = params.agentId as string;
  // const agent = agentData[agentId as keyof typeof agentData];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hello! I'm ${
        // agent?.name ||
        "your AI assistant"
      }. How can I help you today?`,
      sender: "agent",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Agents", href: "/agents" },
    {
      label:
        //  agent?.name ||
        "Chat",
      isCurrentPage: true,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Cleanup function to abort any ongoing requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          task_id: agentId, // Using agentId as task_id
          user_message: inputValue,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const agentMessageId = (Date.now() + 1).toString();

      // Create initial streaming message
      setMessages((prev) => [
        ...prev,
        {
          id: agentMessageId,
          content: "",
          sender: "agent",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === "[DONE]") {
              break;
            }

            // Update the streaming message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMessageId
                  ? { ...msg, content: msg.content + data }
                  : msg
              )
            );
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: "Sorry, there was an error connecting to the server.",
            sender: "error",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  if (!agentId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Agent not found</h1>
          <Button asChild className="mt-4">
            <Link href="/agents">Back to Agents</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.6rem)" }}>
      {onMenuClick && (
        <MobileBreadcrumb onMenuClick={onMenuClick} items={breadcrumbItems} />
      )}

      {/* Chat Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="md:hidden" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">
              {
                // agent.name ||
                "Dummy Agent Name"
              }
            </h1>
            <p className="text-sm text-muted-foreground">
              {
                // agent.type ||
                "RAG Agent"
              }
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <Card className="p-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="border-0 focus-visible:ring-0"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </Card>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            This agent can make mistakes. Consider checking important
            information.
          </p>
        </div>
      </div>
    </div>
  );
}
