"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

export function AudioVisualizer({
  isActive,
  isListening,
  isSpeaking,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  // Initialize audio context and analyser
  useEffect(() => {
    if (isActive && !audioContext) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const context = new AudioContext();
          const source = context.createMediaStreamSource(stream);
          const analyserNode = context.createAnalyser();

          analyserNode.fftSize = 256;
          const bufferLength = analyserNode.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source.connect(analyserNode);

          setAudioContext(context);
          setAnalyser(analyserNode);
          setDataArray(dataArray);
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      };

      initAudio();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isActive, audioContext]);

  // Animation loop
  useEffect(() => {
    if (!isActive || !analyser || !dataArray) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!isActive) return;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate average volume
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      if (isSpeaking) {
        // AI speaking animation - pulsing circles
        drawSpeakingAnimation(ctx, canvas, average);
      } else if (isListening) {
        // User speaking - frequency bars
        drawListeningAnimation(ctx, canvas, dataArray);
      } else {
        // Idle state - gentle pulse
        drawIdleAnimation(ctx, canvas);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser, dataArray, isListening, isSpeaking]);

  const drawSpeakingAnimation = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    volume: number
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.005;

    // Multiple pulsing circles
    for (let i = 0; i < 3; i++) {
      const radius = 20 + i * 15 + Math.sin(time + i) * 10;
      const opacity = 0.3 - i * 0.1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
      ctx.fill();
    }
  };

  const drawListeningAnimation = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dataArray: Uint8Array
  ) => {
    const barWidth = (canvas.width / dataArray.length) * 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      const x = i * barWidth;

      const gradient = ctx.createLinearGradient(
        0,
        centerY - barHeight / 2,
        0,
        centerY + barHeight / 2
      );
      gradient.addColorStop(0, "#10b981");
      gradient.addColorStop(1, "#059669");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 2, barHeight);
    }
  };

  const drawIdleAnimation = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.002;
    const radius = 30 + Math.sin(time) * 5;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(156, 163, 175, 0.3)";
    ctx.fill();
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <canvas ref={canvasRef} width={200} height={100} className="rounded-lg" />
    </div>
  );
}
