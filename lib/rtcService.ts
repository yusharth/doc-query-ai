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
        `${process.env.NEXT_PUBLIC_API_URL}/session` ||
          `https://doc-query-backend.onrender.com/session`
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
        `${process.env.NEXT_PUBLIC_SDP_URL}` ||
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

      // Wait for connection to be established
      await this.waitForConnection();

      // Wait a bit more for the data channel to be ready
      await this.waitForDataChannel();

      // Initialize turn detection by default
      this.turnDetectionEnabled = true;
      console.log("Configuring turn detection...");
      this.sendMessage({
        type: "session.update",
        session: {
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      });
    } catch (error) {
      console.error("Connection failed:", error);
      this.disconnect();
      throw error;
    }
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc?.connectionState === "connected") {
        resolve();
        return;
      }

      const checkConnection = () => {
        if (this.pc?.connectionState === "connected") {
          resolve();
        } else if (
          this.pc?.connectionState === "failed" ||
          this.pc?.connectionState === "closed"
        ) {
          throw new Error("Connection failed");
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  private async waitForDataChannel(): Promise<void> {
    return new Promise((resolve) => {
      if (this.dc?.readyState === "open") {
        resolve();
        return;
      }

      const checkDataChannel = () => {
        if (this.dc?.readyState === "open") {
          resolve();
        } else if (this.dc?.readyState === "closed") {
          throw new Error("Data channel closed");
        } else {
          setTimeout(checkDataChannel, 100);
        }
      };

      checkDataChannel();
    });
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
    console.log("Received message:", message);

    if (
      message.type ===
        "conversation.item.input_audio_transcription.completed" ||
      message.type === "conversation.item.input_audio_transcription.partial"
    ) {
      console.log(
        "Processing transcription:",
        message.type,
        message.transcript
      );
      // Show both partial and completed transcriptions for debugging
      this.userMessageCallback(message.transcript);
    } else if (
      message.type === "response.audio_transcript.done" ||
      message.type === "response.audio_transcript.partial"
    ) {
      console.log(
        "Processing assistant response:",
        message.type,
        message.transcript
      );
      // Show both partial and completed assistant responses
      this.assistantMessageCallback(message.transcript);
    } else if (message.type === "session.update") {
      console.log("Session updated:", message);
    } else if (message.type === "error") {
      console.error("RTC Error:", message);
    } else {
      console.log("Unhandled message type:", message.type, message);
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
    console.log(`Toggling turn detection to: ${enable}`);

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
    console.log(`Turn detection ${enable ? "enabled" : "disabled"}`);
  }

  forceRefreshTurnDetection() {
    if (this.pc?.connectionState !== "connected") {
      console.warn("Cannot refresh turn detection - not connected");
      return;
    }

    console.log("Force refreshing turn detection...");

    // First disable
    this.sendMessage({
      type: "session.update",
      session: {
        turn_detection: null,
      },
    });

    // Then re-enable after a short delay
    setTimeout(() => {
      this.sendMessage({
        type: "session.update",
        session: {
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      });
      console.log("Turn detection refreshed");
    }, 500);
  }

  isTurnDetectionEnabled(): boolean {
    return this.turnDetectionEnabled;
  }
}
