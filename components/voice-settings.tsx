"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Play } from "lucide-react"

interface VoiceSettings {
  rate: number
  pitch: number
  volume: number
  voice: string
}

interface VoiceSettingsProps {
  settings: VoiceSettings
  availableVoices: SpeechSynthesisVoice[]
  onSettingsChange: (settings: VoiceSettings) => void
  onClose: () => void
}

export function VoiceSettings({ settings, availableVoices, onSettingsChange, onClose }: VoiceSettingsProps) {
  const testVoice = () => {
    if (!("speechSynthesis" in window)) return

    const utterance = new SpeechSynthesisUtterance("Hello! This is how I sound with the current settings.")
    const selectedVoice = availableVoices.find((voice) => voice.name === settings.voice)

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    speechSynthesis.speak(utterance)
  }

  return (
    <div className="border-b bg-muted/30 p-4">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Voice Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Close settings</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={settings.voice} onValueChange={(value) => onSettingsChange({ ...settings, voice: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={testVoice} variant="outline" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Test Voice
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speech Rate</Label>
                <span className="text-sm text-muted-foreground">{settings.rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={([value]) => onSettingsChange({ ...settings, rate: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">{settings.pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.pitch]}
                onValueChange={([value]) => onSettingsChange({ ...settings, pitch: value })}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([value]) => onSettingsChange({ ...settings, volume: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
