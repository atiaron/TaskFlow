/* cspell:disable */
import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Avatar } from '@mui/material';
import { 
  Task as TaskIcon, 
  Chat as ChatIcon, 
  CalendarMonth as CalendarIcon, 
  History as SessionsIcon,
  Logout as LogoutIcon 
} from '@mui/icons-material';
import { User } from '../types';
import { AuthService } from '../services/AuthService';

interface MainNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: User;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ currentTab, onTabChange, user }) => {
  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderRadius: 0,
        borderTop: '1px solid #F1F3F4',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        bgcolor: 'background.paper'
      }} 
      elevation={0}
    >
      <BottomNavigation 
        value={currentTab} 
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main'
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 500,
              mt: 0.5
            }
          }
        }}
      >
        <BottomNavigationAction 
          label="משימות" 
          value="tasks" 
          icon={<TaskIcon sx={{ fontSize: 24 }} />} 
        />
        <BottomNavigationAction 
          label="צ'אט" 
          value="chat" 
          icon={<ChatIcon sx={{ fontSize: 24 }} />} 
        />
        <BottomNavigationAction 
          label="סשנים" 
          value="sessions" 
          icon={<SessionsIcon sx={{ fontSize: 24 }} />} 
        />
        <BottomNavigationAction 
          label="לוח שנה" 
          value="calendar" 
          icon={<CalendarIcon sx={{ fontSize: 24 }} />} 
        />
        <BottomNavigationAction
          label="פרופיל"
          value="profile"
          icon={
            <Avatar 
              src={user.picture} 
              sx={{ 
                width: 28, 
                height: 28,
                border: currentTab === 'profile' ? '2px solid' : 'none',
                borderColor: 'primary.main'
              }} 
            />
          }
          onClick={handleSignOut}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MainNavigation;