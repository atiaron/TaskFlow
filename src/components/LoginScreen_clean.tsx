/* cspell:disable */
import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { AuthService } from '../services/AuthService';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          TaskFlow
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          העוזר האישי החכם שלך
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
        >
          {loading ? 'מתחבר...' : 'התחבר עם Google'}
        </Button>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            🤖 AI חכם לניהול משימות
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🔄 סנכרון בין מכשירים
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🎯 תכנון אישי מותאם
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginScreen;
