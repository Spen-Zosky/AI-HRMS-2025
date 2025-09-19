## 🎨 User Interface Design

### Design System & Visual Guidelines

#### **Material Design Implementation** (`src/styles/theme.js`)

```javascript
import { createTheme } from '@mui/material/styles';

// Authority-based color palette
const authorityColors = {
  sysadmin: {
    primary: '#d32f2f',    // Red
    secondary: '#f57c00',  // Orange
    background: '#ffebee'
  },
  tenancy: {
    primary: '#1976d2',    // Blue
    secondary: '#0277bd',  // Light Blue
    background: '#e3f2fd'
  },
  organization: {
    primary: '#388e3c',    // Green
    secondary: '#689f38',  // Light Green
    background: '#e8f5e8'
  },
  user: {
    primary: '#7b1fa2',    // Purple
    secondary: '#8e24aa',  // Light Purple
    background: '#f3e5f5'
  }
};

// Create dynamic theme based on user authority
export const createHierarchyTheme = (userAuthority = 'user', mode = 'light') => {
  const colors = authorityColors[userAuthority] || authorityColors.user;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: mode === 'light' ? colors.secondary : colors.primary,
        dark: colors.primary,
        contrastText: '#ffffff'
      },
      secondary: {
        main: colors.secondary,
        light: colors.background,
        dark: colors.secondary
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        hierarchy: colors.background
      },
      text: {
        primary: mode === 'light' ? '#212121' : '#ffffff',
        secondary: mode === 'light' ? '#757575' : '#aaaaaa'
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      // Custom authority indicators
      authority: {
        sysadmin: authorityColors.sysadmin.primary,
        tenancy: authorityColors.tenancy.primary,
        organization: authorityColors.organization.primary,
        user: authorityColors.user.primary
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 300,
        lineHeight: 1.2
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 300,
        lineHeight: 1.3
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 400,
        lineHeight: 1.4
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.6
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.75
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.57
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.43
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 2.66,
        textTransform: 'uppercase'
      }
    },
    spacing: 8, // 8px base spacing unit
    shape: {
      borderRadius: 8
    },
    components: {
      // Global component overrides
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box'
          },
          html: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          },
          body: {
            backgroundColor: mode === 'light' ? '#fafafa' : '#121212'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0px 2px 4px rgba(0, 0, 0, 0.1)'
              : '0px 2px 4px rgba(0, 0, 0, 0.3)',
            borderRadius: 12
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          elevation1: {
            boxShadow: mode === 'light'
              ? '0px 2px 4px rgba(0, 0, 0, 0.1)'
              : '0px 2px 4px rgba(0, 0, 0, 0.3)'
          }
        }
      }
    }
  });
};

// Authority-specific theme variations
export const sysAdminTheme = createHierarchyTheme('sysadmin');
export const tenancyAdminTheme = createHierarchyTheme('tenancy');
export const organizationAdminTheme = createHierarchyTheme('organization');
export const userTheme = createHierarchyTheme('user');
```

#### **Authority Indicator Component** (`src/components/common/AuthorityIndicator.jsx`)

