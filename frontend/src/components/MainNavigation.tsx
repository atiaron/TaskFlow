import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge
} from '@mui/material';
import {
  List as ListIcon,
  Chat as ChatIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface MainNavigationProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  unreadMessages?: number;
}

const MainNavigation: React.FC<MainNavigationProps> = ({
  value,
  onChange,
  unreadMessages = 0
}) => {
  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={onChange}
        showLabels
        sx={{
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            paddingTop: 1,
          },
        }}
      >
        <BottomNavigationAction
          label="Tasks"
          icon={<ListIcon />}
          sx={{
            color: value === 0 ? 'primary.main' : 'text.secondary',
          }}
        />
        <BottomNavigationAction
          label="Chat"
          icon={
            <Badge
              badgeContent={unreadMessages}
              color="error"
              variant="dot"
              invisible={unreadMessages === 0}
            >
              <ChatIcon />
            </Badge>
          }
          sx={{
            color: value === 1 ? 'primary.main' : 'text.secondary',
          }}
        />
        <BottomNavigationAction
          label="Calendar"
          icon={<CalendarIcon />}
          sx={{
            color: value === 2 ? 'primary.main' : 'text.secondary',
          }}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
          sx={{
            color: value === 3 ? 'primary.main' : 'text.secondary',
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MainNavigation;