// /services/rtcService.js

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
    const tokenResponse = await fetch('/api/session');
    if (!tokenResponse.ok) throw new Error('Failed to get session token');
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Get the resource name from the token response or environment
    const resourceName = data.resource_name || process.env.NEXT_PUBLIC_AZURE_OPENAI_RESOURCE_NAME;
    
    // Validate resource name before attempting connection
    if (!resourceName || resourceName === 'YOUR_RESOURCE_NAME') {
      throw new Error('Azure OpenAI resource name is not properly configured. Please check your environment variables.');
    }

    pc = new RTCPeerConnection();
    audioEl = audioElement; // ✅ Set from passed-in reference

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));

    dc = pc.createDataChannel('oai-events');
    dc.onmessage = (e) => {
      const message = JSON.parse(e.data);
      handleMessage(message);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(
      `https://${resourceName}.realtimeapi-preview.ai.azure.com/v1/realtimertc?model=gpt-4o-mini-realtime-preview`,
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      }
    );

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      throw new Error(`Failed to connect to Azure OpenAI: ${sdpResponse.status} ${sdpResponse.statusText} - ${errorText}`);
    }
    
    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
  } catch (error) {
    console.error('Connection failed:', error);
    disconnect();
    throw error;
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

function handleMessage(message) {
  console.log('Received:', message);

  if (message.type === 'conversation.item.input_audio_transcription.completed') {
    userMessageCallback(message.transcript);
  }
  else if (message.type === 'response.audio_transcript.done') {
    assistantMessageCallback(message.transcript);
  }
}

export function sendCustomEvent(eventData) {
  try {
    sendMessage(eventData);
  } catch (error) {
    console.error('Failed to send custom event:', error.message);
  }
}