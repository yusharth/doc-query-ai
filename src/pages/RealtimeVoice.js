import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, TextField, Chip, Stack
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import PowerIcon from '@mui/icons-material/PowerSettingsNew';
import LinkIcon from '@mui/icons-material/Link';
import { onUserMessage, onAssistantMessage, connect, disconnect, toggleSpeaking, sendCustomEvent } from '../services/rtcService';

const ChatUI = () => {
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [jsonEvent, setJsonEvent] = useState(
    JSON.stringify({
      type: 'session.update',
      session: { instructions: 'You are a helpful assistant.' },
    }, null, 2)
  );
  const [status, setStatus] = useState('Disconnected');

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConnect = () => {
    if (audioRef.current) {
      connect(audioRef.current);
    }
    setConnected(true);
    setStatus('Connecting...');
  };

  const handleDisconnect = () => {
    disconnect();
    setConnected(false);
    setSpeaking(false);
  };

  const handleSpeakToggle = () => {
    toggleSpeaking();
    setSpeaking(prev => !prev);
  };

  const handleSendEvent = () => {
    try {
        const eventObj = JSON.parse(jsonEvent);
        sendCustomEvent(eventObj);
    } catch (err) {
        alert('Invalid JSON: ' + err.message);
    }
  };

  useEffect(() => {
    onUserMessage((msg) => {
        console.log('msguser', msg);
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
    });

    onAssistantMessage((msg) => {
        console.log('msgAI', msg);
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    });
  }, []);

  return (
    <Box p={4} sx={{ background: '#f7f9fc', minHeight: '100vh', color: '#333' }}>
      <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 3 }}>
        🧠 Realtime AI Assistant
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box flex={2}>
          <Card sx={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #ddd' }}>
            <CardContent sx={{ maxHeight: 500, overflowY: 'auto' }} id="messages">
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Chip
                    label={msg.role}
                    size="small"
                    color={msg.role === 'You' ? 'primary' : 'default'}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>{msg.content}</Typography>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
              disabled={connected}
              id="connectBtn"
              sx={{ backgroundColor: '#1976d2' }}
            >
              Connect
            </Button>
            <Button
              variant="outlined"
              startIcon={<PowerIcon />}
              onClick={handleDisconnect}
              disabled={!connected}
              id="disconnectBtn"
              color="error"
            >
              Disconnect
            </Button>
            <Button
              variant="contained"
              startIcon={speaking ? <StopIcon /> : <MicIcon />}
              onClick={handleSpeakToggle}
              disabled={!connected}
              id="speakBtn"
              color={speaking ? 'error' : 'success'}
            >
              {speaking ? 'Stop' : 'Speak'}
            </Button>
          </Stack>
        </Box>

        <Box flex={1}>
          <Card sx={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #ddd' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#1976d2', mb: 1 }}>
                Custom Event
              </Typography>
              <TextField
                multiline
                fullWidth
                minRows={8}
                value={jsonEvent}
                onChange={(e) => setJsonEvent(e.target.value)}
                id="customEvent"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleSendEvent}
                disabled={!connected}
                id="sendEventBtn"
                startIcon={<SendIcon />}
                sx={{ mt: 2, backgroundColor: '#0288d1' }}
              >
                Send Event
              </Button>
            </CardContent>
          </Card>
          <Box mt={2}>
            <Chip
              label={connected ? '🟢 Connected' : '🔴 Disconnected'}
              color={connected ? 'success' : 'default'}
              id="status"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
      </Stack>

      <audio ref={audioRef} id="audioOutput" hidden autoPlay />
    </Box>
  );
};

export default ChatUI;
