import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';

function AgentBuilder() {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('');
  const [capabilities, setCapabilities] = useState([]);
  const [newCapability, setNewCapability] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [taskId, setTaskId] = useState(null);

  const handleAddCapability = () => {
    if (newCapability && !capabilities.includes(newCapability)) {
      setCapabilities([...capabilities, newCapability]);
      setNewCapability('');
    }
  };

  const handleDeleteCapability = (capabilityToDelete) => {
    setCapabilities(capabilities.filter((cap) => cap !== capabilityToDelete));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus({ type: '', message: '' });
      setTaskId(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('https://doc-query-backend.onrender.com/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTaskId(data.task_id);
        setUploadStatus({ type: 'success', message: 'File uploaded successfully' });
      } else {
        setUploadStatus({ type: 'error', message: 'Failed to upload file' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Error uploading file' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (agentType === 'rag-agent' && !taskId) {
      setUploadStatus({ type: 'error', message: 'Please upload a document first' });
      return;
    }

    const agentData = {
      task_id: taskId,
      agent_name: agentName,
      agent_type: agentType,
      document_metadata: selectedFile ? {
        file_name: selectedFile.name,
        doc_type: selectedFile.type.split('/')[1].toUpperCase(),
      } : null,
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch('https://doc-query-backend.onrender.com/create_agent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        setUploadStatus({ type: 'success', message: 'Agent created successfully' });
        // Navigate to chat page for RAG agents
        if (agentType === 'rag-agent' && taskId) {
          navigate(`/chat/${taskId}`);
        } else {
          // Reset form for non-RAG agents
          setAgentName('');
          setAgentType('');
          setCapabilities([]);
          setSelectedFile(null);
          setTaskId(null);
        }
      } else {
        setUploadStatus({ type: 'error', message: 'Failed to create agent' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Error creating agent' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agent Builder
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={agentType}
                  label="Agent Type"
                  onChange={(e) => setAgentType(e.target.value)}
                >
                  <MenuItem value="chatbot">Chatbot</MenuItem>
                  <MenuItem value="data-analyzer">Data Analyzer</MenuItem>
                  <MenuItem value="task-automator">Task Automator</MenuItem>
                  <MenuItem value="content-generator">Content Generator</MenuItem>
                  <MenuItem value="rag-agent">RAG Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {agentType === 'rag-agent' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Document Upload
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </Button>
                  {selectedFile && (
                    <Typography variant="body2">
                      Selected: {selectedFile.name}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleFileUpload}
                    disabled={!selectedFile}
                  >
                    Upload
                  </Button>
                </Box>
                {uploadStatus.message && (
                  <Alert severity={uploadStatus.type} sx={{ mt: 2 }}>
                    {uploadStatus.message}
                  </Alert>
                )}
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Capabilities
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Capability"
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddCapability}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {capabilities.map((capability) => (
                  <Chip
                    key={capability}
                    label={capability}
                    onDelete={() => handleDeleteCapability(capability)}
                  />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined">Cancel</Button>
                <Button 
                  variant="contained" 
                  type="submit"
                  disabled={agentType === 'rag-agent' && !taskId}
                >
                  Create Agent
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default AgentBuilder;