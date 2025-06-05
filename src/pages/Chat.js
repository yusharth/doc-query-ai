import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import API_URL from '../config/api';
import AudioStream from '../components/AudioStream';

function Chat() {
  const { taskId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamMessage]);

  useEffect(() => {
    // Cleanup function to abort any ongoing requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setCurrentStreamMessage('');

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          user_message: userMessage,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') {
              // Handle completion
              break;
            }
            setCurrentStreamMessage(prev => prev + data);
          }
        }
      }

      // Add the complete streamed message to messages
      if (currentStreamMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: currentStreamMessage }]);
        setCurrentStreamMessage('');
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        setMessages(prev => [...prev, { 
          role: 'error', 
          content: 'Sorry, there was an error connecting to the server.' 
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Chat with RAG Agent
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Task ID: {taskId}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <AudioStream />
      </Box>

      <Paper 
        sx={{ 
          flex: 1, 
          mb: 2, 
          p: 2, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <List sx={{ flex: 1 }}>
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <ListItem 
                sx={{ 
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.role === 'user' 
                      ? 'primary.main' 
                      : message.role === 'error'
                      ? 'error.main'
                      : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <ListItemText primary={message.content} />
                </Paper>
              </ListItem>
              {index < messages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {currentStreamMessage && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: 'grey.100',
                }}
              >
                <ListItemText primary={currentStreamMessage} />
              </Paper>
            </ListItem>
          )}
          {isLoading && !currentStreamMessage && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <CircularProgress size={20} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Paper 
        component="form" 
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          display: 'flex', 
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          endIcon={<SendIcon />}
          disabled={isLoading || !inputMessage.trim()}
        >
          Send
        </Button>
      </Paper>
    </Box>
  );
}

export default Chat;