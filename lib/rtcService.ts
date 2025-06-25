// /src/services/rtcService.ts
export class RTCService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private turnDetectionEnabled = false;

  private userMessageCallback: (message: string) => void = () => {};
  private assistantMessageCallback: (message: string) => void = () => {};

  onUserMessage(cb: (message: string) => void): () => void {
    this.userMessageCallback = cb;
    return () => {
      if (this.userMessageCallback === cb) {
        this.userMessageCallback = () => {};
      }
    };
  }

  onAssistantMessage(cb: (message: string) => void): () => void {
    this.assistantMessageCallback = cb;
    return () => {
      if (this.assistantMessageCallback === cb) {
        this.assistantMessageCallback = () => {};
      }
    };
  }

  async connect(audioElement: HTMLAudioElement) {
    try {
      const tokenResponse = await fetch(
        // "https://doc-query-backend.onrender.com/session",
        "http://localhost:8000/session"
      );
      if (!tokenResponse.ok) throw new Error("Failed to get session token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      this.pc = new RTCPeerConnection();
      this.audioEl = audioElement;

      this.pc.ontrack = (e) => {
        if (this.audioEl) {
          this.audioEl.srcObject = e.streams[0];
        }
      };

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia is not supported in this environment.");
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.mediaStream
        .getTracks()
        .forEach((track) => this.pc?.addTrack(track, this.mediaStream!));

      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.onmessage = (e) => {
        const message = JSON.parse(e.data);
        this.handleMessage(message);
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://swedencentral.realtimeapi-preview.ai.azure.com/v1/realtimertc?model=gpt-4o-mini-realtime-preview`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      console.log("SDP Response:", sdpResponse);

      if (!sdpResponse.ok) throw new Error("Failed to connect to OpenAI");
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await this.pc.setRemoteDescription(answer as RTCSessionDescriptionInit);
    } catch (error) {
      console.error("Connection failed:", error);
      this.disconnect();
      throw error;
    }
  }

  disconnect() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isSpeaking = false;
  }

  toggleSpeaking() {
    this.isSpeaking = !this.isSpeaking;

    if (this.isSpeaking) {
      this.sendMessage({ type: "input_audio_buffer.clear" });
    } else {
      this.sendMessage({ type: "input_audio_buffer.commit" });
      this.sendMessage({ type: "response.create" });
    }
  }

  private sendMessage(message: object) {
    if (this.dc && this.dc.readyState === "open") {
      console.log("Sending message:", message);
      this.dc.send(JSON.stringify(message));
    } else {
      console.warn("Data channel not ready to send message", {
        readyState: this.dc?.readyState,
      });
    }
  }

  private handleMessage(message: any) {
    console.log("Received:", message);

    if (
      message.type ===
        "conversation.item.input_audio_transcription.completed" ||
      message.type === "conversation.item.input_audio_transcription.partial"
    ) {
      this.userMessageCallback(message.transcript);
    } else if (
      message.type === "response.audio_transcript.done" ||
      message.type === "response.audio_transcript.partial"
    ) {
      this.assistantMessageCallback(message.transcript);
    }
  }

  sendCustomEvent(eventData: object) {
    try {
      this.sendMessage(eventData);
    } catch (error) {
      console.error("Failed to send custom event:", error);
    }
  }

  // Additional helper methods if needed
  getConnectionState(): string {
    return this.pc?.connectionState || "disconnected";
  }

  isConnected(): boolean {
    return this.pc?.connectionState === "connected";
  }

  toggleTurnDetection(enable: boolean) {
    if (this.pc?.connectionState !== "connected") {
      console.warn("Cannot toggle turn detection - not connected");
      return;
    }

    this.turnDetectionEnabled = enable;
    const sessionUpdate = {
      type: "session.update",
      session: {
        turn_detection: enable
          ? {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            }
          : null,
      },
    };
    this.sendMessage(sessionUpdate);
  }
}
