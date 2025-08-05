import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Badge
} from '@mui/material';
import {
  Assignment as TasksIcon,
  Chat as ChatIcon,
  Event as CalendarIcon,
  SentimentVerySatisfied as JokesIcon
} from '@mui/icons-material';
import { User } from '../types';

interface MainNavigationProps {
  currentTab: string;
  onTabChange: (value: string) => void;
  user: User;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ 
  currentTab, 
  onTabChange, 
  user 
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onTabChange(newValue);
  };

  const navigationItems = [
    {
      label: 'משימות',
      value: 'tasks',
      icon: <TasksIcon />
    },
    {
      label: 'צ\'אט',
      value: 'chat', 
      icon: <ChatIcon />
    },
    {
      label: 'יומן',
      value: 'calendar',
      icon: <CalendarIcon />
    },
    {
      label: 'בדיחות',
      value: 'jokes',
      icon: <JokesIcon />
    }
  ];

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}
      elevation={3}
    >
      <BottomNavigation 
        value={currentTab} 
        onChange={handleChange}
        sx={{
          borderRadius: '16px 16px 0 0',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
          }
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {item.icon}
              </Box>
            }
            sx={{
              '& .MuiBottomNavigationAction-wrapper': {
                flexDirection: 'column'
              }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MainNavigation;