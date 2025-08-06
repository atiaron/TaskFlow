/* cspell:disable */
import React, { useState, useEffect } from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Slide,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Psychology as AIIcon,
  Schedule as QuickTaskIcon,
  TrendingUp as AnalyticsIcon,
  Lightbulb as SuggestIcon,
  Timer as PomodoroIcon,
  Search as SearchIcon,
  Star as PriorityIcon,
  Event as CalendarIcon,
  Close as CloseIcon,
  Mic as VoiceIcon,
  Camera as PhotoIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { Task } from '../types';

interface QuickActionsProps {
  onCreateTask: (task: Partial<Task>) => void;
  onAIAnalysis: () => void;
  onQuickAdd: (text: string) => void;
  user: any;
  recentTasks: Task[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  category: 'create' | 'ai' | 'analyze' | 'tools';
  shortcut?: string;
}

const QuickActionsMenu: React.FC<QuickActionsProps> = ({
  onCreateTask,
  onAIAnalysis,
  onQuickAdd,
  user,
  recentTasks
}) => {
  const [open, setOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [smartSuggestionsOpen, setSmartSuggestionsOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: 'quick_add',
      label: 'הוספה מהירה',
      icon: <AddIcon />,
      color: '#4CAF50',
      action: () => setQuickAddOpen(true),
      category: 'create',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'ai_suggest',
      label: 'הצעות AI',
      icon: <AIIcon />,
      color: '#9C27B0',
      action: () => generateSmartSuggestions(),
      category: 'ai'
    },
    {
      id: 'priority_task',
      label: 'משימה דחופה',
      icon: <PriorityIcon />,
      color: '#F44336',
      action: () => createPriorityTask(),
      category: 'create'
    },
    {
      id: 'pomodoro',
      label: 'פומודורו',
      icon: <PomodoroIcon />,
      color: '#FF9800',
      action: () => startPomodoro(),
      category: 'tools'
    },
    {
      id: 'voice_input',
      label: 'הקלטה קולית',
      icon: <VoiceIcon />,
      color: '#2196F3',
      action: () => startVoiceInput(),
      category: 'create'
    },
    {
      id: 'analytics',
      label: 'ניתוח תפוקה',
      icon: <AnalyticsIcon />,
      color: '#607D8B',
      action: onAIAnalysis,
      category: 'analyze'
    }
  ];

  const generateSmartSuggestions = async () => {
    setSmartSuggestionsOpen(true);
    
    // הצעות חכמות בהתבסס על היסטוריה
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    let contextualSuggestions = [];
    
    if (timeOfDay < 12) {
      contextualSuggestions = [
        '📧 בדיקת אימיילים חשובים',
        '☕ תכנון יום העבודה',
        '💪 אימון בוקר קצר',
        '📚 קריאת חדשות מקצועיות'
      ];
    } else if (timeOfDay < 17) {
      contextualSuggestions = [
        '⚡ סיום המשימות הדחופות',
        '🤝 מעקב אחר פרויקטים',
        '📞 שיחות חשובות',
        '📝 עדכון סטטוס פרויקטים'
      ];
    } else {
      contextualSuggestions = [
        '🎯 תכנון למחר',
        '📋 סקירת הישגי היום',
        '🧘 רגיעה ומדיטציה',
        '👨‍👩‍👧‍👦 זמן איכות עם המשפחה'
      ];
    }

    setSuggestions(contextualSuggestions);
  };

  const createPriorityTask = () => {
    onCreateTask({
      title: '',
      priority: 'high',
      dueDate: new Date(),
      tags: ['דחוף']
    });
  };

  const startPomodoro = () => {
    // פתיחת מצב פומודורו
    console.log('🍅 Starting Pomodoro session');
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'he-IL';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickText(transcript);
        setQuickAddOpen(true);
      };

      recognition.start();
    } else {
      alert('הדפדפן לא תומך בהקלטה קולית');
    }
  };

  const handleQuickAdd = () => {
    if (quickText.trim()) {
      onQuickAdd(quickText.trim());
      setQuickText('');
      setQuickAddOpen(false);
    }
  };

  // Templates for common tasks
  const quickTemplates = [
    { icon: '📧', text: 'בדיקת אימיילים', tags: ['תקשורת'] },
    { icon: '💼', text: 'מפגש עם צוות', tags: ['פגישות'] },
    { icon: '📚', text: 'למידה חדשה', tags: ['פיתוח אישי'] },
    { icon: '🛒', text: 'קניות בסופר', tags: ['אישי'] },
    { icon: '🏃', text: 'אימון ספורט', tags: ['בריאות'] },
    { icon: '📱', text: 'עדכון רשתות חברתיות', tags: ['שיווק'] }
  ];

  return (
    <>
      <SpeedDial
        ariaLabel="תפריט פעולות מהיר"
        sx={{ position: 'fixed', bottom: 80, left: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {quickActions.map((action) => (
          <SpeedDialAction
            key={action.id}
            icon={action.icon}
            tooltipTitle={
              <Box>
                <Typography variant="body2">{action.label}</Typography>
                {action.shortcut && (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {action.shortcut}
                  </Typography>
                )}
              </Box>
            }
            onClick={() => {
              action.action();
              setOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: action.color,
                color: 'white',
                '&:hover': {
                  bgcolor: action.color,
                  transform: 'scale(1.1)'
                }
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* דיאלוג הוספה מהירה */}
      <Dialog 
        open={quickAddOpen} 
        onClose={() => setQuickAddOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as any}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">הוספה מהירה</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            placeholder="מה אתה רוצה להוסיף? (AI יעזור לך לארגן)"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {/* תבניות מהירות */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>תבניות מהירות:</Typography>
          <Grid container spacing={1}>
            {quickTemplates.map((template, index) => (
              <Grid item xs={6} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                  }}
                  onClick={() => setQuickText(template.text)}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>{template.icon}</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {template.text}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAddOpen(false)}>ביטול</Button>
          <Button 
            onClick={handleQuickAdd} 
            variant="contained" 
            disabled={!quickText.trim()}
            startIcon={<AIIcon />}
          >
            הוסף עם AI
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג הצעות חכמות */}
      <Dialog
        open={smartSuggestionsOpen}
        onClose={() => setSmartSuggestionsOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6">הצעות חכמות לפי הזמן</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            בהתבסס על השעה והיום, אלו המשימות המומלצות:
          </Typography>
          
          <Grid container spacing={1}>
            {suggestions.map((suggestion, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-2px)', 
                      boxShadow: 4,
                      bgcolor: 'primary.light',
                      color: 'white'
                    }
                  }}
                  onClick={() => {
                    onQuickAdd(suggestion);
                    setSmartSuggestionsOpen(false);
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="body1">{suggestion}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmartSuggestionsOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActionsMenu;
