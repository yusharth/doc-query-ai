// /src/services/rtcService.js

let pc = null;
let dc = null;
let mediaStream = null;
let audioEl = null;
let isSpeaking = false;

let userMessageCallback = () => {};
let assistantMessageCallback = () => {};

export function onUserMessage(cb) {
  userMessageCallback = cb;
}

export function onAssistantMessage(cb) {
  assistantMessageCallback = cb;
}

export async function connect(audioElement) {
  try {
    const tokenResponse = await fetch('http://localhost:8080/session');
    if (!tokenResponse.ok) throw new Error('Failed to get session token');
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    pc = new RTCPeerConnection();
    audioEl = audioElement;

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream));

    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      console.log('Data channel opened');
      configureDataChannel();
    };
    dc.onmessage = (e) => handleMessage(JSON.parse(e.data));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(
      `https://swedencentral.realtimeapi-preview.ai.azure.com/v1/realtimertc?model=gpt-4o-mini-realtime-preview`,
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      }
    );

    if (!sdpResponse.ok) throw new Error('Failed to connect to OpenAI');
    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
  } catch (error) {
    console.error('Connection failed:', error);
    disconnect();
  }
}


export function disconnect() {
  if (dc) dc.close();
  if (pc) pc.close();
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  pc = null;
  dc = null;
  mediaStream = null;
  isSpeaking = false;
}

export function toggleSpeaking() {
  isSpeaking = !isSpeaking;

  if (isSpeaking) {
    sendMessage({ type: 'input_audio_buffer.clear' });
  } else {
    sendMessage({ type: 'input_audio_buffer.commit' });
    sendMessage({ type: 'response.create' });
  }
}

function sendMessage(message) {
  if (dc && dc.readyState === 'open') {
    dc.send(JSON.stringify(message));
    console.log('Sent event:', message);
  }
}


async function handleMessage(message) {
  console.log('Received:', message);

  if (message.type === 'conversation.item.input_audio_transcription.completed') {
    userMessageCallback(message.transcript);
  } else if (message.type === 'response.audio_transcript.done') {
    assistantMessageCallback(message.transcript);
  } else if (message.type === 'response.function_call_arguments.done') {
    const { name, arguments: argsJson, call_id } = message;
    try {
      const args = JSON.parse(argsJson);
      const prompt = args.prompt;
      const response = await fetch('/agentfunctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt }),
      });

      if (!response.ok) throw new Error('Agent function POST failed');
      const result = await response.json();

      sendMessage({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify(result),
        },
      });

      sendMessage({ type: 'response.create' });
    } catch (err) {
      console.error(`Function ${name} call failed:`, err);
    }
  }
}

export function sendCustomEvent(eventData) {
  try {
    sendMessage(eventData);
  } catch (error) {
    console.error('Failed to send custom event:', error.message);
  }
}


export async function configureDataChannel() {
  try {
    const res = await fetch('/agentfunctions');
    if (!res.ok) throw new Error('Failed to fetch agent functions');
    const tools = (await res.json()).map((fn) => ({
      type: 'function',
      name: fn.name,
      description: fn.description,
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: fn.argumentDescription || 'Query string for the agent',
          },
        },
        required: ['prompt'],
      },
    }));

    const event = {
      type: 'session.update',
      session: {
        modalities: ['audio', 'text'],
        tools,
      },
    };
    sendMessage(event);
  } catch (error) {
    console.error('Failed to configure session tools:', error);
  }
}

export function toggleTurnDetection(enable) {
  turnDetectionEnabled = enable;
  const sessionUpdate = {
    type: 'session.update',
    session: {
      turn_detection: enable
        ? {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          }
        : null,
    },
  };
  sendMessage(sessionUpdate);
}
