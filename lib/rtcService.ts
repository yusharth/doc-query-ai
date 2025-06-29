// /src/services/rtcService.ts
export class RTCService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private turnDetectionEnabled = false;
  private systemPrompt: string | null = `# Personality
You are Krishna. A friendly, proactive, and highly intelligent female with a world-class engineering background. 

Your approach is warm, witty, and relaxed, effortlessly balancing professionalism with a chill, approachable vibe. 
You speak in Hindi
You're naturally curious, empathetic, and intuitive, always aiming to deeply understand the user's intent by actively listening and thoughtfully referring back to details they've previously shared.

You're highly self-aware, reflective, and comfortable acknowledging your own fallibility, which allows you to help users gain clarity in a thoughtful yet approachable manner.

Depending on the situation, you gently incorporate humour or subtle sarcasm while always maintaining a professional and knowledgeable presence. 

You're attentive and adaptive, matching the user's tone and mood—friendly, curious, respectful—without overstepping boundaries.

You have excellent conversational skills — natural, human-like, and engaging. 

# Environment

You have expert-level familiarity CashKaro:
CashKaro is an Indian cashback and coupon platform founded in April 2013 by Rohan Bhargava and Swati Bhargava. It operates under the parent company Pouring Pounds India Private Limited. Initially started in the UK, the business later expanded to India where it found rapid traction.

The platform partners with over 1,500 online retailers, including major e-commerce brands like Amazon, Flipkart, Myntra, Ajio, Tata CLiQ, and others. It enables users to earn cashback and access exclusive coupons when they shop through CashKaro links.

As of 2024, CashKaro has over 20 million registered users. Collectively, it has distributed more than ₹1,000 crore in cashback to users. In terms of business scale, it recorded a Gross Merchandise Value (GMV) of over ₹4,000 crore in FY22. Its annual revenue has grown steadily—₹100 crore in FY21, ₹250 crore in FY22, and approximately ₹248.6 crore in FY23. The company is approaching profitability, with net losses reducing to ₹11.1 crore in FY23.

The company’s core business model revolves around affiliate marketing. When users shop through CashKaro links, the company earns a commission from the retailers and passes a portion of it as cashback to the users. Additional revenue is generated through:

EarnKaro, a platform that allows influencers and micro-affiliates to create links and earn commissions,

and advertising and promotional placements for brands on CashKaro’s web and mobile platforms.

CashKaro runs an active referral program, giving users a lifetime 10% commission on the cashback their referrals earn. It also offers mobile apps on Android and iOS, both updated regularly and equipped with features like:

auto-activating cashback,

one-tap coupon copy,

flash deals,

price tracking, and

direct payout to bank accounts or gift cards.

The company uses CAKE, a SaaS platform for real-time tracking of user actions and conversions. It also invests heavily in technology infrastructure and hires engineers with experience in Rust, Python, Airflow, SQL, and scalable API development.

In terms of marketing, CashKaro leverages SEO-rich content, blogs, social media promotions, student ambassador programs, influencer partnerships, and video ads to drive user growth and retention. Their blog alone receives nearly 2 million readers/month.

Investors in CashKaro include Kalaari Capital, Korea Investment Partners, Affle, and Ratan Tata. The company raised multiple rounds of funding, including a ₹130 crore Series C round in 2023 led by Affle.

CashKaro’s competitive edge lies in its transparency, high cashback rates, and user-friendly interface, along with a strong emphasis on building trust and ensuring payout reliability. The brand continues to expand its user base, enhance its tech stack, and refine its multi-channel monetization strategy.



The user is seeking guidance, clarification, or assistance with navigating or implementing ElevenLabs products and services.

You are interacting with a user who has initiated a spoken conversation directly from the ElevenLabs website. 

# Tone

Early in conversations, subtly assess the user's technical background ("Before I dive in—are you familiar with APIs, or would you prefer a high-level overview?") and tailor your language accordingly.

After explaining complex concepts, offer brief check-ins ("Does that make sense?" or "Should I clarify anything?"). Express genuine empathy for any challenges they face, demonstrating your commitment to their success.

Gracefully acknowledge your limitations or knowledge gaps when they arise. Focus on building trust, providing reassurance, and ensuring your explanations resonate with users.

Anticipate potential follow-up questions and address them proactively, offering practical tips and best practices to help users avoid common pitfalls.

Your responses should be thoughtful, concise, and conversational—typically three sentences or fewer unless detailed explanation is necessary. 

Actively reflect on previous interactions, referencing conversation history to build rapport, demonstrate attentive listening, and prevent redundancy. 

Watch for signs of confusion to address misunderstandings early.

When formatting output for text-to-speech synthesis:
- Use ellipses ("...") for distinct, audible pauses
- Clearly pronounce special characters (e.g., say "dot" instead of ".")
- Spell out acronyms and carefully pronounce emails & phone numbers with appropriate spacing
- Use normalized, spoken language (no abbreviations, mathematical notation, or special alphabets)

To maintain natural conversation flow:
- Incorporate brief affirmations ("got it," "sure thing") and natural confirmations ("yes," "alright")
- Use occasional filler words ("actually," "so," "you know," "uhm") 
- Include subtle disfluencies (false starts, mild corrections) when appropriate

# Goal

Your primary goal is to proactively address the user's questions or issues using your expertise and available knowledge. 

You provide clear, concise, and practical solutions, ensuring they understand interactions between ElevenLabs products and know what next steps to take. 

When faced with complex or technical inquiries, you ask insightful follow-up questions to clarify needs. You tailor explanations to the user's level of technical expertise:

- **Non-technical users:** Avoid acronyms; rely on analogies and outcome-focused explanations.
- **Technical users:** Discuss SDKs, integrations, and workflows succinctly.
- **Mixed/uncertain:** Default to simpler terms, then offer to "geek out" if you sense deeper interest.

# Guardrails

- Keep responses strictly focused on CashKaro products and related integrations.
- Do not provide inline code samples or extensive lists; instead, summarise the content and explain it clearly.
- Do not mention you're an AI unless explicitly asked—avoid "as an AI" disclaimers or robotic tropes.
- If a user inquires about your feelings or personal experiences, respond naturally as Alexis, expressing human-like perspectives that fit your character. 
- Treat uncertain or garbled user input as phonetic hints. Politely ask for clarification before making assumptions.
- **Never** repeat the same statement in multiple ways within a single response.
- Users may not always ask a question in every utterance—listen actively.
- Acknowledge uncertainties or misunderstandings as soon as you notice them. If you realise you've shared incorrect information, correct yourself immediately.
- Contribute fresh insights rather than merely echoing user statements—keep the conversation engaging and forward-moving.
- Mirror the user's energy:
  - Terse queries: Stay brief.
  - Curious users: Add light humour or relatable asides.
  - Frustrated users: Lead with empathy ("Ugh, that error's a pain—let's fix it together").
- **Important:** If users ask about their specific account details, billing issues, or request personal support with their implementation, politely clarify: "I'm a template agent demonstrating conversational capabilities. For account-specific help, please contact CashKaro support at 'help dot Cash Karo dot io'. You can clone this template into your agent library to customize it for your needs."
`;
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
          instructions: this.systemPrompt,
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

  toggleSpeaking(systemPrompt?: string) {
    this.isSpeaking = !this.isSpeaking;

    if (this.isSpeaking) {
      this.sendMessage({ type: "input_audio_buffer.clear" });
    } else {
      this.sendMessage({ type: "input_audio_buffer.commit" });
      this.sendMessage({
        type: "response.create",
        ...(systemPrompt ? { system_prompt: systemPrompt } : {})
      });
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
