import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  School,
  Assessment,
} from '@mui/icons-material';

const Skills = () => {
  const [tabValue, setTabValue] = useState(0);

  const skillsData = [
    { name: 'Machine Learning', employees: 45, progress: 25, demand: 'High' },
    { name: 'Cloud Architecture', employees: 38, progress: 60, demand: 'High' },
    { name: 'Data Science', employees: 33, progress: 40, demand: 'Medium' },
    { name: 'DevOps', employees: 28, progress: 70, demand: 'Medium' },
    { name: 'React.js', employees: 52, progress: 80, demand: 'High' },
  ];

  const learningPaths = [
    { title: 'AI/ML Fundamentals', progress: 35, participants: 12 },
    { title: 'Cloud Computing Essentials', progress: 65, participants: 18 },
    { title: 'Advanced JavaScript', progress: 45, participants: 15 },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getDemandColor = (demand) => {
    switch (demand) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Skills Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Track skills gaps, manage learning paths, and analyze workforce capabilities
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Skills Overview" />
          <Tab label="Gap Analysis" />
          <Tab label="Learning Paths" />
          <Tab label="Recommendations" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organization Skills Matrix
                </Typography>
                {skillsData.map((skill, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {skill.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`${skill.demand} Demand`}
                          color={getDemandColor(skill.demand)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {skill.employees} employees
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={skill.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {skill.progress}% proficiency level
                    </Typography>
                  </Box>
                ))}
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
                  startIcon={<Assessment />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Run Skills Analysis
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<School />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Create Learning Path
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Psychology />}
                  fullWidth
                >
                  AI Recommendations
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Skills Gap Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Identify critical skill gaps and prioritize training initiatives
            </Typography>
            <Grid container spacing={2}>
              {skillsData.filter(skill => skill.progress < 60).map((skill, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {skill.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gap: {100 - skill.progress}% • {skill.employees} employees affected
                      </Typography>
                      <Chip
                        label={`${skill.demand} Priority`}
                        color={getDemandColor(skill.demand)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Learning Paths
                </Typography>
                {learningPaths.map((path, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {path.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {path.participants} participants
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={path.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {path.progress}% average completion
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Learning Statistics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">24</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Learners
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">156</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hours Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI-Powered Recommendations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intelligent skills recommendations and learning path suggestions coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Skills;