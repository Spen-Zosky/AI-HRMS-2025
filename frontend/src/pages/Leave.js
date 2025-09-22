import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  Pending,
  CalendarToday,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { leaveAPI } from '../services/api';

const Leave = () => {
  const [tabValue, setTabValue] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending',
  });

  // Error state for better UX
  const [error, setError] = useState(null);

  const loadLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await leaveAPI.getAll();
      console.log('Leave API Response:', response.data);

      // Handle the response format from the backend
      if (response.data.success && response.data.leaveRequests) {
        setLeaveRequests(response.data.leaveRequests);
      } else {
        // Fallback to empty array if format is unexpected
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
      setError('Failed to load leave requests. Please try again.');
      // Set empty array on error to prevent crashes
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

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
      // Transform formData to match backend API expectations
      const requestData = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.leaveType.toLowerCase().replace(/ leave/i, '').replace('maternity/paternity', 'maternity'),
        reason: formData.reason
      };

      if (selectedRequest) {
        await leaveAPI.update(selectedRequest.id, requestData);
      } else {
        await leaveAPI.create(requestData);
      }
      loadLeaveRequests();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving leave request:', error);
      setError('Failed to save leave request. Please try again.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id);
      loadLeaveRequests();
    } catch (error) {
      console.error('Error approving leave request:', error);
      setError('Failed to approve leave request. Please try again.');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this leave request?')) {
      try {
        // For reject, we need to provide a reason
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await leaveAPI.reject(id, { reason });
          loadLeaveRequests();
        }
      } catch (error) {
        console.error('Error rejecting leave request:', error);
        setError('Failed to reject leave request. Please try again.');
      }
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      Loading leave requests...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'error.main' }}>
                      {error}
                      <Button onClick={loadLeaveRequests} sx={{ ml: 2 }}>
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                          {request.avatar}
                        </Avatar>
                      </TableCell>
                      <TableCell>{request.employeeName}</TableCell>
                      <TableCell>{request.leaveType}</TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell>{request.days}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Box>
                            <IconButton size="small" onClick={() => handleApprove(request.id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleReject(request.id)}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRequests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
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