import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon, Lightbulb as IdeaIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => {
  return (
    <Paper 
      sx={{ 
        p: 6, 
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: '2px dashed #E1E5E9',
        borderRadius: 3,
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: 3 }}>
        {icon || <IdeaIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.6 }} />}
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'text.primary',
          fontWeight: 600,
          mb: 1,
          fontSize: '1.1rem'
        }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary',
          mb: 3,
          lineHeight: 1.6
        }}
      >
        {description}
      </Typography>
      
      {actionText && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(74, 144, 226, 0.4)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
