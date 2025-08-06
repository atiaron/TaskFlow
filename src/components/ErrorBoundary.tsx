import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  Alert
} from '@mui/material';
import { 
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon 
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // כאן אפשר לשלוח דיווח לשירות ניטור (בעתיד)
    // analytics.reportError(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 3
            }}
          >
            <ErrorIcon 
              color="error" 
              sx={{ 
                fontSize: 64, 
                mb: 2,
                opacity: 0.7
              }} 
            />
            
            <Typography variant="h4" gutterBottom color="error.main">
              אופס! משהו השתבש
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              אירעה שגיאה בלתי צפויה באפליקציה. אנחנו עובדים לפתור את הבעיה.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem'
                }}
                icon={<BugIcon />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  פרטי השגיאה (מצב פיתוח):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.name}: {this.state.error.message}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                color="primary"
              >
                טען מחדש את הדף
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
                color="primary"
              >
                נסה שוב
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              אם הבעיה נמשכת, אנא צור קשר עם התמיכה
            </Typography>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
