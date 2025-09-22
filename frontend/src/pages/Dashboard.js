import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  CalendarToday,
  TrendingUp,
  Psychology,
  MoreVert,
  CheckCircle,
  Pending,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight={600}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 32 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      activeLeaveRequests: 0,
      openPositions: 0,
      skillsGaps: 0,
    },
    recentLeaveRequests: [],
    topSkillsGaps: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data from API
      const [statsResponse, leavesResponse, skillsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentLeaves(5),
        dashboardAPI.getSkillsGaps(4)
      ]);

      setDashboardData({
        stats: statsResponse.data,
        recentLeaveRequests: leavesResponse.data.recentLeaves || [],
        topSkillsGaps: skillsResponse.data.skillsGaps || [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');

      // Set empty data structure on error instead of mock data
      setDashboardData({
        stats: {
          totalEmployees: 0,
          activeLeaveRequests: 0,
          openPositions: 0,
          skillsGaps: 0,
        },
        recentLeaveRequests: [],
        topSkillsGaps: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle fontSize="small" />;
      case 'rejected': return <Cancel fontSize="small" />;
      case 'pending': return <Pending fontSize="small" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Welcome back, {user?.firstName || user?.first_name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Here's your HR dashboard overview for today
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={loadDashboardData}
            >
              <TrendingUp />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={dashboardData.stats.totalEmployees}
            icon={<People />}
            color="#1976d2"
            subtitle="+12 this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Leave Requests"
            value={dashboardData.stats.activeLeaveRequests}
            icon={<CalendarToday />}
            color="#ff9800"
            subtitle="Pending approval"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Positions"
            value={dashboardData.stats.openPositions}
            icon={<TrendingUp />}
            color="#4caf50"
            subtitle="Active recruitment"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Skills Gaps"
            value={dashboardData.stats.skillsGaps}
            icon={<Psychology />}
            color="#f44336"
            subtitle="Require attention"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Leave Requests */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Leave Requests
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentLeaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.employee}</TableCell>
                        <TableCell>{request.type}</TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Skills Gaps */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Top Skills Gaps
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>

              <Box sx={{ space: 2 }}>
                {dashboardData.topSkillsGaps.map((item, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.skill}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.employees} employees
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.progress}
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
                      {item.progress}% training progress
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;