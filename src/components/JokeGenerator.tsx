import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SentimentVerySatisfied as JokeIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { User, Joke, JokeState } from '../types';

interface JokeGeneratorProps {
  user: User;
}

const JokeGenerator: React.FC<JokeGeneratorProps> = ({ user }) => {
  const [jokeState, setJokeState] = useState<JokeState>({
    joke: null,
    loading: false,
    error: null
  });
  
  const [favorites, setFavorites] = useState<Joke[]>([]);
  const [fadeIn, setFadeIn] = useState(false);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`jokes_favorites_${user.id}`);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    // Load initial joke
    fetchNewJoke();
  }, [user.id]);

  const fetchNewJoke = async () => {
    setJokeState(prev => ({ ...prev, loading: true, error: null }));
    setFadeIn(false);
    
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jokeData = await response.json();
      
      const joke: Joke = {
        id: jokeData.id,
        type: jokeData.type,
        setup: jokeData.setup,
        punchline: jokeData.punchline
      };
      
      setJokeState({
        joke,
        loading: false,
        error: null
      });
      
      // Trigger fade in animation after a short delay
      setTimeout(() => setFadeIn(true), 100);
      
    } catch (error) {
      setJokeState({
        joke: null,
        loading: false,
        error: 'Failed to fetch joke. Please try again!'
      });
      console.error('Error fetching joke:', error);
    }
  };

  const toggleFavorite = (joke: Joke) => {
    const isFavorite = favorites.some(fav => fav.id === joke.id);
    let newFavorites: Joke[];
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== joke.id);
    } else {
      newFavorites = [...favorites, joke];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem(`jokes_favorites_${user.id}`, JSON.stringify(newFavorites));
  };

  const shareJoke = async (joke: Joke) => {
    const jokeText = `${joke.setup}\n\n${joke.punchline}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Funny Joke from TaskFlow',
          text: jokeText,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(jokeText);
        alert('Joke copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  const isJokeFavorite = (joke: Joke) => {
    return favorites.some(fav => fav.id === joke.id);
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        pt: 3, 
        pb: 10, // Account for bottom navigation
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minWidth: '100%',
        margin: 0,
        padding: '24px 16px 80px 16px'
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <JokeIcon sx={{ fontSize: 48, color: 'white', mb: 2 }} />
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          מחולל בדיחות
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'rgba(255,255,255,0.9)', 
            mt: 1,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          קחו הפסקה עם קצת הומור!
        </Typography>
      </Box>

      {/* Main Joke Card */}
      <Card 
        elevation={8}
        sx={{ 
          borderRadius: 4,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 4 }}>
          {jokeState.loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                טוען בדיחה חדשה...
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="100%" height={40} />
                <Skeleton variant="text" width="80%" height={40} />
                <Skeleton variant="text" width="90%" height={40} />
              </Box>
            </Box>
          )}

          {jokeState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {jokeState.error}
            </Alert>
          )}

          {jokeState.joke && !jokeState.loading && (
            <Fade in={fadeIn} timeout={600}>
              <Box>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    mb: 3,
                    lineHeight: 1.6,
                    color: 'text.primary',
                    fontSize: '1.2rem'
                  }}
                >
                  {jokeState.joke.setup}
                </Typography>
                
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'primary.main', 
                  borderRadius: 2,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                }}>
                  <Typography 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      lineHeight: 1.5
                    }}
                  >
                    {jokeState.joke.punchline}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 3 
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontStyle: 'italic',
                      textTransform: 'capitalize'
                    }}
                  >
                    Category: {jokeState.joke.type}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={() => shareJoke(jokeState.joke!)}
                      color="primary"
                      size="small"
                    >
                      <ShareIcon />
                    </IconButton>
                    
                    <IconButton 
                      onClick={() => toggleFavorite(jokeState.joke!)}
                      color="error"
                      size="small"
                    >
                      {isJokeFavorite(jokeState.joke) ? 
                        <FavoriteIcon /> : 
                        <FavoriteBorderIcon />
                      }
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Action Button */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={fetchNewJoke}
          disabled={jokeState.loading}
          startIcon={jokeState.loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
            border: 0,
            color: 'white',
            boxShadow: '0 3px 15px 2px rgba(255, 105, 135, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FF8E8E 30%, #6ED8D0 90%)',
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease'
            },
            '&:disabled': {
              background: 'rgba(0,0,0,0.12)',
              color: 'rgba(0,0,0,0.26)'
            }
          }}
        >
          {jokeState.loading ? 'טוען...' : 'בדיחה חדשה'}
        </Button>
      </Box>

      {/* Favorites Counter */}
      {favorites.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            💖 יש לך {favorites.length} בדיחות מועדפות
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default JokeGenerator;