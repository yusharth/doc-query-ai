"use client"

import { useEffect, useState } from "react"

interface VoiceVisualizerProps {
  isRecording: boolean
  isProcessing: boolean
  isSpeaking: boolean
}

export function VoiceVisualizer({ isRecording, isProcessing, isSpeaking }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0))

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording || isSpeaking) {
      interval = setInterval(() => {
        setBars((prev) => prev.map(() => Math.random() * 100))
      }, 100)
    } else if (isProcessing) {
      interval = setInterval(() => {
        setBars((prev) => prev.map((_, index) => Math.sin(Date.now() / 200 + index * 0.5) * 50 + 50))
      }, 50)
    } else {
      setBars(Array(20).fill(0))
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isProcessing, isSpeaking])

  const getBarColor = () => {
    if (isRecording) return "bg-red-500"
    if (isProcessing) return "bg-blue-500"
    if (isSpeaking) return "bg-green-500"
    return "bg-muted"
  }

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
  )
}