```jsx
import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';
import {
  AdminPanelSettings as SysAdminIcon,
  Business as TenancyIcon,
  Domain as OrganizationIcon,
  Person as UserIcon,
  Group as BoardIcon
} from '@mui/icons-material';

const AuthorityIndicator = ({
  authority,
  variant = 'chip',
  size = 'medium',
  showIcon = true,
  showText = true,
  tooltip = true
}) => {
  const authorityConfig = {
    sysadmin: {
      label: 'Platform Admin',
      color: 'error',
      icon: <SysAdminIcon />,
      description: 'Full platform administration access'
    },
    tenancy_admin: {
      label: 'Tenancy Admin',
      color: 'primary',
      icon: <TenancyIcon />,
      description: 'Tenancy-level administration access'
    },
    tenancy_manager: {
      label: 'Tenancy Manager',
      color: 'primary',
      icon: <TenancyIcon />,
      description: 'Tenancy management access'
    },
    ceo: {
      label: 'CEO',
      color: 'success',
      icon: <OrganizationIcon />,
      description: 'Chief Executive Officer'
    },
    hr_manager: {
      label: 'HR Manager',
      color: 'success',
      icon: <OrganizationIcon />,
      description: 'Human Resources Manager'
    },
    board_member: {
      label: 'Board Member',
      color: 'info',
      icon: <BoardIcon />,
      description: 'Organization Board Member'
    },
    advisor: {
      label: 'Advisor',
      color: 'info',
      icon: <BoardIcon />,
      description: 'Organization Advisor'
    },
    manager: {
      label: 'Manager',
      color: 'default',
      icon: <UserIcon />,
      description: 'Department Manager'
    },
    supervisor: {
      label: 'Supervisor',
      color: 'default',
      icon: <UserIcon />,
      description: 'Team Supervisor'
    },
    employee: {
      label: 'Employee',
      color: 'default',
      icon: <UserIcon />,
      description: 'Standard Employee'
    }
  };

  const config = authorityConfig[authority] || authorityConfig.employee;

  const renderContent = () => {
    if (variant === 'chip') {
      return (
        <Chip
          icon={showIcon ? config.icon : undefined}
          label={showText ? config.label : ''}
          color={config.color}
          size={size}
          variant="outlined"
        />
      );
    }

    if (variant === 'badge') {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            backgroundColor: `${config.color}.light`,
            color: `${config.color}.dark`,
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          {showIcon && React.cloneElement(config.icon, { fontSize: 'small' })}
          {showText && config.label}
        </Box>
      );
    }

    if (variant === 'text') {
      return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {showIcon && React.cloneElement(config.icon, {
            fontSize: size === 'small' ? 'small' : 'medium',
            color: config.color === 'default' ? 'inherit' : config.color
          })}
          {showText && (
            <Typography variant={size === 'small' ? 'caption' : 'body2'}>
              {config.label}
            </Typography>
          )}
        </Box>
      );
    }

    return null;
  };

  const content = renderContent();

  if (tooltip) {
    return (
      <Tooltip title={config.description} arrow>
        <span>{content}</span>
      </Tooltip>
    );
  }

  return content;
};

export default AuthorityIndicator;
```

#### **Hierarchy Breadcrumb Component** (`src/components/common/HierarchyBreadcrumb.jsx`)

```jsx
import React from 'react';
import { Breadcrumbs, Link, Typography, Box, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  AdminPanelSettings as PlatformIcon,
  Business as TenancyIcon,
  Domain as OrganizationIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const HierarchyBreadcrumb = ({ customItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Parse current path to determine hierarchy context
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const generateBreadcrumbItems = () => {
    const items = [];

    // Home/Dashboard
    items.push({
      label: 'Dashboard',
      icon: <HomeIcon fontSize="small" />,
      href: '/dashboard',
      color: 'inherit'
    });

    // Admin section
    if (pathSegments.includes('admin')) {
      if (user?.isSysAdmin && pathSegments.includes('platform')) {
        items.push({
          label: 'Platform Administration',
          icon: <PlatformIcon fontSize="small" />,
          href: '/admin/platform',
          color: 'error'
        });

        // Platform sub-sections
        if (pathSegments.includes('tenancies')) {
          items.push({
            label: 'Tenancies',
            href: '/admin/platform/tenancies',
            color: 'primary'
          });

          // Specific tenancy
          const tenancyIndex = pathSegments.indexOf('tenancies') + 1;
          if (pathSegments[tenancyIndex] && pathSegments[tenancyIndex] !== 'create') {
            // Fetch tenancy name (would come from context/state)
            items.push({
              label: 'Demo Tenancy', // This would be dynamic
              href: `/admin/platform/tenancies/${pathSegments[tenancyIndex]}`,
              color: 'primary'
            });
          }
        }

        if (pathSegments.includes('organizations')) {
          items.push({
            label: 'Organizations',
            href: '/admin/platform/organizations',
            color: 'success'
          });
        }

        if (pathSegments.includes('users')) {
          items.push({
            label: 'Users',
            href: '/admin/platform/users',
            color: 'info'
          });
        }
      }

      // Tenancy admin section
      if (pathSegments.includes('tenant')) {
        const tenantIndex = pathSegments.indexOf('tenant') + 1;
        const tenantId = pathSegments[tenantIndex];

        items.push({
          label: 'Tenancy Administration',
          icon: <TenancyIcon fontSize="small" />,
          href: `/admin/tenant/${tenantId}`,
          color: 'primary'
        });

        if (pathSegments.includes('organizations')) {
          items.push({
            label: 'Organizations',
            href: `/admin/tenant/${tenantId}/organizations`,
            color: 'success'
          });
        }

        if (pathSegments.includes('users')) {
          items.push({
            label: 'Users',
            href: `/admin/tenant/${tenantId}/users`,
            color: 'info'
          });
        }
      }

      // Organization admin section
      if (pathSegments.includes('organization')) {
        const orgIndex = pathSegments.indexOf('organization') + 1;
        const orgId = pathSegments[orgIndex];

        items.push({
          label: 'Organization Administration',
          icon: <OrganizationIcon fontSize="small" />,
          href: `/admin/organization/${orgId}`,
          color: 'success'
        });

        if (pathSegments.includes('users')) {
          items.push({
            label: 'Employees',
            href: `/admin/organization/${orgId}/users`,
            color: 'info'
          });
        }

        if (pathSegments.includes('departments')) {
          items.push({
            label: 'Departments',
            href: `/admin/organization/${orgId}/departments`,
            color: 'warning'
          });
        }

        if (pathSegments.includes('hr')) {
          items.push({
            label: 'HR Management',
            href: `/admin/organization/${orgId}/hr`,
            color: 'secondary'
          });
        }
      }
    }

    // Merge with custom items
    return [...items, ...customItems];
  };

  const breadcrumbItems = generateBreadcrumbItems();

  const handleBreadcrumbClick = (href) => (event) => {
    event.preventDefault();
    navigate(href);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="hierarchy breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          if (isLast) {
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.icon}
                <Typography color="text.primary" fontWeight="medium">
                  {item.label}
                </Typography>
                {item.color !== 'inherit' && (
                  <Chip
                    size="small"
                    color={item.color}
                    variant="outlined"
                    sx={{ ml: 0.5, height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            );
          }

          return (
            <Link
              key={index}
              color="inherit"
              href={item.href}
              onClick={handleBreadcrumbClick(item.href)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default HierarchyBreadcrumb;
```

