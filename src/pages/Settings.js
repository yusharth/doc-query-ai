import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';

function Settings() {
  const [settings, setSettings] = useState({
    apiKey: '',
    maxAgents: 10,
    autoBackup: true,
    notifications: true,
    theme: 'light',
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle settings save
    console.log('Saving settings:', settings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                API Configuration
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={settings.apiKey}
                onChange={handleChange('apiKey')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Maximum Number of Agents"
                type="number"
                value={settings.maxAgents}
                onChange={handleChange('maxAgents')}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoBackup}
                    onChange={handleChange('autoBackup')}
                  />
                }
                label="Enable Automatic Backups"
                sx={{ display: 'block', mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={handleChange('notifications')}
                  />
                }
                label="Enable Notifications"
                sx={{ display: 'block' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <TextField
                fullWidth
                select
                label="Theme"
                value={settings.theme}
                onChange={handleChange('theme')}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined">Reset to Defaults</Button>
                <Button variant="contained" type="submit">
                  Save Settings
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default Settings; 