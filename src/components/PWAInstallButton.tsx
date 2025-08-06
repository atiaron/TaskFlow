import React from 'react';
import { Button, Snackbar, Alert, Box, Typography } from '@mui/material';
import { InstallMobile as InstallIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, showInstallPrompt, installationResult } = usePWA();
  const [showResult, setShowResult] = React.useState(false);

  React.useEffect(() => {
    if (installationResult) {
      setShowResult(true);
    }
  }, [installationResult]);

  const handleInstall = async () => {
    await showInstallPrompt();
  };

  if (isInstalled) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CheckIcon color="success" />
        <Typography variant="body2" color="success.main">
          האפליקציה מותקנת
        </Typography>
      </Box>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<InstallIcon />}
        onClick={handleInstall}
        sx={{
          background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
          boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
          color: 'white',
          fontWeight: 600,
          '&:hover': {
            background: 'linear-gradient(45deg, #FF5252 30%, #26C6DA 90%)',
          }
        }}
      >
        התקן כאפליקציה
      </Button>

      <Snackbar
        open={showResult}
        autoHideDuration={4000}
        onClose={() => setShowResult(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowResult(false)} 
          severity={installationResult === 'accepted' ? 'success' : 'info'}
          sx={{ width: '100%' }}
        >
          {installationResult === 'accepted' 
            ? '🎉 TaskFlow הותקן בהצלחה!'
            : 'אפשר להתקין בכל זמן מהתפריט של הדפדפן'
          }
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallButton;