### Admin Layout Components

#### **Admin Layout with Hierarchy** (`src/components/admin/common/AdminLayout.jsx`)

```jsx
import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  Avatar, Menu, MenuItem, Badge, Divider, useTheme,
  useMediaQuery, CssBaseline, Alert, Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import AdminSidebar from './AdminSidebar';
import HierarchyBreadcrumb from '../../common/HierarchyBreadcrumb';
import AuthorityIndicator from '../../common/AuthorityIndicator';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';

const DRAWER_WIDTH = 280;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { notifications, clearNotification } = useNotification();

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleAccountMenuClose();
    await logout();
  };

  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotificationOpen(false);
  };

  // Show notifications
  React.useEffect(() => {
    if (notifications.length > 0) {
      setNotificationOpen(true);
    }
  }, [notifications]);

  const currentNotification = notifications[0];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider'
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ mr: 2 }}>
              AI-HRMS Admin
            </Typography>

            {user && (
              <AuthorityIndicator
                authority={user.primaryAuthority}
                variant="chip"
                size="small"
                tooltip={true}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* User Account */}
            <IconButton
              color="inherit"
              onClick={handleAccountMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: `authority.${user?.primaryAuthority || 'user'}`
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Account Menu */}
      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={handleAccountMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleAccountMenuClose}>
          <AccountIcon sx={{ mr: 1 }} fontSize="small" />
          Profile
        </MenuItem>
        <MenuItem onClick={handleAccountMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider'
          }
        }}
        ModalProps={{
          keepMounted: true // Better mobile performance
        }}
      >
        <AdminSidebar onClose={isMobile ? handleDrawerToggle : undefined} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for AppBar height
          ml: drawerOpen && !isMobile ? 0 : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          })
        }}
      >
        <HierarchyBreadcrumb />
        {children}
      </Box>

      {/* Notification Snackbar */}
      {currentNotification && (
        <Snackbar
          open={notificationOpen}
          autoHideDuration={6000}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={currentNotification.type}
            sx={{ width: '100%' }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  clearNotification(currentNotification.id);
                  setNotificationOpen(false);
                }}
              >
                ×
              </IconButton>
            }
          >
            {currentNotification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default AdminLayout;
```

