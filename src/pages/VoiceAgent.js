import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea, Chip } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import SupportIcon from '@mui/icons-material/Support';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import WebRTCHandler from '../utils/WebRTCHandler';

const breathe = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

const AgentCard = styled(Card)(({ theme, isListening, agentType }) => ({
  width: '100%',
  height: '100%',
  minHeight: '280px',
  transition: 'all 0.3s ease',
  borderRadius: isListening ? '50%' : '8px',
  backgroundColor: isListening ? theme.palette.primary.main : theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: '300px',
  },
  [theme.breakpoints.up('md')]: {
    minHeight: '320px',
  },
}));

const AgentContent = styled(Box)(({ isListening }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  animation: isListening ? `${breathe} 3s ease-in-out infinite` : 'none',
  padding: '16px',
}));

const getAgentIcon = (type) => {
  switch (type) {
    case 'support':
      return <SupportIcon sx={{ fontSize: 48 }} />;
    case 'sales':
      return <ShoppingCartIcon sx={{ fontSize: 48 }} />;
    case 'education':
      return <SchoolIcon sx={{ fontSize: 48 }} />;
    case 'business':
      return <BusinessIcon sx={{ fontSize: 48 }} />;
    default:
      return <MicIcon sx={{ fontSize: 48 }} />;
  }
};

const getAgentColor = (type) => {
  switch (type) {
    case 'support':
      return '#2196f3'; // Blue
    case 'sales':
      return '#4caf50'; // Green
    case 'education':
      return '#9c27b0'; // Purple
    case 'business':
      return '#ff9800'; // Orange
    default:
      return '#1976d2'; // Default blue
  }
};

const VoiceAgentCard = ({ agent, onSelect, isListening }) => {
  const iconColor = isListening ? 'white' : getAgentColor(agent.type);
  
  return (
    <AgentCard isListening={isListening} agentType={agent.type}>
      <CardActionArea 
        onClick={() => onSelect(agent.id)}
        sx={{ height: '100%' }}
      >
        <AgentContent isListening={isListening}>
          <Box sx={{ color: iconColor, mb: 2 }}>
            {getAgentIcon(agent.type)}
          </Box>
          <Typography 
            variant="h6" 
            color={isListening ? 'white' : 'text.primary'}
            align="center"
            gutterBottom
          >
            {agent.name}
          </Typography>
          <Typography 
            variant="body2" 
            color={isListening ? 'white' : 'text.secondary'}
            align="center"
            sx={{ mb: 2 }}
          >
            {agent.description}
          </Typography>
          <Chip 
            label={agent.ragAgent} 
            size="small"
            sx={{ 
              backgroundColor: isListening ? 'rgba(255,255,255,0.2)' : 'primary.light',
              color: isListening ? 'white' : 'primary.contrastText'
            }}
          />
          {!isListening && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              Click to start voice interaction
            </Typography>
          )}
        </AgentContent>
      </CardActionArea>
    </AgentCard>
  );
};

const VoiceAgent = () => {
  const [agents, setAgents] = useState([
    { 
      id: 1, 
      name: 'Customer Support Agent',
      type: 'support',
      description: 'Helps with customer inquiries and support issues',
      ragAgent: 'Support Knowledge Base',
      isActive: false, 
      isListening: false, 
      sessionId: null 
    },
    { 
      id: 2, 
      name: 'Sales Assistant',
      type: 'sales',
      description: 'Assists with product information and sales inquiries',
      ragAgent: 'Product Catalog',
      isActive: false, 
      isListening: false, 
      sessionId: null 
    },
    { 
      id: 3, 
      name: 'Educational Guide',
      type: 'education',
      description: 'Provides educational content and learning support',
      ragAgent: 'Learning Resources',
      isActive: false, 
      isListening: false, 
      sessionId: null 
    },
    { 
      id: 4, 
      name: 'Business Consultant',
      type: 'business',
      description: 'Offers business insights and strategic advice',
      ragAgent: 'Business Intelligence',
      isActive: false, 
      isListening: false, 
      sessionId: null 
    },
  ]);

  const [error, setError] = useState(null);
  const webRTCHandler = useRef(null);

  useEffect(() => {
    // Get the selected agent type from sessionStorage
    const selectedType = sessionStorage.getItem('selectedVoiceAgent');
    if (selectedType) {
      // Find the agent with the matching type
      const selectedAgent = agents.find(agent => agent.type === selectedType);
      if (selectedAgent) {
        // Initialize the session for the selected agent
        initializeSession(selectedAgent.id);
      }
    }
  }, []);

  const initializeSession = async (agentId) => {
    try {
      setError(null);
      
      // Create session
      const response = await fetch('http://localhost:8000/session');
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      const sessionData = await response.json();
      
      // Initialize WebRTC handler
      webRTCHandler.current = new WebRTCHandler();
      
      // Set up error handling
      webRTCHandler.current.setErrorCallback((errorMessage) => {
        setError(errorMessage);
        stopSession(agentId);
      });
      
      // Set up state change handling
      webRTCHandler.current.setStateChangeCallback((state) => {
        if (state === 'connected') {
          setAgents(prevAgents => 
            prevAgents.map(agent => 
              agent.id === agentId 
                ? { ...agent, sessionId: sessionData.id, isActive: true, isListening: true }
                : { ...agent, isActive: false, isListening: false }
            )
          );
        } else if (state === 'disconnected') {
          stopSession(agentId);
        }
      });
      
      // Initialize audio
      const audioInitialized = await webRTCHandler.current.initialize();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio');
      }
      
      // Connect WebSocket
      const config = {
        endpoint: process.env.REACT_APP_AZURE_OPENAI_ENDPOINT,
        deployment: process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT,
        apiKey: process.env.REACT_APP_AZURE_OPENAI_API_KEY,
        model: "gpt-35-turbo-16k"
      };
      
      const connected = await webRTCHandler.current.connectWebSocket(config);
      if (!connected) {
        throw new Error('Failed to connect to WebSocket');
      }
      
    } catch (error) {
      console.error('Error initializing session:', error);
      setError('Failed to initialize session: ' + error.message);
      stopSession(agentId);
    }
  };

  const stopSession = (agentId) => {
    if (webRTCHandler.current) {
      webRTCHandler.current.cleanup();
      webRTCHandler.current = null;
    }
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId
          ? { ...agent, isListening: false, isActive: false }
          : agent
      )
    );
  };

  const handleAgentSelect = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent.isActive) {
      initializeSession(agentId);
    } else {
      stopSession(agentId);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      agents.forEach(agent => {
        if (agent.isActive) {
          stopSession(agent.id);
        }
      });
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: 4,
        py: 4,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Voice Agents
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Grid 
        container 
        spacing={3} 
        justifyContent="center"
        sx={{
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {agents.map((agent) => (
          <Grid 
            item 
            key={agent.id}
            xs={12}
            sm={6}
            md={4}
            lg={3}
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '320px' }}>
              <VoiceAgentCard
                agent={agent}
                isListening={agent.isListening}
                onSelect={handleAgentSelect}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VoiceAgent; 