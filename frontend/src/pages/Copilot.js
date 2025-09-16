import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Lightbulb,
  Assessment,
  Description,
  AutoAwesome,
} from '@mui/icons-material';
import { copilotAPI } from '../services/api';

const Copilot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your HR Copilot. I can help you with employee management, analytics, policy questions, and more. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickActions = [
    { label: 'Employee Summary', icon: <Person />, action: 'Generate an employee summary report' },
    { label: 'Leave Analytics', icon: <Assessment />, action: 'Show leave request analytics for this month' },
    { label: 'Skills Report', icon: <Lightbulb />, action: 'Create a skills gap analysis report' },
    { label: 'Policy Help', icon: <Description />, action: 'Help me understand company policies' },
  ];

  const suggestions = [
    'How many employees are currently on leave?',
    'What are the top skills gaps in our organization?',
    'Generate a recruitment analytics report',
    'What is our employee retention rate?',
    'Show me pending leave requests',
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Mock response for demonstration
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: generateMockResponse(message),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, 1000);

      // In real implementation, uncomment this:
      // const response = await copilotAPI.chat(message);
      // const botResponse = {
      //   id: Date.now() + 1,
      //   type: 'bot',
      //   content: response.data.message,
      //   timestamp: new Date(),
      // };
      // setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('leave') || lowerMessage.includes('vacation')) {
      return 'Based on current data, you have 12 pending leave requests and 23 approved leave requests this month. The most common leave type is Annual Leave (60%), followed by Sick Leave (25%). Would you like me to generate a detailed leave analytics report?';
    }

    if (lowerMessage.includes('skills') || lowerMessage.includes('gap')) {
      return 'Our skills gap analysis shows the top 3 areas requiring attention: 1) Machine Learning (45 employees, 25% proficiency), 2) Cloud Architecture (38 employees, 60% proficiency), 3) Data Science (33 employees, 40% proficiency). I recommend prioritizing Machine Learning training programs.';
    }

    if (lowerMessage.includes('employee') || lowerMessage.includes('staff')) {
      return 'You currently have 247 active employees across 5 departments. This month you hired 12 new employees and have 8 open positions. Employee satisfaction rate is 87% based on recent surveys. Would you like specific department breakdowns?';
    }

    if (lowerMessage.includes('report') || lowerMessage.includes('analytics')) {
      return 'I can generate various reports for you: Employee Performance Reports, Leave Analytics, Skills Gap Analysis, Recruitment Metrics, or Custom Reports. Which type would you prefer? I can also schedule these reports to be generated automatically.';
    }

    return 'I understand you\'re asking about ' + message + '. Based on the current HR data, I can help you with employee management, leave tracking, skills analysis, and generating reports. Could you be more specific about what information you\'re looking for?';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        HR Copilot
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Your AI-powered HR assistant for insights, analytics, and support
      </Typography>

      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      maxWidth: '70%',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.type === 'user' ? '#1976d2' : '#f0f0f0',
                        color: message.type === 'user' ? 'white' : '#666',
                        mx: 1,
                        width: 32,
                        height: 32,
                      }}
                    >
                      {message.type === 'user' ? <Person /> : <SmartToy />}
                    </Avatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        backgroundColor: message.type === 'user' ? '#e3f2fd' : '#f8f9fa',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#f0f0f0', color: '#666', mx: 1, width: 32, height: 32 }}>
                      <SmartToy />
                    </Avatar>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Typography variant="body1">Thinking...</Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Ask me anything about HR, employees, analytics..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <IconButton
                  color="primary"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome color="primary" />
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => handleSendMessage(action.action)}
                      sx={{ justifyContent: 'flex-start' }}
                      disabled={loading}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Suggestions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {suggestions.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      variant="outlined"
                      onClick={() => handleSendMessage(suggestion)}
                      sx={{ justifyContent: 'flex-start', height: 'auto', py: 1, px: 2 }}
                      disabled={loading}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What I Can Help With
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Employee data and analytics
                  <br />
                  • Leave management insights
                  <br />
                  • Skills gap analysis
                  <br />
                  • Recruitment metrics
                  <br />
                  • Policy questions
                  <br />
                  • Report generation
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Copilot;