#### **Admin Sidebar with Hierarchy Navigation** (`src/components/admin/common/AdminSidebar.jsx`)

```jsx
import React from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, Divider, Collapse,
  Chip, Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AdminPanelSettings as PlatformIcon,
  Business as TenancyIcon,
  Domain as OrganizationIcon,
  People as UsersIcon,
  Assessment as ReportsIcon,
  Security as AuditIcon,
  Settings as SettingsIcon,
  Storage as DatabaseIcon,
  Backup as BackupIcon,
  ExpandLess,
  ExpandMore,
  Group as BoardIcon,
  Work as DepartmentIcon,
  PersonAdd as HRIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const AdminSidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [expandedSections, setExpandedSections] = React.useState({
    platform: true,
    tenancy: true,
    organization: true
  });

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Platform Admin Navigation
  const platformNavItems = [
    {
      label: 'Platform Overview',
      icon: <DashboardIcon />,
      path: '/admin/platform',
      badge: null
    },
    {
      label: 'Tenancies',
      icon: <TenancyIcon />,
      path: '/admin/platform/tenancies',
      badge: null
    },
    {
      label: 'Organizations',
      icon: <OrganizationIcon />,
      path: '/admin/platform/organizations',
      badge: null
    },
    {
      label: 'Users',
      icon: <UsersIcon />,
      path: '/admin/platform/users',
      badge: null
    },
    {
      label: 'System Audit',
      icon: <AuditIcon />,
      path: '/admin/platform/audit',
      badge: null
    },
    {
      label: 'System Settings',
      icon: <SettingsIcon />,
      path: '/admin/platform/settings',
      badge: null
    },
    {
      label: 'Database',
      icon: <DatabaseIcon />,
      path: '/admin/platform/database',
      badge: null
    },
    {
      label: 'Backups',
      icon: <BackupIcon />,
      path: '/admin/platform/backups',
      badge: null
    }
  ];

  // Tenancy Admin Navigation
  const tenancyNavItems = [
    {
      label: 'Tenancy Overview',
      icon: <DashboardIcon />,
      path: `/admin/tenant/${user?.tenantId}`,
      badge: null
    },
    {
      label: 'Organizations',
      icon: <OrganizationIcon />,
      path: `/admin/tenant/${user?.tenantId}/organizations`,
      badge: null
    },
    {
      label: 'Board Members',
      icon: <BoardIcon />,
      path: `/admin/tenant/${user?.tenantId}/board-members`,
      badge: null
    },
    {
      label: 'Users Overview',
      icon: <UsersIcon />,
      path: `/admin/tenant/${user?.tenantId}/users`,
      badge: null
    },
    {
      label: 'Reports',
      icon: <ReportsIcon />,
      path: `/admin/tenant/${user?.tenantId}/reports`,
      badge: null
    },
    {
      label: 'Audit Logs',
      icon: <AuditIcon />,
      path: `/admin/tenant/${user?.tenantId}/audit`,
      badge: null
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      path: `/admin/tenant/${user?.tenantId}/settings`,
      badge: null
    }
  ];

  // Organization Admin Navigation
  const organizationNavItems = [
    {
      label: 'Organization Overview',
      icon: <DashboardIcon />,
      path: `/admin/organization/${user?.organizationId}`,
      badge: null
    },
    {
      label: 'Employees',
      icon: <UsersIcon />,
      path: `/admin/organization/${user?.organizationId}/users`,
      badge: null
    },
    {
      label: 'Board Members',
      icon: <BoardIcon />,
      path: `/admin/organization/${user?.organizationId}/board-members`,
      badge: null
    },
    {
      label: 'Departments',
      icon: <DepartmentIcon />,
      path: `/admin/organization/${user?.organizationId}/departments`,
      badge: null
    },
    {
      label: 'HR Management',
      icon: <HRIcon />,
      path: `/admin/organization/${user?.organizationId}/hr`,
      badge: null
    },
    {
      label: 'Reports',
      icon: <ReportsIcon />,
      path: `/admin/organization/${user?.organizationId}/reports`,
      badge: null
    },
    {
      label: 'Audit Logs',
      icon: <AuditIcon />,
      path: `/admin/organization/${user?.organizationId}/audit`,
      badge: null
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      path: `/admin/organization/${user?.organizationId}/settings`,
      badge: null
    }
  ];

  const renderNavItem = (item, level = 0) => (
    <ListItem key={item.path} disablePadding>
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        selected={isActive(item.path)}
        sx={{
          pl: 2 + level * 2,
          '&.Mui-selected': {
            backgroundColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.light'
            }
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: level > 0 ? '0.875rem' : '1rem'
          }}
        />
        {item.badge && (
          <Badge badgeContent={item.badge} color="error" />
        )}
      </ListItemButton>
    </ListItem>
  );

  const renderSection = (title, items, sectionKey, color = 'primary') => (
    <Box key={sectionKey}>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleSectionToggle(sectionKey)}>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {title}
                </Typography>
                <Chip
                  size="small"
                  color={color}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>
            }
          />
          {expandedSections[sectionKey] ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>
      <Collapse in={expandedSections[sectionKey]} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items.map(item => renderNavItem(item, 1))}
        </List>
      </Collapse>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Administration
        </Typography>
      </Toolbar>

      <Divider />

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {/* Platform Admin Section */}
          {user?.isSysAdmin &&
            renderSection('Platform Administration', platformNavItems, 'platform', 'error')
          }

          {/* Tenancy Admin Section */}
          {(user?.isSysAdmin || user?.isTenantAdmin) && (
            <>
              {user?.isSysAdmin && <Divider sx={{ my: 1 }} />}
              {renderSection('Tenancy Administration', tenancyNavItems, 'tenancy', 'primary')}
            </>
          )}

          {/* Organization Admin Section */}
          {(user?.isSysAdmin || user?.isTenantAdmin || user?.isOrgAdmin) && (
            <>
              {(user?.isSysAdmin || user?.isTenantAdmin) && <Divider sx={{ my: 1 }} />}
              {renderSection('Organization Administration', organizationNavItems, 'organization', 'success')}
            </>
          )}
        </List>
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          AI-HRMS v1.3.0
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {user?.primaryAuthority?.toUpperCase()} ACCESS
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminSidebar;
```

