import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Drawer,
  TextField,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tooltip,
  InputAdornment,
  Collapse,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { ChatSession, ChatStatus } from '../types/index';
import { EnhancedClaudeService } from '../services/EnhancedClaudeService';
import { AuthService } from '../services/AuthService';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { RealTimeSyncService } from '../services/RealTimeSyncService';

// SessionManager Props Interface
interface SessionManagerProps {
  open: boolean;
  onClose: () => void;
  selectedSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onSessionCreate: () => void;
  className?: string;
  variant?: 'drawer' | 'sidebar' | 'modal';
  width?: number | string;
}

// Session List Item Component
interface SessionListItemProps {
  session: ChatSession;
  isSelected: boolean;
  onClick: () => void;
  onStar: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const SessionListItem: React.FC<SessionListItemProps> = ({
  session,
  isSelected,
  onClick,
  onStar,
  onEdit,
  onArchive,
  onDelete
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'עכשיו';
    if (diffInHours < 24) return `לפני ${Math.floor(diffInHours)} שעות`;
    if (diffInHours < 48) return 'אתמול';
    if (diffInHours < 168) return `לפני ${Math.floor(diffInHours / 24)} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'active': return theme.palette.success.main;
      case 'archived': return theme.palette.warning.main;
      case 'deleted': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = () => {
    switch (session.status) {
      case 'active': return <TodayIcon fontSize="small" />;
      case 'archived': return <ArchiveIcon fontSize="small" />;
      case 'deleted': return <DeleteIcon fontSize="small" />;
      default: return <HistoryIcon fontSize="small" />;
    }
  };

  return (
    <ListItem
      disablePadding
      sx={{
        mb: 0.5,
        borderRadius: 2,
        bgcolor: isSelected ? theme.palette.action.selected : 'transparent',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: theme.palette.action.hover,
          transform: 'translateX(2px)'
        }
      }}
    >
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
          minHeight: 72
        }}
      >
        <Box sx={{ width: '100%' }}>
          {/* Header with title and status */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: getStatusColor(),
              mr: 1
            }}>
              {getStatusIcon()}
            </Box>
            
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: session.isStarred ? 'bold' : 'medium',
                color: isSelected ? theme.palette.primary.main : 'text.primary',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem'
              }}
            >
              {session.title}
            </Typography>
            
            {session.isStarred && (
              <StarIcon 
                fontSize="small" 
                sx={{ color: theme.palette.warning.main, ml: 0.5 }}
              />
            )}
          </Box>

          {/* Summary and metadata */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontSize: '0.75rem'
              }}
            >
              {session.summary || `${session.messageCount} הודעות`}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                ml: 1
              }}
            >
              {formatTimestamp(session.updatedAt)}
            </Typography>
          </Box>

          {/* Message count chip */}
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={`${session.messageCount} הודעות`}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                borderColor: isSelected ? theme.palette.primary.main : 'divider'
              }}
            />
          </Box>
        </Box>
      </ListItemButton>

      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(e.currentTarget);
          }}
          sx={{ mr: 1 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { onStar(); setMenuAnchor(null); }}>
          {session.isStarred ? (
            <>
              <StarBorderIcon fontSize="small" sx={{ mr: 1 }} />
              בטל כוכב
            </>
          ) : (
            <>
              <StarIcon fontSize="small" sx={{ mr: 1 }} />
              סמן בכוכב
            </>
          )}
        </MenuItem>
        
        <MenuItem onClick={() => { onEdit(); setMenuAnchor(null); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          עדכן כותרת
        </MenuItem>
        
        <Divider />
        
        {session.status === 'active' ? (
          <MenuItem onClick={() => { onArchive(); setMenuAnchor(null); }}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            העבר לארכיון
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { onArchive(); setMenuAnchor(null); }}>
            <TodayIcon fontSize="small" sx={{ mr: 1 }} />
            החזר לפעיל
          </MenuItem>
        )}
        
        <MenuItem 
          onClick={() => { onDelete(); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          מחק
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

// Main SessionManager Component
const SessionManager: React.FC<SessionManagerProps> = ({
  open,
  onClose,
  selectedSessionId,
  onSessionSelect,
  onSessionCreate,
  className,
  variant = 'drawer',
  width = 320
}) => {
  // State Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChatStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; session: ChatSession | null }>({
    open: false,
    session: null
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; session: ChatSession | null }>({
    open: false,
    session: null
  });
  const [newTitle, setNewTitle] = useState('');

  // Services
  const claudeService = EnhancedClaudeService.getInstance();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Load sessions
  const loadSessions = useCallback(async () => {
    return PerformanceMonitor.time(
      'loadHistory',
      async () => {
        try {
          setLoading(true);
          const user = AuthService.getCurrentUser();
          if (!user) {
            setError('משתמש לא מחובר');
            return;
          }

          // Get all sessions from Firebase via Claude service
          const allSessions = await claudeService.getAllSessions();
          setSessions(allSessions);
          setError(null);
        } catch (err) {
          console.error('Error loading sessions:', err);
          setError('שגיאה בטעינת השיחות');
        } finally {
          setLoading(false);
        }
      }
    );
  }, [claudeService]);

  // Filter and sort sessions
  useEffect(() => {
    let filtered = sessions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(query) ||
        (session.summary && session.summary.toLowerCase().includes(query))
      );
    }

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'he');
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'updatedAt':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, statusFilter, sortBy]);

  // Real-time sessions sync
  useEffect(() => {
    if (!open) return;

    const syncService = RealTimeSyncService.getInstance();
    
    // Subscribe to real-time session updates
    const unsubscribe = syncService.subscribeToSessions((updatedSessions) => {
      setSessions(updatedSessions);
      setError(null);
      setLoading(false);
    });

    // Initial load if needed
    if (sessions.length === 0) {
      setLoading(true);
      loadSessions().catch(err => {
        console.error('Failed to load sessions:', err);
        setError('שגיאה בטעינת השיחות');
        setLoading(false);
      });
    }

    return unsubscribe;
  }, [open, loadSessions]);

  // Session Actions
  const handleSessionSelect = (session: ChatSession) => {
    onSessionSelect(session);
    if (isMobile) {
      onClose();
    }
  };

  const handleCreateSession = async () => {
    return PerformanceMonitor.time(
      'createSession',
      async () => {
        try {
          const newSession = await claudeService.createSession('שיחה חדשה');
          
          // Refresh sessions list
          await loadSessions();
          
          // Select the new session
          onSessionSelect(newSession);
          
          if (isMobile) {
            onClose();
          }
        } catch (err) {
          console.error('Error creating session:', err);
          setError('שגיאה ביצירת שיחה חדשה');
        }
      }
    );
  };

  const handleStarSession = async (session: ChatSession) => {
    try {
      const updatedSession = await claudeService.updateSession(session.id, { 
        isStarred: !session.isStarred,
        is_starred: !session.isStarred 
      });
      
      setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
    } catch (err) {
      console.error('Error updating star status:', err);
      setError('שגיאה בעדכון השיחה');
    }
  };

  const handleEditSession = (session: ChatSession) => {
    setNewTitle(session.title);
    setEditDialog({ open: true, session });
  };

  const handleSaveTitle = async () => {
    if (!editDialog.session || !newTitle.trim()) return;

    try {
      const updatedSession = await claudeService.updateSession(editDialog.session.id, { 
        title: newTitle.trim() 
      });
      
      setSessions(prev => prev.map(s => s.id === editDialog.session!.id ? updatedSession : s));
      setEditDialog({ open: false, session: null });
      setNewTitle('');
    } catch (err) {
      console.error('Error updating session title:', err);
      setError('שגיאה בעדכון כותרת השיחה');
    }
  };

  const handleArchiveSession = async (session: ChatSession) => {
    try {
      const newStatus: ChatStatus = session.status === 'active' ? 'archived' : 'active';
      const updatedSession = await claudeService.updateSession(session.id, { 
        status: newStatus 
      });
      
      setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
    } catch (err) {
      console.error('Error archiving session:', err);
      setError('שגיאה בעדכון סטטוס השיחה');
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteDialog.session) return;

    try {
      await claudeService.deleteSession(deleteDialog.session.id);
      setSessions(prev => prev.filter(s => s.id !== deleteDialog.session!.id));
      setDeleteDialog({ open: false, session: null });
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('שגיאה במחיקת השיחה');
    }
  };

  // Render content
  const renderContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <ChatIcon sx={{ mr: 1 }} />
            השיחות שלי
          </Typography>
          
          {isMobile && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="חיפוש שיחות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="הכל"
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('all')}
          />
          <Chip
            label="פעיל"
            variant={statusFilter === 'active' ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('active')}
          />
          <Chip
            label="ארכיון"
            variant={statusFilter === 'archived' ? 'filled' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('archived')}
          />
        </Box>
      </Box>

      {/* New Session Button */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSession}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          שיחה חדשה
        </Button>
      </Box>

      {/* Sessions List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              טוען שיחות...
            </Typography>
          </Box>
        ) : filteredSessions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'לא נמצאו שיחות' : 'אין שיחות עדיין'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            {filteredSessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isSelected={session.id === selectedSessionId}
                onClick={() => handleSessionSelect(session)}
                onStar={() => handleStarSession(session)}
                onEdit={() => handleEditSession(session)}
                onArchive={() => handleArchiveSession(session)}
                onDelete={() => setDeleteDialog({ open: true, session })}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Footer with stats */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          {filteredSessions.length} שיחות • {sessions.filter(s => s.status === 'active').length} פעילות
        </Typography>
      </Box>
    </Box>
  );

  // Render based on variant
  if (variant === 'drawer') {
    return (
      <>
        <Drawer
          anchor="right"
          open={open}
          onClose={onClose}
          className={className}
          PaperProps={{
            sx: {
              width: isMobile ? '100vw' : width,
              bgcolor: 'background.paper'
            }
          }}
        >
          {renderContent()}
        </Drawer>

        {/* Edit Title Dialog */}
        <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, session: null })}>
          <DialogTitle>עדכון כותרת השיחה</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="כותרת חדשה"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, session: null })}>
              ביטול
            </Button>
            <Button onClick={handleSaveTitle} variant="contained" disabled={!newTitle.trim()}>
              שמור
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, session: null })}>
          <DialogTitle>מחיקת שיחה</DialogTitle>
          <DialogContent>
            <Typography>
              האם אתה בטוח שברצונך למחוק את השיחה "{deleteDialog.session?.title}"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              פעולה זו לא ניתנת לביטול.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, session: null })}>
              ביטול
            </Button>
            <Button onClick={handleDeleteSession} color="error" variant="contained">
              מחק
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Snackbar */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // For sidebar variant (when integrated directly)
  if (variant === 'sidebar') {
    return (
      <Paper
        className={className}
        sx={{
          width,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}
      >
        {renderContent()}
      </Paper>
    );
  }

  // For modal variant (future use)
  if (variant === 'modal') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className={className}
      >
        {renderContent()}
      </Dialog>
    );
  }

  return null;
};

export default SessionManager;
