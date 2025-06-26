"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRTCService } from "@/hooks/useRTCService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  MicIcon,
  SoupIcon,
  SendIcon,
  PowerIcon,
  LinkIcon,
  VolumeIcon,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

const VoiceUI = () => {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [silentDetection, setSilentDetection] = useState(true);
  const [silentDetectionLoading, setSilentDetectionLoading] = useState(false);
  const [status, setStatus] = useState("Disconnected");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use the RTC service hook
  const {
    connect,
    disconnect,
    toggleSpeaking,
    onUserMessage,
    onAssistantMessage,
    sendCustomEvent,
    isConnected,
    getConnectionState,
    toggleTurnDetection,
  } = useRTCService();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConnect = async () => {
    if (audioRef.current) {
      try {
        setStatus("Connecting...");
        await connect(audioRef.current);
        setConnected(true);
        setStatus("Connected");

        setTimeout(() => {
          if (silentDetection) {
            toggleTurnDetection(true);
          }
        }, 1000);
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus("Connection failed");
      }
    }
  };

  const handleDisconnect = () => {
    if (silentDetection) {
      toggleTurnDetection(false);
    }
    disconnect();
    setConnected(false);
    setSpeaking(false);
    setStatus("Disconnected");
  };

  const handleToggleSilentDetection = async () => {
    const newState = !silentDetection;
    setSilentDetectionLoading(true);
    setSilentDetection(newState);

    try {
      await toggleTurnDetection(newState);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Silent detection has been turned ${
            newState ? "on" : "off"
          }.`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to toggle silent detection:", error);
      setSilentDetection(!newState); // Revert state on error
    } finally {
      setSilentDetectionLoading(false);
    }
  };

  const handleSpeakToggle = () => {
    toggleSpeaking();
    setSpeaking((prev) => !prev);
  };

  const handleSendText = () => {
    if (!inputText.trim() || !connected) return;

    // Add message to UI
    const userMessage = {
      role: "user",
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage as Message]);

    // Send via custom event
    sendCustomEvent({
      type: "text.input",
      text: inputText,
    });

    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  useEffect(() => {
    // Set up message handlers
    const cleanupUserMessage = onUserMessage((msg: any) => {
      console.log("msguser", msg);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: msg, timestamp: new Date() },
      ]);
    });

    const cleanupAssistantMessage = onAssistantMessage((msg: any) => {
      console.log("msgAI", msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, timestamp: new Date() },
      ]);
    });

    return () => {
      // Clean up subscriptions when component unmounts
      cleanupUserMessage();
      cleanupAssistantMessage();
    };
  }, [onUserMessage, onAssistantMessage]);

  // Update connection status based on service state
  useEffect(() => {
    if (isConnected?.()) {
      setConnected(true);
      setStatus("Connected");
    } else {
      setConnected(false);
      setStatus("Disconnected");
    }
  }, [isConnected]);

  return (
    <div
      className="flex flex-col h-[100%]"
      // style={{ height: "calc(100vh - 3.6rem)" }}
    >
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">Voice Assistant</h1>
            <p className="text-sm text-muted-foreground">Voice-enabled AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant={connected ? "default" : "secondary"}
              className="font-bold"
            >
              {status === "Connecting..."
                ? "🟡 Connecting..."
                : connected
                ? "🟢 Connected"
                : "🔴 Disconnected"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "flex flex-col gap-1",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <Card
                  className={cn(
                    "max-w-[80%] p-3 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </Card>

                {message.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls and Input Area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 mb-4">
            <Button
              variant="default"
              onClick={handleConnect}
              disabled={connected}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={!connected}
              className="text-red-600 border-red-600 hover:bg-red-500"
            >
              <PowerIcon className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
            <Button
              variant={silentDetection ? "default" : "outline"}
              onClick={handleToggleSilentDetection}
              disabled={!connected || silentDetectionLoading}
              className={
                silentDetection ? "bg-purple-600 hover:bg-purple-700" : ""
              }
            >
              {silentDetectionLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <VolumeIcon className="mr-2 h-4 w-4" />
                  {silentDetection
                    ? "Silent Detection On"
                    : "Silent Detection Off"}
                </>
              )}
            </Button>
          </div>

          <Card className="p-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="border-0 focus-visible:ring-0"
                  disabled={!connected}
                />
              </div>
              <Button
                onClick={handleSendText}
                disabled={!inputText.trim() || !connected}
                size="sm"
                className="h-10 w-10 p-0"
              >
                <SendIcon className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
              <Button
                variant={speaking ? "destructive" : "default"}
                onClick={handleSpeakToggle}
                disabled={!connected}
                size="sm"
                className={
                  speaking
                    ? "h-10 w-10 p-0"
                    : "h-10 w-10 p-0 bg-green-600 hover:bg-green-700"
                }
              >
                {speaking ? (
                  <SoupIcon className="h-4 w-4" />
                ) : (
                  <MicIcon className="h-4 w-4" />
                )}
                <span className="sr-only">{speaking ? "Stop" : "Speak"}</span>
              </Button>
            </div>
          </Card>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            This assistant can make mistakes. Consider checking important
            information.
          </p>
        </div>
      </div>

      <audio ref={audioRef} hidden autoPlay />
    </div>
  );
};

export default VoiceUI;
