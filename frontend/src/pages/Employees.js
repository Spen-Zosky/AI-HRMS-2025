import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Download,
} from '@mui/icons-material';
import { employeeAPI } from '../services/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    salary: '',
    startDate: '',
    phone: '',
  });

  // Mock data for demonstration
  const mockEmployees = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      department: 'Engineering',
      position: 'Senior Developer',
      salary: 85000,
      startDate: '2022-03-15',
      phone: '+1-555-0123',
      status: 'Active',
    },
    {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      department: 'Marketing',
      position: 'Marketing Manager',
      salary: 72000,
      startDate: '2021-08-20',
      phone: '+1-555-0124',
      status: 'Active',
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@company.com',
      department: 'Sales',
      position: 'Sales Representative',
      salary: 58000,
      startDate: '2023-01-10',
      phone: '+1-555-0125',
      status: 'Active',
    },
    {
      id: 4,
      firstName: 'Anna',
      lastName: 'Brown',
      email: 'anna.brown@company.com',
      department: 'HR',
      position: 'HR Specialist',
      salary: 65000,
      startDate: '2022-11-05',
      phone: '+1-555-0126',
      status: 'Active',
    },
    {
      id: 5,
      firstName: 'David',
      lastName: 'Lee',
      email: 'david.lee@company.com',
      department: 'Engineering',
      position: 'DevOps Engineer',
      salary: 90000,
      startDate: '2021-06-12',
      phone: '+1-555-0127',
      status: 'Active',
    },
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // In real implementation, uncomment this:
      // const response = await employeeAPI.getAll();
      // setEmployees(response.data);

      // Mock data for demonstration
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
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
      if (selectedEmployee) {
        // Update employee
        await employeeAPI.update(selectedEmployee.id, formData);
      } else {
        // Create new employee
        await employeeAPI.create(formData);
      }
      loadEmployees();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        loadEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      salary: '',
      startDate: '',
      phone: '',
    });
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === '' || employee.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
          {params.row.firstName[0]}{params.row.lastName[0]}
        </Avatar>
      ),
      sortable: false,
      filterable: false,
    },
    { field: 'firstName', headerName: 'First Name', width: 130 },
    { field: 'lastName', headerName: 'Last Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'position', headerName: 'Position', width: 160 },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      renderCell: (params) => `$${params.value.toLocaleString()}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Employee Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Add Employee
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ ml: 'auto' }}
            >
              Export
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={filteredEmployees}
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

      {/* Employee Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    label="Department"
                    required
                  >
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  margin="normal"
                />
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
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedEmployee ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Employees;