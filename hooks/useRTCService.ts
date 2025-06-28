// /src/hooks/useRTCService.ts
import { useEffect, useRef, useCallback } from "react";
import { RTCService } from "@/lib/rtcService";

export function useRTCService() {
  const serviceRef = useRef<RTCService | null>(null);
  const callbacksRef = useRef<{
    userMessage: ((message: string) => void)[];
    assistantMessage: ((message: string) => void)[];
  }>({ userMessage: [], assistantMessage: [] });

  // Initialize service
  useEffect(() => {
    serviceRef.current = new RTCService();
    return () => {
      serviceRef.current?.disconnect();
      serviceRef.current = null;
      callbacksRef.current = { userMessage: [], assistantMessage: [] };
    };
  }, []);

  const connect = useCallback(async (audioElement: HTMLAudioElement) => {
    if (serviceRef.current) {
      return serviceRef.current.connect(audioElement);
    }
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  const toggleSpeaking = useCallback(() => {
    serviceRef.current?.toggleSpeaking();
  }, []);

  const onUserMessage = useCallback((cb: (message: string) => void) => {
    if (serviceRef.current) {
      callbacksRef.current.userMessage.push(cb);
      serviceRef.current.onUserMessage(cb);
    }
    // Return cleanup function
    return () => {
      callbacksRef.current.userMessage =
        callbacksRef.current.userMessage.filter((fn) => fn !== cb);
    };
  }, []);

  const onAssistantMessage = useCallback((cb: (message: string) => void) => {
    if (serviceRef.current) {
      callbacksRef.current.assistantMessage.push(cb);
      serviceRef.current.onAssistantMessage(cb);
    }
    // Return cleanup function
    return () => {
      callbacksRef.current.assistantMessage =
        callbacksRef.current.assistantMessage.filter((fn) => fn !== cb);
    };
  }, []);

  const sendCustomEvent = useCallback((eventData: object) => {
    serviceRef.current?.sendCustomEvent(eventData);
  }, []);

  const getConnectionState = useCallback(() => {
    return serviceRef.current?.getConnectionState() || "disconnected";
  }, []);

  const isConnected = useCallback(() => {
    return serviceRef.current?.isConnected() || false;
  }, []);

  const toggleTurnDetection = useCallback((enable: boolean) => {
    serviceRef.current?.toggleTurnDetection(enable);
  }, []);

  const isTurnDetectionEnabled = useCallback(() => {
    return serviceRef.current?.isTurnDetectionEnabled() || false;
  }, []);

  const forceRefreshTurnDetection = useCallback(() => {
    serviceRef.current?.forceRefreshTurnDetection();
  }, []);

  return {
    connect,
    disconnect,
    toggleSpeaking,
    onUserMessage,
    onAssistantMessage,
    sendCustomEvent,
    getConnectionState,
    isConnected,
    toggleTurnDetection,
    isTurnDetectionEnabled,
    forceRefreshTurnDetection,
  };
}
