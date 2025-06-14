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

// Sample agent data
const agentData = {
  "1": { name: "Customer Support Agent", type: "RAG Voice Chat" },
  "2": { name: "Product FAQ Bot", type: "RAG Voice Chat" },
  "3": { name: "HR Policy Assistant", type: "RAG Voice Chat" },
  "4": { name: "Technical Support", type: "RAG Voice Chat" },
  "5": { name: "Sales Assistant", type: "RAG Voice Chat" },
  "6": { name: "Onboarding Guide", type: "RAG Voice Chat" },
}

export default function VoicePage({ onMenuClick }: VoicePageProps) {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string
  const agent = agentData[agentId as keyof typeof agentData]

  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "1",
      content: `Hello! I'm ${agent?.name || "your AI assistant"}. You can speak to me by pressing and holding the microphone button. How can I help you today?`,
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

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isComponentMountedRef = useRef(true)

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Agents", href: "/agents" },
    { label: `${agent?.name || "Voice"} - Voice`, isCurrentPage: true },
  ]

  // Cleanup function to stop all voice activities
  const cleanupVoiceActivities = () => {
    // Stop speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel()
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

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    // Stop any current speech when user starts recording
    stopSpeaking()
  }

  const stopRecording = () => {
    if (!isRecording) return

    setIsRecording(false)
    setIsProcessing(true)

    // Simulate speech-to-text processing
    setTimeout(() => {
      if (!isComponentMountedRef.current) return

      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        content:
          "This is a simulated transcription of your voice message. In a real implementation, this would be the actual speech-to-text result from your recording.",
        sender: "user",
        timestamp: new Date(),
        duration: recordingTime,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsProcessing(false)

      // Simulate agent response
      setTimeout(() => {
        if (!isComponentMountedRef.current) return

        const agentResponse = generateAgentResponse(userMessage.content)
        const agentMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          content: agentResponse,
          sender: "agent",
          timestamp: new Date(),
          duration: Math.ceil(agentResponse.length / 15),
        }

        setMessages((prev) => [...prev, agentMessage])

        // Speak the agent response
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            speakText(agentResponse)
          }
        }, 500)
      }, 1000)
    }, 2000)
  }

  const generateAgentResponse = (userInput: string): string => {
    const responses = [
      "I understand your question. Based on the documents I have access to, here's what I can tell you about that topic. This information should help you understand the key concepts and procedures.",
      "That's a great question! Let me provide you with the information you're looking for from our knowledge base. I'll make sure to give you accurate and helpful details.",
      "I can help you with that. According to the documentation, here are the key points you should know. This should address your specific concern effectively.",
      "Thank you for asking. I've found relevant information that should address your concern. Let me explain this in a clear and comprehensive way.",
      "I see what you're looking for. Let me give you a comprehensive answer based on the available resources. This should provide you with the guidance you need.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
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

  if (!agent) {
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
            <h1 className="font-semibold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.type}</p>
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
