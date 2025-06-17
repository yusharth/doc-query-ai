"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MobileBreadcrumb } from "@/components/mobile-breadcrumb"
import { VoiceVisualizer } from "@/components/voice-visualizer"
import { VoiceMessage as VoiceMessageComponent } from "@/components/voice-message"
import { Bot, Mic, MicOff, ArrowLeft, Volume2, VolumeX, Settings } from "lucide-react"
import { VoiceSettings as VoiceSettingsComponent } from "@/components/voice-settings"
import Link from "next/link"

interface VoiceMessage {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
  isPlaying?: boolean
  duration?: number
  audioBlob?: Blob
}

interface VoicePageProps {
  onMenuClick?: () => void
}

interface VoiceSettings {
  rate: number
  pitch: number
  volume: number
  voice: string
}

export default function VoicePage({ onMenuClick }: VoicePageProps) {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI voice assistant. You can speak to me by pressing and holding the microphone button. How can I help you today?",
      sender: "agent",
      timestamp: new Date(),
      duration: 5,
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 1,
    pitch: 1,
    volume: 0.8,
    voice: "",
  })
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isComponentMountedRef = useRef(true)

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Agents", href: "/agents" },
    { label: "Voice Chat", isCurrentPage: true },
  ]

  // Cleanup function to stop all voice activities
  const cleanupVoiceActivities = () => {
    // Stop speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel()
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    // Clear recording interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }

    // Reset states
    setIsSpeaking(false)
    setIsRecording(false)
    setIsProcessing(false)
    currentUtteranceRef.current = null
  }

  // Cleanup on component unmount or route change
  useEffect(() => {
    isComponentMountedRef.current = true

    return () => {
      isComponentMountedRef.current = false
      cleanupVoiceActivities()
    }
  }, [])

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      cleanupVoiceActivities()
    }

    // Listen for route changes
    window.addEventListener("beforeunload", handleRouteChange)

    return () => {
      window.removeEventListener("beforeunload", handleRouteChange)
      cleanupVoiceActivities()
    }
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices()
        setAvailableVoices(voices)

        // Set default voice (prefer English voices)
        const defaultVoice =
          voices.find((voice) => voice.lang.startsWith("en") && voice.name.includes("Google")) ||
          voices.find((voice) => voice.lang.startsWith("en")) ||
          voices[0]

        if (defaultVoice && !voiceSettings.voice) {
          setVoiceSettings((prev) => ({ ...prev, voice: defaultVoice.name }))
        }
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [voiceSettings.voice])

  // Speak the initial message
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === "agent" && isComponentMountedRef.current) {
      setTimeout(() => {
        if (isComponentMountedRef.current) {
          speakText(messages[0].content)
        }
      }, 1000)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      setRecordingTime(0)
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const speakText = (text: string) => {
    if (isMuted || !("speechSynthesis" in window) || !isComponentMountedRef.current) return

    // Stop any current speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const selectedVoice = availableVoices.find((voice) => voice.name === voiceSettings.voice)

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = voiceSettings.rate
    utterance.pitch = voiceSettings.pitch
    utterance.volume = voiceSettings.volume

    utterance.onstart = () => {
      if (isComponentMountedRef.current) {
        setIsSpeaking(true)
        currentUtteranceRef.current = utterance
      }
    }

    utterance.onend = () => {
      if (isComponentMountedRef.current) {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }
    }

    utterance.onerror = () => {
      if (isComponentMountedRef.current) {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }
    }

    speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    currentUtteranceRef.current = null
  }

  const startRecording = async () => {
    try {
      // Stop any current speech when user starts recording
      stopSpeaking()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await processAudioMessage(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudioMessage = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      // Convert audio to text using speech-to-text API
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")

      const transcriptionResponse = await fetch(`${API_URL}/speech-to-text/`, {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        throw new Error("Speech-to-text failed")
      }

      const transcriptionData = await transcriptionResponse.json()
      const transcribedText = transcriptionData.text

      if (!transcribedText || transcribedText.trim() === "") {
        throw new Error("No speech detected")
      }

      // Add user message
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        content: transcribedText,
        sender: "user",
        timestamp: new Date(),
        duration: recordingTime,
        audioBlob: audioBlob,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsProcessing(false)

      // Get AI response
      const chatResponse = await fetch(`${API_URL}/voice-chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: agentId,
          user_message: transcribedText,
          voice_settings: voiceSettings,
        }),
      })

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI response")
      }

      const reader = chatResponse.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      const agentMessageId = (Date.now() + 1).toString()
      let fullResponse = ""

      // Create initial streaming message
      setMessages((prev) => [
        ...prev,
        {
          id: agentMessageId,
          content: "",
          sender: "agent",
          timestamp: new Date(),
          duration: 0,
        },
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              break
            }

            fullResponse += data
            // Update the streaming message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMessageId
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            )
          }
        }
      }

      // Speak the agent response
      if (fullResponse && !isMuted) {
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            speakText(fullResponse)
          }
        }, 500)
      }

    } catch (error) {
      console.error("Error processing audio:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, I couldn't process your voice message. Please try again.",
          sender: "agent",
          timestamp: new Date(),
          duration: 3,
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      stopSpeaking()
    }
  }

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
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {onMenuClick && <MobileBreadcrumb onMenuClick={onMenuClick} items={breadcrumbItems} />}

      {/* Voice Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="md:hidden" asChild>
            <Link href="/agents" onClick={cleanupVoiceActivities}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">Voice Assistant</h1>
            <p className="text-sm text-muted-foreground">RAG Voice Chat</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Voice Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleMuteToggle} className="h-8 w-8 p-0">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-blue-500 animate-pulse" : "bg-green-500"}`}
              ></div>
              <span className="text-xs text-muted-foreground">{isSpeaking ? "Speaking" : "Ready"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      {showSettings && (
        <VoiceSettingsComponent
          settings={voiceSettings}
          availableVoices={availableVoices}
          onSettingsChange={setVoiceSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <VoiceMessageComponent key={message.id} message={message} isMuted={isMuted} onSpeak={speakText} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Controls */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6">
            <CardContent className="flex flex-col items-center space-y-4 p-0">
              {/* Voice Visualizer */}
              <VoiceVisualizer isRecording={isRecording} isProcessing={isProcessing} isSpeaking={isSpeaking} />

              {/* Status Text */}
              <div className="text-center">
                {isRecording && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-500">Recording... {formatTime(recordingTime)}</p>
                    <p className="text-xs text-muted-foreground">Release to send</p>
                  </div>
                )}
                {isProcessing && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-500">Processing your message...</p>
                    <p className="text-xs text-muted-foreground">Converting speech to text</p>
                  </div>
                )}
                {isSpeaking && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-500">AI is speaking...</p>
                    <p className="text-xs text-muted-foreground">
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={stopSpeaking}>
                        Click to stop
                      </Button>
                    </p>
                  </div>
                )}
                {!isRecording && !isProcessing && !isSpeaking && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ready to listen</p>
                    <p className="text-xs text-muted-foreground">Press and hold to record your message</p>
                  </div>
                )}
              </div>

              {/* Record Button */}
              <Button
                size="lg"
                className={`h-16 w-16 rounded-full p-0 transition-all ${
                  isRecording ? "bg-red-500 hover:bg-red-600 scale-110" : "bg-primary hover:bg-primary/90"
                }`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isProcessing}
              >
                {isRecording ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
                <span className="sr-only">{isRecording ? "Recording" : "Start recording"}</span>
              </Button>

              <p className="text-center text-xs text-muted-foreground max-w-sm">
                Hold the microphone button to record your voice message. The AI will respond with voice after processing
                your request. {isMuted && <span className="text-orange-500 font-medium">Voice is muted.</span>}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}