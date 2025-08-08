import React, { useMemo, useState } from 'react';
import { Box, Button, Container, Stack, Typography, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AuthProvider from '../services/AuthProvider';
import { mapAuthErrorToMessage } from '../utils/authErrorMapper';

const BG = () => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage:
        'radial-gradient(circle at 12.5% 20%, #2d7ef733 4px, transparent 4px),' +
        'radial-gradient(circle at 37.5% 40%, #2d7ef71f 4px, transparent 4px),' +
        'radial-gradient(circle at 62.5% 60%, #2d7ef733 4px, transparent 4px),' +
        'radial-gradient(circle at 87.5% 80%, #2d7ef71f 4px, transparent 4px)',
      backgroundSize: '160px 160px',
      opacity: 0.35
    }}
  />
);

export default function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isMock = useMemo(
    () => (process.env.REACT_APP_AUTH_MODE || 'mock').toLowerCase() === 'mock',
    []
  );

  const onGoogle = async () => {
    if (submitting) return;
    setSubmitting(true); setErr(null);
    try {
      if (isMock) {
        await AuthProvider.signInWithMock();
      } else {
        await AuthProvider.signInWithGoogle();
      }
    } catch (e: any) {
      setErr(mapAuthErrorToMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onGuest = () => {
    if (submitting) return;
    sessionStorage.setItem('guestModeActive', 'true');
    window.location.replace('/');
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh', bgcolor: '#0f1115', color: '#fff' }}>
      <BG />
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            display: 'grid',
            gridTemplateColumns: { md: '1.1fr 1fr' },
            gap: 5,
            bgcolor: '#1c1f24',
            borderRadius: 4,
          }}
        >
          {/* Hero */}
          <Stack spacing={2} sx={{ alignSelf: 'center' }}>
            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: 34, md: 44 } }}>
              מארגנים, מתכננים, שולטים.
            </Typography>
            <Typography variant="body1" color="rgba(255,255,255,.75)">
              מסך התחברות מינימלי—בלי רעש, רק מה שצריך כדי להתחיל.
            </Typography>
          </Stack>

          {/* Actions */}
          <Stack spacing={2} sx={{ alignSelf: 'center' }}>
            <Button
              onClick={onGoogle}
              disabled={submitting}
              aria-label={isMock ? 'התחבר במצב פיתוח' : 'התחברות עם Google'}
              aria-busy={submitting ? 'true' : 'false'}
              variant="contained"
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.5,
                bgcolor: '#2d7ef7',
                '&:hover': { bgcolor: '#3c8cff' },
                fontWeight: 700
              }}
            >
              {isMock ? 'התחבר במצב פיתוח' : 'כניסה עם Google'}
            </Button>

            <Button
              variant="outlined"
              onClick={onGuest}
              disabled={submitting}
              startIcon={<PersonOutlineIcon />}
              aria-label="המשך כאורח ללא הרשמה"
              sx={{
                py: 1.5,
                borderColor: 'rgba(255,255,255,.25)',
                color: '#fff',
                ':hover': { borderColor: 'rgba(255,255,255,.45)', background: 'rgba(255,255,255,.06)' }
              }}
            >
              המשך כאורח
            </Button>

            {err && (
              <Typography role="status" aria-live="polite" color="#ffb4b4">
                {err}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
