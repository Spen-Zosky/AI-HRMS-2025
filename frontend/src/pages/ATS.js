import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Upload,
  Work,
  Person,
  Assessment,
  CloudUpload,
} from '@mui/icons-material';

const ATS = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Applicant Tracking System
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        AI-powered recruitment and candidate management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Job Postings" />
          <Tab label="Candidates" />
          <Tab label="CV Upload" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Job Postings
                </Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Senior Software Engineer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Engineering • Full-time • 15 applicants
                  </Typography>
                  <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                </Paper>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Data Scientist
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data Science • Full-time • 23 applicants
                  </Typography>
                  <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                </Paper>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Work />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Create Job Posting
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload CV/Resume
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Drag and drop files here or click to browse
              </Typography>
              <Button variant="contained" startIcon={<Upload />}>
                Choose Files
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {(tabValue === 1 || tabValue === 3) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {tabValue === 1 ? 'Candidate Management' : 'Recruitment Analytics'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {tabValue === 1
                ? 'Candidate pipeline and management features coming soon...'
                : 'Recruitment metrics and insights coming soon...'
              }
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ATS;