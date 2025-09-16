import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  CalendarToday,
  Work,
  Psychology,
  ChatBubble,
} from '@mui/icons-material';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Employees', icon: <People />, path: '/employees' },
  { text: 'Leave Management', icon: <CalendarToday />, path: '/leave' },
  { text: 'ATS', icon: <Work />, path: '/ats' },
  { text: 'Skills Management', icon: <Psychology />, path: '/skills' },
  { text: 'HR Copilot', icon: <ChatBubble />, path: '/copilot' },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const drawerWidth = 240;

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
          mt: 8, // Account for navbar height
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          Navigation
        </Typography>
      </Box>
      <Divider />

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleItemClick(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? 'white' : '#666',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? 600 : 400,
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;