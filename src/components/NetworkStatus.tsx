import React from 'react';
import { Alert, Snackbar, Box, Typography } from '@mui/material';
import { WifiOff as OfflineIcon, Wifi as OnlineIcon } from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

const NetworkStatus: React.FC = () => {
  const { isOnline } = usePWA();
  const [showOfflineAlert, setShowOfflineAlert] = React.useState(false);
  const [justWentOnline, setJustWentOnline] = React.useState(false);
  const [previousOnlineState, setPreviousOnlineState] = React.useState(isOnline);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      setJustWentOnline(false);
    } else {
      setShowOfflineAlert(false);
      // אם זה עתה חזרנו online
      if (!previousOnlineState && isOnline) {
        setJustWentOnline(true);
        setTimeout(() => setJustWentOnline(false), 3000);
      }
    }
    setPreviousOnlineState(isOnline);
  }, [isOnline, previousOnlineState]);

  return (
    <>
      {/* סטטוס offline קבוע */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
            color: 'white',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            zIndex: 1400,
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <OfflineIcon fontSize="small" />
          <Typography variant="body2">
            אופליין - הנתונים יסונכרנו כשהאינטרנט יחזור
          </Typography>
        </Box>
      )}

      {/* הודעה על חזרה online */}
      <Snackbar
        open={justWentOnline}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          icon={<OnlineIcon />}
          sx={{ width: '100%' }}
        >
          🌐 חזרת אונליין! הנתונים מסונכרנים
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkStatus;
