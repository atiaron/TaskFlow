import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Fade } from '@mui/material';
import { Close as CloseIcon, Lightbulb as TipIcon } from '@mui/icons-material';

const dailyTips = [
  "💡 השלם את המשימה הקשה ביותר בתחילת היום",
  "🎯 חלק משימות גדולות למשימות קטנות יותר",
  "⏰ קבע זמנים מוגדרים לביצוע משימות",
  "🔄 קח הפסקות קצרות בין משימות",
  "📱 הסר הסחות דעת בזמן עבודה",
  "✅ חגוג הישגים קטנים במהלך היום",
  "📝 כתב את המשימות בערב ליום הבא",
  "🎨 השתמש בצבעים כדי לארגן משימות"
];

const DailyTip: React.FC = () => {
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    // בדוק אם כבר הוצג טיפ היום
    const today = new Date().toDateString();
    const lastTipDate = localStorage.getItem('lastTipDate');
    
    if (lastTipDate !== today) {
      // בחר טיפ רנדומלי
      const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
      setCurrentTip(randomTip);
      setShowTip(true);
      
      // שמור את התאריך
      localStorage.setItem('lastTipDate', today);
    }
  }, []);

  const handleClose = () => {
    setShowTip(false);
  };

  if (!showTip) return null;

  return (
    <Fade in={showTip}>
      <Paper
        sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <TipIcon sx={{ color: '#FFD700', fontSize: 24, mt: 0.5 }} />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              טיפ יומי
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.5 }}>
              {currentTip}
            </Typography>
          </Box>
          
          <IconButton
            onClick={handleClose}
            sx={{ 
              color: 'white',
              opacity: 0.8,
              '&:hover': { opacity: 1 }
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Fade>
  );
};

export default DailyTip;
