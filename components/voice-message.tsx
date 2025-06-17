"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface VoiceMessage {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  isPlaying?: boolean;
  duration?: number;
  audioBlob?: Blob;
}

interface VoiceMessageProps {
  message: VoiceMessage;
  isMuted: boolean;
  onSpeak?: (text: string) => void;
}

export function VoiceMessage({ message, isMuted, onSpeak }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.sender === "user";

  const togglePlayback = () => {
    if (isMuted) return;

    if (message.audioBlob && isUser) {
      // Play recorded audio for user messages
      if (!isPlaying) {
        const audio = new Audio(URL.createObjectURL(message.audioBlob));
        setIsPlaying(true);
        audio.play();
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          console.error("Error playing audio");
        };
      }
    } else if (onSpeak && !isUser) {
      // Use text-to-speech for agent messages
      if (!isPlaying) {
        setIsPlaying(true);
        onSpeak(message.content);

        // Simulate playback duration
        if (message.duration) {
          setTimeout(() => {
            setIsPlaying(false);
          }, message.duration * 1000);
        }
      } else {
        setIsPlaying(false);
        // Stop speech synthesis
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          speechSynthesis.cancel();
        }
      }
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
        {/* Voice Message Card */}
        <Card className={cn("max-w-[80%] p-3", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                isUser ? "hover:bg-primary-foreground/20" : "hover:bg-muted-foreground/20",
                isMuted && "opacity-50 cursor-not-allowed"
              )}
              onClick={togglePlayback}
              disabled={isMuted}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="h-3 w-3 opacity-70" />
                <span className="text-xs opacity-70">{formatDuration(message.duration)}</span>
                {isMuted && <span className="text-xs opacity-70">(Muted)</span>}
              </div>

              {/* Waveform visualization */}
              <div className="flex items-center gap-0.5 h-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-0.5 rounded-full transition-all duration-100",
                      isUser ? "bg-primary-foreground/60" : "bg-muted-foreground/60",
                      isPlaying && i < ((Date.now() / 100) % 20) && "opacity-100 scale-y-150",
                      !isPlaying && "opacity-40"
                    )}
                    style={{
                      height: `${Math.random() * 12 + 4}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Transcription */}
        <Card className={cn("max-w-[80%] p-2 text-xs", isUser ? "bg-muted/50" : "bg-primary/5")}>
          <p className="text-muted-foreground whitespace-pre-wrap">{message.content}</p>
        </Card>

        <span className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}