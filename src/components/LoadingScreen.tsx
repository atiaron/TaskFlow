import React from 'react';
import { 
  Box, 
  Container, 
  CircularProgress, 
  Typography,
  LinearProgress,
  Fade
} from '@mui/material';
import { keyframes } from '@mui/system';

// אנימציית fade in מתקדמת
const pulseAnimation = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
`;

const logoFloat = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'טוען את TaskFlow...', 
  progress,
  showProgress = false 
}) => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Animation */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(-45deg, #4A90E2, #7ED321, #4A90E2, #6BA3E8)',
            backgroundSize: '400% 400%',
            animation: `${pulseAnimation} 4s ease-in-out infinite`,
            opacity: 0.05,
            zIndex: 0
          }}
        />
        
        <Container 
          maxWidth="sm" 
          sx={{ 
            textAlign: 'center',
            zIndex: 1,
            position: 'relative'
          }}
        >
          {/* Logo / App Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 32px rgba(74, 144, 226, 0.3)',
              animation: `${logoFloat} 3s ease-in-out infinite`
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              📋
            </Typography>
          </Box>
          
          {/* App Name */}
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
              animation: `${pulseAnimation} 2s ease-in-out infinite`
            }}
          >
            TaskFlow
          </Typography>
          
          {/* Tagline */}
          <Typography 
            variant="subtitle1" 
            color="text.secondary" 
            gutterBottom
            sx={{ mb: 4, opacity: 0.8 }}
          >
            מערכת ניהול משימות חכמה עם AI
          </Typography>
          
          {/* Loading Spinner */}
          <Box sx={{ mb: 3 }}>
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{
                color: 'primary.main',
                filter: 'drop-shadow(0 4px 8px rgba(74, 144, 226, 0.3))'
              }}
            />
          </Box>
          
          {/* Progress Bar (אם נדרש) */}
          {showProgress && progress !== undefined && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(45deg, #4A90E2, #7ED321)'
                  }
                }}
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mt: 1, display: 'block' }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
          )}
          
          {/* Loading Message */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              animation: `${pulseAnimation} 3s ease-in-out infinite`,
              fontWeight: 500
            }}
          >
            {message}
          </Typography>
          
          {/* Version Info (בפיתוח) */}
          {process.env.NODE_ENV === 'development' && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.6
              }}
            >
              TaskFlow v2.0 • Development Mode
            </Typography>
          )}
        </Container>
      </Box>
    </Fade>
  );
};

export default LoadingScreen;
