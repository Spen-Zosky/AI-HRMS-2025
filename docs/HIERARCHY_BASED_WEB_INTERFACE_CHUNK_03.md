## 🎨 Frontend Component Architecture

### React Application Structure

#### **Component Hierarchy**

```
src/components/
├── admin/                               # 👑 Admin Interface Components
│   ├── platform/                        # 🔧 Platform Admin Components
│   │   ├── PlatformDashboard.jsx
│   │   ├── TenancyManagement.jsx
│   │   ├── CreateTenancyModal.jsx
│   │   ├── TenancyDetailsPanel.jsx
│   │   ├── OrganizationOverview.jsx
│   │   ├── UserOverview.jsx
│   │   ├── SystemStats.jsx
│   │   ├── GlobalAuditLogs.jsx
│   │   └── MaintenancePanel.jsx
│   ├── tenancy/                         # 🏢 Tenancy Admin Components
│   │   ├── TenancyDashboard.jsx
│   │   ├── OrganizationManager.jsx
│   │   ├── CreateOrganizationModal.jsx
│   │   ├── OrganizationCard.jsx
│   │   ├── TenancyBoardMembers.jsx
│   │   ├── TenancySettings.jsx
│   │   ├── TenancyReports.jsx
│   │   └── TenancyAuditLogs.jsx
│   ├── organization/                    # 🏬 Organization Admin Components
│   │   ├── OrganizationDashboard.jsx
│   │   ├── EmployeeManager.jsx
│   │   ├── CreateEmployeeModal.jsx
│   │   ├── EmployeeCard.jsx
│   │   ├── DepartmentManager.jsx
│   │   ├── BoardMemberManager.jsx
│   │   ├── HRManagement.jsx
│   │   ├── LeaveRequestManager.jsx
│   │   ├── PerformanceReviews.jsx
│   │   ├── OrganizationSettings.jsx
│   │   └── OrganizationReports.jsx
│   └── common/                          # 🔧 Shared Admin Components
│       ├── AdminLayout.jsx
│       ├── AdminSidebar.jsx
│       ├── AdminHeader.jsx
│       ├── AdminBreadcrumb.jsx
│       ├── StatsCard.jsx
│       ├── DataTable.jsx
│       ├── SearchFilters.jsx
│       ├── ConfirmDialog.jsx
│       ├── LoadingSpinner.jsx
│       └── ErrorBoundary.jsx
├── common/                              # 🛠️ Shared Components
│   ├── forms/
│   │   ├── FormField.jsx
│   │   ├── FormSelect.jsx
│   │   ├── FormDatePicker.jsx
│   │   └── FormFileUpload.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Tooltip.jsx
│   │   ├── Alert.jsx
│   │   └── Badge.jsx
│   └── charts/
│       ├── BarChart.jsx
│       ├── LineChart.jsx
│       ├── PieChart.jsx
│       └── MetricsCard.jsx
├── auth/                                # 🔐 Authentication Components
│   ├── LoginForm.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   └── AuthGuard.jsx
└── layout/                              # 📐 Layout Components
    ├── Header.jsx
    ├── Footer.jsx
    ├── Sidebar.jsx
    └── MainLayout.jsx
```

### Core Admin Components

#### **Platform Dashboard** (`src/components/admin/platform/PlatformDashboard.jsx`)

