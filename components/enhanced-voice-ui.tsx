"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useRTCService } from "@/hooks/useRTCService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AudioVisualizer } from "./audio-visualizer";
import {
  MicIcon,
  MicOffIcon,
  PowerIcon,
  LinkIcon,
  Bot,
  User,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export default function EnhancedVoiceUI() {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Disconnected");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    connect,
    disconnect,
    toggleSpeaking,
    onUserMessage,
    onAssistantMessage,
    sendCustomEvent,
    isConnected,
    getConnectionState,
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
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus("Connection failed");
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnected(false);
    setSpeaking(false);
    setListening(false);
    setStatus("Disconnected");
  };

  const handleSpeakToggle = () => {
    toggleSpeaking();
    const newSpeaking = !speaking;
    setSpeaking(newSpeaking);
    setListening(newSpeaking);
  };

  useEffect(() => {
    const cleanupUserMessage = onUserMessage((msg: any) => {
      console.log("User message:", msg);
      setListening(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: msg, timestamp: new Date() },
      ]);
    });

    const cleanupAssistantMessage = onAssistantMessage((msg: any) => {
      console.log("Assistant message:", msg);
      setIsTyping(false);
      setSpeaking(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, timestamp: new Date() },
      ]);

      // Reset speaking state after a delay
      setTimeout(() => setSpeaking(false), 2000);
    });

    return () => {
      cleanupUserMessage();
      cleanupAssistantMessage();
    };
  }, [onUserMessage, onAssistantMessage]);

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
    <div className="flex flex-col h-[100%] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Header - Fixed */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Bot className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Voice Assistant</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered voice interaction
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={connected ? "default" : "secondary"}
              className={cn(
                "font-medium px-3 py-1",
                connected && "bg-green-500 hover:bg-green-600",
                status === "Connecting..." &&
                  "bg-yellow-500 hover:bg-yellow-600"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  connected ? "bg-white animate-pulse" : "bg-gray-400"
                )}
              />
              {status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Visualizer Section - Fixed */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b flex-shrink-0">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Waves className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {speaking
                      ? "AI Speaking"
                      : listening
                      ? "Listening"
                      : connected
                      ? "Ready"
                      : "Disconnected"}
                  </span>
                </div>
                {isTyping && (
                  <div className="text-sm text-muted-foreground">
                    AI is thinking...
                  </div>
                )}
              </div>

              <AudioVisualizer
                isActive={connected}
                isListening={listening}
                isSpeaking={speaking}
                className="h-24"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 max-h-[calc(100%-280px)]">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Connect and start speaking to begin
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    message.role === "user"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
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
                  "flex flex-col gap-1 max-w-[80%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <Card
                  className={cn(
                    "p-4 shadow-sm border-0",
                    message.role === "user"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : "bg-white dark:bg-slate-800 shadow-md"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                </Card>

                {message.timestamp && (
                  <span className="text-xs text-muted-foreground px-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white dark:bg-slate-800 shadow-md border-0 p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls - Fixed */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 shadow-lg flex-shrink-0">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Connection Controls */}
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <Button
                variant="default"
                onClick={handleConnect}
                disabled={status === "Connecting..."}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                {status === "Connecting..." ? "Connecting..." : "Connect"}
              </Button>
            )}
            {connected && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <PowerIcon className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>

          {/* Voice Controls */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={listening ? "destructive" : "default"}
                  onClick={handleSpeakToggle}
                  disabled={!connected}
                  size="lg"
                  className={cn(
                    "h-16 w-16 p-0 rounded-full",
                    listening
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {listening ? (
                    <MicOffIcon className="h-6 w-6" />
                  ) : (
                    <MicIcon className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            This AI assistant can make mistakes. Please verify important
            information.
          </p>
        </div>
      </div>

      <audio ref={audioRef} hidden autoPlay />
    </div>
  );
}
