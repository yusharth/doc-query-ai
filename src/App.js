import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Import pages
import Dashboard from './pages/Dashboard';
import AgentBuilder from './pages/AgentBuilder';
import AgentList from './pages/AgentList';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import ChatUI from './pages/RealtimeVoice';

// Import components
import Layout from './components/Layout';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Layout>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agents" element={<AgentList />} />
                <Route path="/builder" element={<AgentBuilder />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/chat/:taskId" element={<Chat />} />
                <Route path="/realtime-voice" element={<ChatUI />} />
              </Routes>
            </Box>
          </Layout>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 