```jsx
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Button, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Pagination, CircularProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import StatsCard from '../common/StatsCard';
import DataTable from '../common/DataTable';
import SearchFilters from '../common/SearchFilters';
import CreateTenancyModal from './CreateTenancyModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { usePlatformAdmin } from '../../../hooks/usePlatformAdmin';
import { useNotification } from '../../../hooks/useNotification';

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const {
    stats,
    tenancies,
    loading,
    error,
    pagination,
    fetchStats,
    fetchTenancies,
    createTenancy,
    updateTenancyStatus,
    deleteTenancy
  } = usePlatformAdmin();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1
  });

  useEffect(() => {
    fetchStats();
    fetchTenancies(filters);
  }, [filters]);

  const handleCreateTenancy = async (tenancyData) => {
    try {
      await createTenancy(tenancyData);
      setCreateModalOpen(false);
      showNotification('Tenancy created successfully', 'success');
      fetchTenancies(filters);
      fetchStats();
    } catch (error) {
      showNotification(error.message || 'Failed to create tenancy', 'error');
    }
  };

  const handleStatusChange = async (tenancyId, newStatus) => {
    try {
      await updateTenancyStatus(tenancyId, {
        status: newStatus,
        reason: `Status changed to ${newStatus} by platform admin`
      });
      showNotification('Tenancy status updated successfully', 'success');
      fetchTenancies(filters);
      fetchStats();
    } catch (error) {
      showNotification(error.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTenancy(selectedTenancy.id, {
        confirmation: 'DELETE',
        reason: 'Tenancy deletion requested by platform admin'
      });
      setDeleteDialogOpen(false);
      setSelectedTenancy(null);
      showNotification('Tenancy deleted successfully', 'success');
      fetchTenancies(filters);
      fetchStats();
    } catch (error) {
      showNotification(error.message || 'Failed to delete tenancy', 'error');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (event, page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const tenancyColumns = [
    {
      field: 'name',
      headerName: 'Tenancy Name',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.slug}
          </Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' :
                 params.value === 'suspended' ? 'error' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'organizations',
      headerName: 'Organizations',
      width: 130,
      renderCell: (params) => (
        <Box textAlign="center">
          <Typography variant="body2" fontWeight="medium">
            {params.row.statistics.organizationCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            of {params.row.statistics.maxOrganizations}
          </Typography>
        </Box>
      )
    },
    {
      field: 'users',
      headerName: 'Users',
      width: 130,
      renderCell: (params) => (
        <Box textAlign="center">
          <Typography variant="body2" fontWeight="medium">
            {params.row.statistics.userCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            of {params.row.statistics.maxUsers}
          </Typography>
        </Box>
      )
    },
    {
      field: 'utilization',
      headerName: 'Utilization',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="caption" display="block">
            Orgs: {params.row.statistics.utilizationRate.organizations}%
          </Typography>
          <Typography variant="caption" display="block">
            Users: {params.row.statistics.utilizationRate.users}%
          </Typography>
        </Box>
      )
    },
    {
      field: 'billingPlan',
      headerName: 'Plan',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'enterprise' ? 'primary' : 'default'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/admin/platform/tenancies/${params.row.id}`)}
          >
            <ViewIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => navigate(`/admin/platform/tenancies/${params.row.id}/edit`)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedTenancy(params.row);
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  if (loading && !tenancies.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Platform Administration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Tenancy
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Tenancies"
            value={stats?.platform?.totalTenancies || 0}
            icon={<BusinessIcon />}
            color="primary"
            subtitle={`${stats?.platform?.activeTenancies || 0} active`}
            trend={{
              value: stats?.activity?.last7Days?.tenancyGrowth || 0,
              isPositive: (stats?.activity?.last7Days?.tenancyGrowth || 0) >= 0
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Organizations"
            value={stats?.platform?.totalOrganizations || 0}
            icon={<StorageIcon />}
            color="info"
            subtitle={`${stats?.platform?.activeOrganizations || 0} active`}
            trend={{
              value: stats?.activity?.last7Days?.organizationGrowth || 0,
              isPositive: (stats?.activity?.last7Days?.organizationGrowth || 0) >= 0
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats?.platform?.totalUsers || 0}
            icon={<PeopleIcon />}
            color="success"
            subtitle={`${stats?.platform?.activeUsers || 0} active`}
            trend={{
              value: stats?.activity?.last7Days?.userGrowth || 0,
              isPositive: (stats?.activity?.last7Days?.userGrowth || 0) >= 0
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Platform Utilization"
            value={`${stats?.usage?.platformUtilization || 0}%`}
            icon={<TrendingUpIcon />}
            color="warning"
            subtitle="Overall system usage"
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            searchPlaceholder="Search tenancies..."
            statusOptions={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'pending', label: 'Pending' }
            ]}
          />
        </CardContent>
      </Card>

      {/* Tenancies Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tenancy Management
          </Typography>
          <DataTable
            columns={tenancyColumns}
            rows={tenancies}
            loading={loading}
            pagination={{
              page: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onPageChange: handlePageChange
            }}
            noRowsText="No tenancies found"
          />
        </CardContent>
      </Card>

      {/* Create Tenancy Modal */}
      <CreateTenancyModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTenancy}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenancy"
        message={
          selectedTenancy ? (
            <>
              Are you sure you want to delete tenancy "{selectedTenancy.name}"?
              This action cannot be undone and will delete all associated
              organizations and users.
            </>
          ) : ''
        }
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
};

export default PlatformDashboard;
```

#### **Create Tenancy Modal** (`src/components/admin/platform/CreateTenancyModal.jsx`)

```jsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Typography, Box, Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  name: yup
    .string()
    .required('Tenancy name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  slug: yup
    .string()
    .required('Slug is required')
    .matches(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug cannot exceed 50 characters'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  billingPlan: yup
    .string()
    .oneOf(['free', 'starter', 'professional', 'enterprise'], 'Invalid billing plan'),
  maxOrganizations: yup
    .number()
    .min(1, 'Must allow at least 1 organization')
    .max(100, 'Cannot exceed 100 organizations'),
  maxUsers: yup
    .number()
    .min(1, 'Must allow at least 1 user')
    .max(10000, 'Cannot exceed 10,000 users'),
  adminEmail: yup
    .string()
    .email('Invalid email address')
});

const CreateTenancyModal = ({ open, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      billingPlan: 'free',
      maxOrganizations: 5,
      maxUsers: 100,
      adminEmail: ''
    }
  });

  const nameValue = watch('name');

  // Auto-generate slug from name
  React.useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      setSubmitError(error.message || 'Failed to create tenancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSubmitError('');
      onClose();
    }
  };

  const billingPlanOptions = [
    { value: 'free', label: 'Free', maxOrgs: 2, maxUsers: 50 },
    { value: 'starter', label: 'Starter', maxOrgs: 5, maxUsers: 100 },
    { value: 'professional', label: 'Professional', maxOrgs: 20, maxUsers: 500 },
    { value: 'enterprise', label: 'Enterprise', maxOrgs: 100, maxUsers: 10000 }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Create New Tenancy</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Create a new tenancy to organize multiple organizations
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tenancy Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Slug"
                    error={!!errors.slug}
                    helperText={errors.slug?.message || 'Auto-generated from name'}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    multiline
                    rows={3}
                  />
                )}
              />
            </Grid>

            {/* Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="billingPlan"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.billingPlan}>
                    <InputLabel>Billing Plan</InputLabel>
                    <Select {...field} label="Billing Plan">
                      {billingPlanOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box>
                            <Typography variant="body2">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Up to {option.maxOrgs} orgs, {option.maxUsers} users
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.billingPlan && (
                      <Typography variant="caption" color="error">
                        {errors.billingPlan.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="maxOrganizations"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Max Organizations"
                    type="number"
                    error={!!errors.maxOrganizations}
                    helperText={errors.maxOrganizations?.message}
                    inputProps={{ min: 1, max: 100 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="maxUsers"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Max Users"
                    type="number"
                    error={!!errors.maxUsers}
                    helperText={errors.maxUsers?.message}
                    inputProps={{ min: 1, max: 10000 }}
                  />
                )}
              />
            </Grid>

            {/* Admin Assignment */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Administration
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="adminEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tenancy Admin Email (Optional)"
                    type="email"
                    error={!!errors.adminEmail}
                    helperText={
                      errors.adminEmail?.message ||
                      'Assign an existing user as tenancy admin. Leave empty to assign later.'
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Tenancy'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTenancyModal;
```

#### **Data Table Component** (`src/components/admin/common/DataTable.jsx`)

```jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper,
  Pagination, Box, Typography, CircularProgress,
  Checkbox, IconButton, Menu, MenuItem, Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  ViewColumn as ViewColumnIcon
} from '@mui/icons-material';

const DataTable = ({
  columns,
  rows,
  loading = false,
  pagination,
  selection = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  sortable = true,
  orderBy = '',
  order = 'asc',
  onSort,
  noRowsText = 'No data available',
  dense = false,
  stickyHeader = false,
  maxHeight,
  actions = [],
  onAction
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRowForMenu, setSelectedRowForMenu] = React.useState(null);

  const handleSelectAll = (event) => {
    if (onSelectionChange) {
      if (event.target.checked) {
        onSelectionChange(rows.map(row => row.id));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (event, rowId) => {
    if (onSelectionChange) {
      const selectedIndex = selectedRows.indexOf(rowId);
      let newSelected = [];

      if (selectedIndex === -1) {
        newSelected = [...selectedRows, rowId];
      } else if (selectedIndex === 0) {
        newSelected = selectedRows.slice(1);
      } else if (selectedIndex === selectedRows.length - 1) {
        newSelected = selectedRows.slice(0, -1);
      } else if (selectedIndex > 0) {
        newSelected = [
          ...selectedRows.slice(0, selectedIndex),
          ...selectedRows.slice(selectedIndex + 1)
        ];
      }

      onSelectionChange(newSelected);
    }
  };

  const handleSortRequest = (property) => {
    if (onSort && sortable) {
      const isAsc = orderBy === property && order === 'asc';
      onSort(property, isAsc ? 'desc' : 'asc');
    }
  };

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRowForMenu(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowForMenu(null);
  };

  const handleActionClick = (action, row) => {
    handleMenuClose();
    if (onAction) {
      onAction(action, row);
    }
  };

  const isSelected = (id) => selectedRows.indexOf(id) !== -1;

  if (loading && rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          maxHeight: maxHeight,
          border: 1,
          borderColor: 'divider'
        }}
      >
        <Table
          stickyHeader={stickyHeader}
          size={dense ? 'small' : 'medium'}
        >
          <TableHead>
            <TableRow>
              {selection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedRows.length > 0 && selectedRows.length < rows.length
                    }
                    checked={rows.length > 0 && selectedRows.length === rows.length}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all' }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ width: column.width, minWidth: column.minWidth }}
                  sortDirection={orderBy === column.field ? order : false}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleSortRequest(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" style={{ width: 60 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selection ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : noRowsText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover={!!onRowClick}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    role={selection ? "checkbox" : undefined}
                    aria-checked={selection ? isItemSelected : undefined}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selection && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={(event) => handleSelectRow(event, row.id)}
                          inputProps={{ 'aria-labelledby': labelId }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.field}
                        align={column.align || 'left'}
                      >
                        {column.renderCell ? (
                          column.renderCell({ row, value: row[column.field] })
                        ) : (
                          row[column.field]
                        )}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, row)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </Typography>
          <Pagination
            count={Math.ceil(pagination.total / pagination.pageSize)}
            page={pagination.page}
            onChange={pagination.onPageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.key}
            onClick={() => handleActionClick(action, selectedRowForMenu)}
            disabled={action.disabled}
          >
            {action.icon && (
              <Box component="span" mr={1} display="flex">
                {action.icon}
              </Box>
            )}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default DataTable;
```

### Custom Hooks for State Management

#### **Platform Admin Hook** (`src/hooks/usePlatformAdmin.js`)

```javascript
import { useState, useCallback } from 'react';
import { platformAdminAPI } from '../services/api';
import { useNotification } from './useNotification';

export const usePlatformAdmin = () => {
  const { showNotification } = useNotification();
  const [state, setState] = useState({
    stats: null,
    tenancies: [],
    organizations: [],
    users: [],
    auditLogs: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  });

  const setLoading = useCallback((loading) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error: error?.message || error }));
  }, []);

  // Fetch platform statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.getSystemStats();
      setState(prev => ({ ...prev, stats: response.data.stats }));
    } catch (error) {
      setError(error);
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Fetch tenancies
  const fetchTenancies = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.getTenancies(filters);
      setState(prev => ({
        ...prev,
        tenancies: response.data.tenancies,
        pagination: response.data.pagination
      }));
    } catch (error) {
      setError(error);
      console.error('Failed to fetch tenancies:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Create tenancy
  const createTenancy = useCallback(async (tenancyData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.createTenancy(tenancyData);
      return response.data.tenancy;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Update tenancy
  const updateTenancy = useCallback(async (tenancyId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.updateTenancy(tenancyId, updateData);

      // Update tenancy in local state
      setState(prev => ({
        ...prev,
        tenancies: prev.tenancies.map(tenancy =>
          tenancy.id === tenancyId
            ? { ...tenancy, ...response.data.tenancy }
            : tenancy
        )
      }));

      return response.data.tenancy;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Update tenancy status
  const updateTenancyStatus = useCallback(async (tenancyId, statusData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.updateTenancyStatus(tenancyId, statusData);

      // Update tenancy status in local state
      setState(prev => ({
        ...prev,
        tenancies: prev.tenancies.map(tenancy =>
          tenancy.id === tenancyId
            ? { ...tenancy, status: response.data.tenancy.status }
            : tenancy
        )
      }));

      return response.data.tenancy;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Delete tenancy
  const deleteTenancy = useCallback(async (tenancyId, deleteData) => {
    try {
      setLoading(true);
      setError(null);
      await platformAdminAPI.deleteTenancy(tenancyId, deleteData);

      // Remove tenancy from local state
      setState(prev => ({
        ...prev,
        tenancies: prev.tenancies.filter(tenancy => tenancy.id !== tenancyId)
      }));
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Fetch organizations
  const fetchOrganizations = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.getOrganizations(filters);
      setState(prev => ({
        ...prev,
        organizations: response.data.organizations,
        pagination: response.data.pagination
      }));
    } catch (error) {
      setError(error);
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Create organization
  const createOrganization = useCallback(async (organizationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.createOrganization(organizationData);
      return response.data.organization;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Fetch users
  const fetchUsers = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.getUsers(filters);
      setState(prev => ({
        ...prev,
        users: response.data.users,
        pagination: response.data.pagination
      }));
    } catch (error) {
      setError(error);
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Create user
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.createUser(userData);
      return response.data.user;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformAdminAPI.getGlobalAuditLogs(filters);
      setState(prev => ({
        ...prev,
        auditLogs: response.data.auditLogs,
        pagination: response.data.pagination
      }));
    } catch (error) {
      setError(error);
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    actions: {
      fetchStats,
      fetchTenancies,
      createTenancy,
      updateTenancy,
      updateTenancyStatus,
      deleteTenancy,
      fetchOrganizations,
      createOrganization,
      fetchUsers,
      createUser,
      fetchAuditLogs
    }
  };
};
```