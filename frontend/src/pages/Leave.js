import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  CheckCircle,
  Cancel,
  Pending,
  CalendarToday,
  Person,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { leaveAPI } from '../services/api';

const Leave = () => {
  const [tabValue, setTabValue] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending',
  });

  // Mock data for demonstration
  const mockLeaveRequests = [
    {
      id: 1,
      employeeName: 'John Smith',
      employeeId: 'EMP001',
      leaveType: 'Annual Leave',
      startDate: '2024-10-15',
      endDate: '2024-10-19',
      days: 5,
      reason: 'Family vacation',
      status: 'pending',
      appliedDate: '2024-09-20',
      avatar: 'JS',
    },
    {
      id: 2,
      employeeName: 'Sarah Johnson',
      employeeId: 'EMP002',
      leaveType: 'Sick Leave',
      startDate: '2024-09-25',
      endDate: '2024-09-26',
      days: 2,
      reason: 'Medical appointment',
      status: 'approved',
      appliedDate: '2024-09-22',
      avatar: 'SJ',
    },
    {
      id: 3,
      employeeName: 'Mike Wilson',
      employeeId: 'EMP003',
      leaveType: 'Personal Leave',
      startDate: '2024-10-01',
      endDate: '2024-10-03',
      days: 3,
      reason: 'Personal matters',
      status: 'pending',
      appliedDate: '2024-09-18',
      avatar: 'MW',
    },
    {
      id: 4,
      employeeName: 'Anna Brown',
      employeeId: 'EMP004',
      leaveType: 'Annual Leave',
      startDate: '2024-11-10',
      endDate: '2024-11-20',
      days: 10,
      reason: 'Extended vacation',
      status: 'rejected',
      appliedDate: '2024-09-15',
      avatar: 'AB',
    },
    {
      id: 5,
      employeeName: 'David Lee',
      employeeId: 'EMP005',
      leaveType: 'Maternity/Paternity',
      startDate: '2024-12-01',
      endDate: '2025-02-28',
      days: 90,
      reason: 'Paternity leave',
      status: 'approved',
      appliedDate: '2024-09-10',
      avatar: 'DL',
    },
  ];

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      // In real implementation, uncomment this:
      // const response = await leaveAPI.getAll();
      // setLeaveRequests(response.data);

      // Mock data for demonstration
      setLeaveRequests(mockLeaveRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRequest) {
        await leaveAPI.update(selectedRequest.id, formData);
      } else {
        await leaveAPI.create(formData);
      }
      loadLeaveRequests();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving leave request:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id);
      loadLeaveRequests();
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await leaveAPI.reject(id);
      loadLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setFormData({
      employeeId: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      status: 'pending',
    });
  };

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

  const filteredRequests = leaveRequests.filter((request) => {
    if (tabValue === 0) return true; // All requests
    if (tabValue === 1) return request.status === 'pending'; // Pending
    if (tabValue === 2) return request.status === 'approved'; // Approved
    if (tabValue === 3) return request.status === 'rejected'; // Rejected
    return true;
  });

  const columns = [
    {
      field: 'employee',
      headerName: 'Employee',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
            {params.row.avatar}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.employeeName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.employeeId}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { field: 'leaveType', headerName: 'Type', width: 130 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 120,
      renderCell: (params) => format(parseISO(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 120,
      renderCell: (params) => format(parseISO(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'days',
      headerName: 'Days',
      width: 80,
      align: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          {params.row.status === 'pending' && (
            <>
              <IconButton
                size="small"
                color="success"
                onClick={() => handleApprove(params.row.id)}
              >
                <CheckCircle fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleReject(params.row.id)}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Leave Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          New Leave Request
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: '#ff9800', borderRadius: 2 }}>
                  <Pending sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: '#4caf50', borderRadius: 2 }}>
                  <CheckCircle sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {leaveRequests.filter(r => r.status === 'approved').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: '#f44336', borderRadius: 2 }}>
                  <Cancel sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {leaveRequests.filter(r => r.status === 'rejected').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: '#1976d2', borderRadius: 2 }}>
                  <CalendarToday sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {leaveRequests.reduce((sum, r) => sum + r.days, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Requests Table */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`All (${leaveRequests.length})`} />
            <Tab label={`Pending (${leaveRequests.filter(r => r.status === 'pending').length})`} />
            <Tab label={`Approved (${leaveRequests.filter(r => r.status === 'approved').length})`} />
            <Tab label={`Rejected (${leaveRequests.filter(r => r.status === 'rejected').length})`} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={loading}
            disableSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                fontWeight: 600,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Leave Request Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRequest ? 'Edit Leave Request' : 'New Leave Request'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleInputChange}
                    label="Leave Type"
                    required
                  >
                    <MenuItem value="Annual Leave">Annual Leave</MenuItem>
                    <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                    <MenuItem value="Personal Leave">Personal Leave</MenuItem>
                    <MenuItem value="Maternity/Paternity">Maternity/Paternity</MenuItem>
                    <MenuItem value="Emergency Leave">Emergency Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedRequest ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Leave;