### Form Components

#### **Dynamic Form Builder** (`src/components/common/forms/DynamicForm.jsx`)

```jsx
import React from 'react';
import {
  Box, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, FormHelperText, Switch,
  FormControlLabel, Autocomplete, Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const DynamicForm = ({
  schema,
  validationSchema,
  onSubmit,
  defaultValues = {},
  loading = false,
  children
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
    defaultValues
  });

  const renderField = (field) => {
    const { name, type, label, required, options = [], props = {} } = field;

    const baseProps = {
      fullWidth: true,
      margin: 'normal',
      error: !!errors[name],
      helperText: errors[name]?.message,
      disabled: loading,
      ...props
    };

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                {...baseProps}
                label={label}
                type={type}
                required={required}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                {...baseProps}
                label={label}
                multiline
                rows={props.rows || 4}
                required={required}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <FormControl {...baseProps} required={required}>
                <InputLabel>{label}</InputLabel>
                <Select {...fieldProps} label={label}>
                  {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors[name] && (
                  <FormHelperText>{errors[name].message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        );

      case 'autocomplete':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <Autocomplete
                {...fieldProps}
                options={options}
                getOptionLabel={(option) => option.label || option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...baseProps}
                    label={label}
                    required={required}
                  />
                )}
                onChange={(_, value) => fieldProps.onChange(value)}
              />
            )}
          />
        );

      case 'multiselect':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <Autocomplete
                {...fieldProps}
                multiple
                options={options}
                getOptionLabel={(option) => option.label || option}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label || option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...baseProps}
                    label={label}
                    required={required}
                  />
                )}
                onChange={(_, value) => fieldProps.onChange(value)}
              />
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <DatePicker
                {...fieldProps}
                label={label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...baseProps}
                    required={required}
                  />
                )}
              />
            )}
          />
        );

      case 'switch':
        return (
          <Controller
            name={name}
            control={control}
            render={({ field: fieldProps }) => (
              <FormControlLabel
                control={
                  <Switch
                    {...fieldProps}
                    checked={fieldProps.value || false}
                    disabled={loading}
                  />
                }
                label={label}
              />
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        {schema.map((field) => (
          <Grid item xs={12} md={field.gridSize || 6} key={field.name}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
      {children}
    </Box>
  );
};

export default DynamicForm;
```