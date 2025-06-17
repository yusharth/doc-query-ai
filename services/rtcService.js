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
    console.log('Attempting to connect to session API...');
    
    const tokenResponse = await fetch('/api/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Session API response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Session API error response:', errorText);
      throw new Error(`Failed to get session token: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
    }
    
    const data = await tokenResponse.json();
    console.log('Session data received:', { 
      hasClientSecret: !!data.client_secret, 
      resourceName: data.resource_name,
      deploymentName: data.deployment_name,
      hasWebrtcUrl: !!data.webrtc_url
    });
    
    const EPHEMERAL_KEY = data.client_secret.value;

    // Get the resource name and deployment from the token response
    const resourceName = data.resource_name;
    const deploymentName = data.deployment_name;
    
    // Validate resource name and deployment before attempting connection
    if (!resourceName || resourceName === 'YOUR_RESOURCE_NAME') {
      throw new Error('Azure OpenAI resource name is not properly configured. Please check your environment variables.');
    }

    if (!deploymentName) {
      throw new Error('Azure OpenAI deployment name is not properly configured. Please check your AZURE_OPENAI_DEPLOYMENT environment variable.');
    }

    console.log('Initializing WebRTC connection...');
    pc = new RTCPeerConnection();
    audioEl = audioElement;

    pc.ontrack = (e) => {
      console.log('Audio track received');
      audioEl.srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', pc.connectionState);
    };

    console.log('Getting user media...');
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));

    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      console.log('Data channel opened');
    };
    dc.onmessage = (e) => {
      const message = JSON.parse(e.data);
      handleMessage(message);
    };

    console.log('Creating WebRTC offer...');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Use the WebRTC URL from the session API response
    const realtimeUrl = data.webrtc_url;
    
    if (!realtimeUrl) {
      throw new Error('WebRTC URL not provided by session API');
    }

    console.log('Connecting to Azure OpenAI Realtime API:', realtimeUrl);

    const sdpResponse = await fetch(realtimeUrl, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        'Content-Type': 'application/sdp',
      },
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`Failed to connect to Azure OpenAI: ${sdpResponse.status} ${sdpResponse.statusText} - ${errorText}`);
    }
    
    console.log('Setting remote description...');
    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
    
    console.log('WebRTC connection established successfully');
  } catch (error) {
    console.error('Connection failed:', error);
    disconnect();
    throw error;
  }
}

export function disconnect() {
  console.log('Disconnecting...');
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