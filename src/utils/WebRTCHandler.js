class WebRTCHandler {
  constructor() {
    this.audioContext = null;
    this.audioStream = null;
    this.audioProcessor = null;
    this.websocket = null;
    this.isProcessing = false;
    this.onError = null;
    this.onStateChange = null;
  }

  async initialize() {
    try {
      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      
      // Create audio processor
      const bufferSize = 2048;
      this.audioProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      // Process audio data
      this.audioProcessor.onaudioprocess = (e) => {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert float32 to int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
        }
        
        // Convert to Base64
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
        
        // Send audio chunk
        this.websocket.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio
        }));
      };
      
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
      
      return true;
    } catch (error) {
      console.error('Audio setup error:', error);
      if (this.onError) {
        this.onError('Error setting up audio recording: ' + error.message);
      }
      return false;
    }
  }

  async playAudioResponse(audioData) {
    try {
      if (!this.audioContext) return;

      // Convert base64 to ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create audio buffer
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      
      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      if (this.onError) {
        this.onError('Error playing audio response: ' + error.message);
      }
    }
  }

  async connectWebSocket(config) {
    try {
      this.websocket = new WebSocket('ws://localhost:8000/proxy');
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        // Send configuration
        this.websocket.send(JSON.stringify({
          endpoint: config.endpoint,
          deployment: config.deployment,
          apiKey: config.apiKey,
          model: config.model || "gpt-35-turbo-16k",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            }
          ],
          temperature: 0.7,
          stream: true
        }));

        if (this.onStateChange) {
          this.onStateChange('connected');
        }
      };

      this.websocket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received:', data);

          if (data.type === "response.audio") {
            await this.playAudioResponse(data.audio);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          if (this.onError) {
            this.onError('Error processing message: ' + error.message);
          }
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError('WebSocket connection error');
        }
        this.cleanup();
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        if (this.onStateChange) {
          this.onStateChange('disconnected');
        }
        this.cleanup();
      };

      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      if (this.onError) {
        this.onError('Failed to connect to WebSocket: ' + error.message);
      }
      return false;
    }
  }

  cleanup() {
    // Stop audio recording
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  setErrorCallback(callback) {
    this.onError = callback;
  }

  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }
}

export default WebRTCHandler; 