import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import API_URL from '../config/api';

const AudioStream = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');
    
    const websocket = useRef(null);
    const audioContext = useRef(null);
    const audioStream = useRef(null);
    const audioProcessor = useRef(null);
    const isRecording = useRef(false);
    
    const sampleRate = 24000;
    const channelCount = 1;

    const setupAudioRecording = async () => {
        try {
            audioStream.current = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: channelCount,
                    sampleRate: sampleRate
                } 
            });
            
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: sampleRate });
            const source = audioContext.current.createMediaStreamSource(audioStream.current);
            
            const bufferSize = 2048;  // 100ms at 24kHz mono
            audioProcessor.current = audioContext.current.createScriptProcessor(bufferSize, channelCount, channelCount);
            
            audioProcessor.current.onaudioprocess = (e) => {
                if (!isRecording.current || !websocket.current || websocket.current.readyState !== WebSocket.OPEN) return;
                
                // Get audio data from input channel
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convert float32 to int16
                const int16Data = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
                }
                
                // Convert to Base64
                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
                
                // Send audio chunk to WebSocket
                if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
                    websocket.current.send(JSON.stringify({
                        "type": "input_audio_buffer.append",
                        "audio": base64Audio
                    }));
                }
            };
            
            source.connect(audioProcessor.current);
            audioProcessor.current.connect(audioContext.current.destination);
            
            return true;
        } catch (error) {
            console.error('Audio setup error:', error);
            setError('Error setting up audio recording: ' + error.message);
            return false;
        }
    };

    const handleMessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);

            switch (message.type) {
                case "response.done":
                    if (message.response?.output?.[0]?.content?.[0]?.transcript) {
                        let newTranscript = message.response.output[0].content[0].transcript;
                        setTranscript(prev => prev + newTranscript + " ");
                    }
                    break;
                case "error":
                    setError(message.message);
                    stopStreaming();
                    break;
                default:
                    console.log('Unhandled message type:', message.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            setError('Error processing message: ' + error.message);
        }
    };

    const startStreaming = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            // Get configuration from backend
            const configResponse = await fetch(`${API_URL}/config`);
            if (!configResponse.ok) {
                throw new Error('Failed to get configuration');
            }
            const config = await configResponse.json();

            // Create session
            const response = await fetch(`${API_URL}/session`);
            if (!response.ok) {
                throw new Error('Failed to create session');
            }
            const sessionData = await response.json();
            setSessionId(sessionData.id);

            // Setup audio recording
            const audioSetupSuccess = await setupAudioRecording();
            if (!audioSetupSuccess) {
                throw new Error('Failed to setup audio recording');
            }

            // Connect to WebSocket
            websocket.current = new WebSocket(`ws://${window.location.hostname}:8000/proxy`);
            
            websocket.current.onopen = () => {
                console.log('WebSocket connected');
                // Send configuration to proxy
                websocket.current.send(JSON.stringify({
                    endpoint: config.endpoint,
                    deployment: config.deployment,
                    apiKey: config.apiKey
                }));

                // Send session configuration
                websocket.current.send(JSON.stringify({
                    "type": "session.update",
                    "session": {
                        "modalities": ["text", "audio"],
                        "instructions": "You are a helpful assistant.",
                        "voice": "echo",
                        "input_audio_format": "pcm16",
                        "output_audio_format": "pcm16",
                        "input_audio_transcription": {
                            "model": "whisper-1"
                        },
                        "turn_detection": {
                            "type": "server_vad",
                            "threshold": 0.5,
                            "prefix_padding_ms": 300,
                            "silence_duration_ms": 500,
                            "create_response": true
                        },
                        "temperature": 0.8,
                        "max_response_output_tokens": "inf"
                    }
                }));
                
                isRecording.current = true;
                setIsStreaming(true);
            };

            websocket.current.onmessage = handleMessage;
            
            websocket.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error');
                stopStreaming();
            };

            websocket.current.onclose = () => {
                console.log('WebSocket connection closed');
                stopStreaming();
            };

        } catch (error) {
            console.error('Error starting stream:', error);
            setError('Failed to start streaming: ' + error.message);
            stopStreaming();
        } finally {
            setIsConnecting(false);
        }
    };

    const stopStreaming = () => {
        isRecording.current = false;
        
        if (websocket.current) {
            if (websocket.current.readyState === WebSocket.OPEN) {
                websocket.current.close();
            }
            websocket.current = null;
        }
        
        if (audioProcessor.current) {
            audioProcessor.current.disconnect();
            audioProcessor.current = null;
        }
        
        if (audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
        }
        
        if (audioStream.current) {
            audioStream.current.getTracks().forEach(track => track.stop());
            audioStream.current = null;
        }
        
        setIsStreaming(false);
        setSessionId(null);
    };

    useEffect(() => {
        return () => {
            stopStreaming();
        };
    }, []);

    return (
        <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
                Audio Streaming
            </Typography>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            {!isStreaming ? (
                <Button 
                    variant="contained" 
                    onClick={startStreaming}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Connecting...
                        </>
                    ) : (
                        'Start Streaming'
                    )}
                </Button>
            ) : (
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={stopStreaming}
                >
                    Stop Streaming
                </Button>
            )}
            {sessionId && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Session ID: {sessionId}
                </Typography>
            )}
            {transcript && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                        Transcript: {transcript}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default AudioStream; 