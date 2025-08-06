import React from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { Task } from '../types';

interface GamificationProps {
  tasks: Task[];
}

const GamificationSystem: React.FC<GamificationProps> = ({ tasks }) => {
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
          התקדמות
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ color: '#27ae60', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
            {completedTasks}/{totalTasks}
          </Typography>
        </Box>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.7)',
          '& .MuiLinearProgress-bar': {
            bgcolor: '#27ae60',
            borderRadius: 4
          }
        }}
      />
      
      {progress === 100 && totalTasks > 0 && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 1, 
            display: 'block', 
            textAlign: 'center', 
            color: '#27ae60',
            fontWeight: 600
          }}
        >
          🎉 כל המשימות הושלמו!
        </Typography>
      )}
    </Paper>
  );
};

export default GamificationSystem;
