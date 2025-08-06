import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Circle as StatusIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  SmartToy as AIIcon,
  Storage as DatabaseIcon,
  Wifi as NetworkIcon,
  Speed as PerformanceIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { PerformanceOptimizer } from '../services/PerformanceOptimizer';
import SecurityService from '../services/SecurityService';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning' | 'unknown';
  icon: React.ReactNode;
  description: string;
  lastCheck?: Date;
}

interface SystemStatusProps {
  isOnline: boolean;
  user?: any;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ isOnline, user }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceRecommendations, setPerformanceRecommendations] = useState<any[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);

  useEffect(() => {
    // עדכון סטטוס השירותים
    const updateServiceStatus = () => {
      // Get performance metrics
      const performance = PerformanceMonitor.getPerformanceReport();
      setPerformanceData(performance);
      
      // Get optimization recommendations
      const optimizer = PerformanceOptimizer.getInstance();
      const recommendations = optimizer.getPerformanceRecommendations();
      setPerformanceRecommendations(recommendations);
      
      // Get security metrics
      const security = SecurityService.getSecurityMetrics();
      setSecurityMetrics(security);
      
      const currentServices: ServiceStatus[] = [
        {
          name: 'חיבור רשת',
          status: isOnline ? 'online' : 'offline',
          icon: <NetworkIcon fontSize="small" />,
          description: isOnline ? 'חיבור לאינטרנט פעיל' : 'אין חיבור לאינטרנט',
          lastCheck: new Date()
        },
        {
          name: 'מסד נתונים',
          status: user && isOnline ? 'online' : 'warning',
          icon: <DatabaseIcon fontSize="small" />,
          description: user && isOnline ? 'Firebase מחובר' : 'מצב לא מקוון',
          lastCheck: new Date()
        },
        {
          name: 'אבטחה',
          status: user ? 'online' : 'offline',
          icon: <SecurityIcon fontSize="small" />,
          description: user ? 'SecurityManager פעיל' : 'לא מחובר',
          lastCheck: new Date()
        },
        {
          name: 'AI Assistant',
          status: user && isOnline ? 'online' : 'warning',
          icon: <AIIcon fontSize="small" />,
          description: user && isOnline ? 'Claude API זמין' : 'מוגבל במצב offline',
          lastCheck: new Date()
        },
        {
          name: 'ביצועים',
          status: 'online',
          icon: <PerformanceIcon fontSize="small" />,
          description: 'מערכת פועלת בצורה מיטבית',
          lastCheck: new Date()
        }
      ];

      setServices(currentServices);
    };

    updateServiceStatus();
    
    // Performance event listeners
    const handlePerformanceWarning = (event: CustomEvent) => {
      console.warn('Performance warning:', event.detail);
      // Update status to warning for performance issues
      setServices(prev => prev.map(service => 
        service.name === 'ביצועים' 
          ? { ...service, status: 'warning' as const, description: `איטי: ${event.detail.operation}` }
          : service
      ));
    };

    const handleMemoryWarning = (event: CustomEvent) => {
      console.warn('Memory warning:', event.detail);
      setServices(prev => prev.map(service => 
        service.name === 'ביצועים' 
          ? { ...service, status: 'warning' as const, description: 'שימוש גבוה בזיכרון' }
          : service
      ));
    };

    const handlePerformanceCritical = (event: CustomEvent) => {
      console.error('Performance critical:', event.detail);
      setServices(prev => prev.map(service => 
        service.name === 'ביצועים' 
          ? { ...service, status: 'offline' as const, description: 'בעיות חמורות בביצועים' }
          : service
      ));
    };

    // Add event listeners
    window.addEventListener('performance-warning', handlePerformanceWarning as EventListener);
    window.addEventListener('memory-warning', handleMemoryWarning as EventListener);
    window.addEventListener('performance-critical', handlePerformanceCritical as EventListener);
    
    // עדכון כל 30 שניות
    const interval = setInterval(updateServiceStatus, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('performance-warning', handlePerformanceWarning as EventListener);
      window.removeEventListener('memory-warning', handleMemoryWarning as EventListener);
      window.removeEventListener('performance-critical', handlePerformanceCritical as EventListener);
    };
  }, [isOnline, user]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getOverallStatus = (): 'online' | 'warning' | 'offline' => {
    if (services.some(s => s.status === 'offline')) return 'offline';
    if (services.some(s => s.status === 'warning')) return 'warning';
    return 'online';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'offline': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'תקין';
      case 'warning': return 'אזהרה';
      case 'offline': return 'לא פעיל';
      default: return 'לא ידוע';
    }
  };

  const overallStatus = getOverallStatus();
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="מצב המערכת - לחץ לפרטים">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            p: 0.5,
            bgcolor: 'background.paper',
            border: `2px solid ${getStatusColor(overallStatus)}`,
            '&:hover': {
              bgcolor: 'background.paper',
              transform: 'scale(1.1)'
            }
          }}
        >
          <StatusIcon
            sx={{
              color: getStatusColor(overallStatus),
              fontSize: 16
            }}
          />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 350,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              סטטוס המערכת
            </Typography>
            <Chip
              label={getStatusText(overallStatus)}
              size="small"
              sx={{
                bgcolor: getStatusColor(overallStatus),
                color: 'white',
                fontWeight: 500,
                ml: 'auto'
              }}
            />
          </Box>

          <Divider sx={{ mb: 1 }} />

          <List dense disablePadding>
            {services.map((service, index) => (
              <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {service.icon}
                </ListItemIcon>
                <ListItemText
                  primary={service.name}
                  secondary={service.description}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'text.secondary'
                  }}
                />
                <StatusIcon
                  sx={{
                    color: getStatusColor(service.status),
                    fontSize: 12,
                    ml: 1
                  }}
                />
              </ListItem>
            ))}
            
            {/* Performance Metrics */}
            {performanceData && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <PerformanceIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="ביצועים"
                    secondary={`Claude: ${performanceData.metrics.claudeResponse?.averageResponseTime.toFixed(0)}ms`}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
                
                {performanceData.memory && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <MemoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="זיכרון"
                      secondary={`${(performanceData.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: 'text.secondary'
                      }}
                    />
                    <Box sx={{ width: 60, ml: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(performanceData.memory.usedJSHeapSize / performanceData.memory.jsHeapSizeLimit) * 100}
                        sx={{ height: 3 }}
                      />
                    </Box>
                  </ListItem>
                )}
                
                {performanceData.network && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <NetworkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="רשת"
                      secondary={`${performanceData.network.effectiveType} (${performanceData.network.rtt}ms)`}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                )}
              </>
            )}
            
            {/* Performance Recommendations */}
            {performanceRecommendations.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" fontWeight={600} sx={{ px: 2, display: 'block' }}>
                  המלצות ביצועים
                </Typography>
                {performanceRecommendations.slice(0, 3).map((rec, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TimerIcon 
                        fontSize="small" 
                        sx={{ 
                          color: rec.priority === 'critical' ? 'error.main' : 
                                rec.priority === 'high' ? 'warning.main' :
                                rec.priority === 'medium' ? 'info.main' : 'success.main'
                        }} 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.message}
                      primaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: rec.priority === 'critical' ? 'error.main' : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </>
            )}
            
            {/* Security Metrics */}
            {securityMetrics && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" fontWeight={600} sx={{ px: 2, display: 'block' }}>
                  מדדי אבטחה
                </Typography>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="חסימות אבטחה"
                    secondary={`${securityMetrics.blockedRequests} בקשות נחסמו`}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: securityMetrics.blockedRequests > 0 ? 'warning.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <TimerIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="בקרת קצב"
                    secondary={`${securityMetrics.rateLimitHits} בקשות מנוטרות`}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
              </>
            )}
          </List>

          <Divider sx={{ my: 1 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center' }}
          >
            עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export default SystemStatus;
