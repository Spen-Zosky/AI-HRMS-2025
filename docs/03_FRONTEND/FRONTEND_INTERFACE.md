# Frontend Interface - AI-HRMS-2025

## Overview

The AI-HRMS-2025 frontend is built with React 19+ and Material-UI, providing a modern, responsive interface for human resource management with AI-powered features.

## Technology Stack

### Core Technologies
- **React 19.1.1**: Modern React with latest features
- **Material-UI 7.3.2**: Component library and design system
- **React Router 7.9.1**: Client-side routing
- **React Hook Form 7.62.0**: Form state management
- **Emotion**: CSS-in-JS styling solution

### Internationalization (i18n)
- **i18next 24.0.5**: Internationalization framework
- **react-i18next 16.1.0**: React bindings for i18next
- **i18next-browser-languagedetector 8.0.2**: Browser language detection
- **i18next-http-backend 3.0.2**: HTTP backend for loading translations

**Supported Languages:**
- 🇮🇹 **Italian** (it.json) - 168 lines, most complete
- 🇫🇷 **French** (fr.json) - 105 lines
- 🇩🇪 **German** (de.json) - 105 lines
- 🇪🇸 **Spanish** (es.json) - 105 lines

**Translation Coverage:**
- Authentication flows
- Navigation and menu items
- Common UI elements and actions
- Dashboard statistics
- API error messages
- Form validation messages
- Employee management (Italian only)
- Leave management (Italian only)
- ATS system (Italian only)
- Skills management (Italian only)
- HR Copilot interface (Italian only)

### Build Tools
- **Webpack 5.101.3**: Module bundler
- **Babel**: JavaScript transpilation
- **CSS Loader**: CSS processing

## Component Architecture

### Application Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── forms/
│   │   ├── EmployeeForm.jsx
│   │   ├── LoginForm.jsx
│   │   └── OrganizationForm.jsx
│   ├── tables/
│   │   ├── EmployeeTable.jsx
│   │   ├── DataGrid.jsx
│   │   └── FilterPanel.jsx
│   └── charts/
│       ├── DashboardChart.jsx
│       ├── PerformanceChart.jsx
│       └── AnalyticsChart.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Employees.jsx
│   ├── Organizations.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useLocalStorage.js
├── context/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── OrganizationContext.js
└── utils/
    ├── api.js
    ├── validation.js
    └── helpers.js
```

## Key Components

### Authentication System
```jsx
// components/auth/LoginForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const LoginForm = ({ onLogin, error }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    await onLogin(data);
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        AI-HRMS Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          {...register('email')}
          fullWidth
          label="Email"
          type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          margin="normal"
        />

        <TextField
          {...register('password')}
          fullWidth
          label="Password"
          type="password"
          error={!!errors.password}
          helperText={errors.password?.message}
          margin="normal"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </Box>
    </Card>
  );
};

export default LoginForm;
```

### Employee Management Interface
```jsx
// pages/Employees.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useApi } from '../hooks/useApi';
import EmployeeForm from '../components/forms/EmployeeForm';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const { apiCall } = useApi();

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'firstName', headerName: 'First Name', width: 150 },
    { field: 'lastName', headerName: 'Last Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'position', headerName: 'Position', width: 180 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'hireDate', headerName: 'Hire Date', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Button size="small" onClick={() => handleEdit(params.row)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            Delete
          </Button>
        </Box>
      )
    }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    // Open edit form with employee data
    setOpenForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await apiCall(`/api/employees/${employeeId}`, { method: 'DELETE' });
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName} ${employee.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1">
              Employee Management
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <TextField
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenForm(true)}
              >
                Add Employee
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, height: 600 }}>
          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            loading={loading}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            checkboxSelection
            disableSelectionOnClick
          />
        </Paper>

        <EmployeeForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSuccess={fetchEmployees}
        />
      </Box>
    </Container>
  );
};

export default Employees;
```

## State Management

### Context Providers
```jsx
// context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    if (state.token) {
      // Verify token and get user info
      verifyToken();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyToken = async () => {
    try {
      // API call to verify token
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${state.token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: userData, token: state.token }
        });
      } else {
        logout();
      }
    } catch (error) {
      logout();
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: data.user, token: data.token }
        });
        return { success: true };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Theme and Styling

### Material-UI Theme Configuration
```jsx
// theme/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }
    }
  }
});
```

## API Integration

### Custom Hooks for API Calls
```jsx
// hooks/useApi.js
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const apiCall = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { apiCall, loading, error };
};
```

## Performance Optimization

### Code Splitting and Lazy Loading
```jsx
// App.js with lazy loading
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Organizations = React.lazy(() => import('./pages/Organizations'));

const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/organizations" element={<Organizations />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
```

This frontend architecture provides a modern, scalable React application with Material-UI components, proper state management, and optimized performance for the AI-HRMS-2025 system.