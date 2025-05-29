import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function AgentList() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('https://doc-query-backend.onrender.com/get_all_agents/', {
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        setError('Failed to fetch agents');
      }
    } catch (error) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/builder');
  };

  const handleChat = (taskId) => {
    navigate(`/chat/${taskId}`);
  };

  const handleDeleteClick = (agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`https://doc-query-backend.onrender.com/delete_agent/${agentToDelete.task_id}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the deleted agent from the list
        setAgents(agents.filter(agent => agent.task_id !== agentToDelete.task_id));
        setDeleteDialogOpen(false);
        setAgentToDelete(null);
      } else {
        setDeleteError('Failed to delete agent');
      }
    } catch (error) {
      setDeleteError('Error connecting to the server');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAgentToDelete(null);
    setDeleteError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Agents</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Agent
        </Button>
      </Box>

      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} md={4} key={agent.task_id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {agent.agent_name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteClick(agent)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Chip 
                  label={agent.agent_type} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 2 }}
                />
                {agent.document_metadata && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Document: {agent.document_metadata.file_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {agent.document_metadata.doc_type}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(agent.created_at).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                {agent.agent_type === 'rag-agent' && (
                  <Button
                    startIcon={<ChatIcon />}
                    onClick={() => handleChat(agent.task_id)}
                  >
                    Chat
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {agents.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No agents found. Create your first agent to get started!
          </Typography>
        </Paper>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          {deleteError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          ) : (
            <Typography>
              Are you sure you want to delete the agent "{agentToDelete?.agent_name}"? 
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={!!deleteError}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AgentList;