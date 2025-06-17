"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileBreadcrumb } from "@/components/mobile-breadcrumb";
import { Bot, Mic, MicOff, Power, Send, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { onUserMessage, onAssistantMessage, connect, disconnect, toggleSpeaking, sendCustomEvent } from '../../../services/rtcService';

interface RTCVoicePageProps {
  onMenuClick?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function RTCVoicePage({ onMenuClick }: RTCVoicePageProps) {
  const params = useParams();
  const agentId = params.agentId as string;

  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your real-time AI assistant. Click Connect to start our conversation.',
      timestamp: new Date(),
    }
  ]);
  const [customEvent, setCustomEvent] = useState(
    JSON.stringify({
      type: 'session.update',
      session: { instructions: 'You are a helpful assistant.' },
    }, null, 2)
  );
  const [isConnecting, setIsConnecting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Agents", href: "/agents" },
    { label: "RTC Voice Chat", isCurrentPage: true },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    onUserMessage((msg: string) => {
      console.log('User message:', msg);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'user', 
        content: msg,
        timestamp: new Date()
      }]);
    });

    onAssistantMessage((msg: string) => {
      console.log('Assistant message:', msg);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: msg,
        timestamp: new Date()
      }]);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConnect = async () => {
    if (audioRef.current) {
      setIsConnecting(true);
      try {
        await connect(audioRef.current);
        setConnected(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Connected! You can now speak to me by clicking the microphone button.',
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Connection failed:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Failed to connect. Please check your configuration and try again.',
          timestamp: new Date()
        }]);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnected(false);
    setSpeaking(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Disconnected from real-time chat.',
      timestamp: new Date()
    }]);
  };

  const handleSpeakToggle = () => {
    toggleSpeaking();
    setSpeaking(prev => !prev);
  };

  const handleSendEvent = () => {
    try {
      const eventObj = JSON.parse(customEvent);
      sendCustomEvent(eventObj);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: `Sent custom event: ${eventObj.type}`,
        timestamp: new Date()
      }]);
    } catch (err) {
      alert('Invalid JSON: ' + (err as Error).message);
    }
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
    <div className="flex h-screen flex-col">
      {onMenuClick && <MobileBreadcrumb onMenuClick={onMenuClick} items={breadcrumbItems} />}

      {/* Header */}
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
            <h1 className="font-semibold">Real-time AI Assistant</h1>
            <p className="text-sm text-muted-foreground">WebRTC Voice Chat</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "🟢 Connected" : "🔴 Disconnected"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"}>
                      {message.role === 'user' ? '👤' : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <Card className={`max-w-[80%] p-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </Card>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Controls */}
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  onClick={handleConnect}
                  disabled={connected || isConnecting}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Power className="h-4 w-4" />
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  disabled={!connected}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Power className="h-4 w-4" />
                  Disconnect
                </Button>
                <Button
                  onClick={handleSpeakToggle}
                  disabled={!connected}
                  variant={speaking ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  {speaking ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {speaking ? 'Stop Speaking' : 'Start Speaking'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel for Custom Events */}
        <div className="w-80 border-l bg-muted/30 p-4 hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customEvent}
                onChange={(e) => setCustomEvent(e.target.value)}
                placeholder="Enter custom JSON event..."
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                onClick={handleSendEvent}
                disabled={!connected}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <audio ref={audioRef} hidden autoPlay />
    </div>
  );
}