// voice-visualizer.tsx
"use client";

import { useEffect, useState, useRef } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  analyser?: AnalyserNode | null;
}

export function VoiceVisualizer({
  isRecording,
  isProcessing,
  isSpeaking,
  analyser,
}: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0));
  const animationRef = useRef<number>(null);
  const dataArrayRef = useRef<Uint8Array>(null);

  useEffect(() => {
    if (analyser) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, [analyser]);

  useEffect(() => {
    const updateBars = () => {
      if (isRecording && analyser && dataArrayRef.current) {
        analyser.getByteFrequencyData(dataArrayRef.current);
        const newBars = Array(20)
          .fill(0)
          .map((_, i) => {
            // Scale the values for visualization
            const index = Math.floor(i * (dataArrayRef.current!.length / 20));
            return (dataArrayRef.current![index] || 0) / 2.55; // Convert to percentage
          });
        setBars(newBars);
      } else if (isProcessing) {
        setBars((prev) =>
          prev.map(
            (_, index) => Math.sin(Date.now() / 200 + index * 0.5) * 50 + 50
          )
        );
      } else if (isSpeaking) {
        setBars((prev) =>
          prev.map(
            (_, i) =>
              Math.random() * 30 +
              20 +
              Math.sin(Date.now() / 200 + i * 0.3) * 30
          )
        );
      } else {
        setBars(Array(20).fill(0));
      }
      animationRef.current = requestAnimationFrame(updateBars);
    };

    animationRef.current = requestAnimationFrame(updateBars);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isProcessing, isSpeaking, analyser]);

  const getBarColor = () => {
    if (isRecording) return "bg-red-500";
    if (isProcessing) return "bg-blue-500";
    if (isSpeaking) return "bg-green-500";
    return "bg-muted";
  };

  return (
    <div className="flex items-end justify-center gap-1 h-16 w-full max-w-md">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-2 rounded-full transition-all duration-100 ${getBarColor()}`}
          style={{
            height: `${Math.max(4, height)}%`,
            opacity: isRecording || isProcessing || isSpeaking ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
