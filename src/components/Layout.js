import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Mic as MicIcon,
  Support as SupportIcon,
  ShoppingCart as ShoppingCartIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Agents', icon: <PeopleIcon />, path: '/agents' },
  { text: 'Agent Builder', icon: <BuildIcon />, path: '/builder' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const voiceAgents = [
  { text: 'Customer Support', icon: <SupportIcon />, path: '/voice-agent', type: 'support' },
  { text: 'Sales Assistant', icon: <ShoppingCartIcon />, path: '/voice-agent', type: 'sales' },
  { text: 'Educational Guide', icon: <SchoolIcon />, path: '/voice-agent', type: 'education' },
  { text: 'Business Consultant', icon: <BusinessIcon />, path: '/voice-agent', type: 'business' },
];

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

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path, type) => {
    if (path === '/voice-agent' && type) {
      // Store the selected agent type in sessionStorage
      sessionStorage.setItem('selectedVoiceAgent', type);
    }
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Agent Builder
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider sx={{ my: 2 }} />
        <ListSubheader>Voice Agents</ListSubheader>
        {voiceAgents.map((agent) => (
          <ListItem
            button
            key={agent.text}
            onClick={() => handleNavigation(agent.path, agent.type)}
            selected={location.pathname === agent.path && sessionStorage.getItem('selectedVoiceAgent') === agent.type}
          >
            <ListItemIcon sx={{ color: getAgentColor(agent.type) }}>{agent.icon}</ListItemIcon>
            <ListItemText primary={agent.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.path === location.pathname)?.text || 'Agent Builder'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                height: '100%',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                height: '100%',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* This creates space for the fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 