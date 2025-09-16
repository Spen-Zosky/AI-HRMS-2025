import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Tab,
  Tabs,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, register, error, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tabValue === 0) {
      // Login
      await login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      // Register
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom fontWeight={600} color="primary">
          AI-HRMS 2025
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Advanced Human Resource Management System
        </Typography>

        <Card sx={{ width: '100%', mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {tabValue === 1 && (
                <>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                </>
              )}

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              {tabValue === 1 && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  tabValue === 0 ? 'Login' : 'Register'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Powered by AI • Secure • Scalable
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;