/* cspell:disable */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Autocomplete
} from '@mui/material';
import { Search, Clear, Psychology } from '@mui/icons-material';
import { Task } from '../types';

interface SmartSearchProps {
  tasks: Task[];
  onFilteredTasks: (tasks: Task[]) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ tasks, onFilteredTasks }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [smartFilters, setSmartFilters] = useState<string[]>([]);

  // 🧠 אלגוריתם חיפוש חכם
  const smartSearch = useMemo(() => {
    if (!searchQuery.trim()) return tasks;

    const query = searchQuery.toLowerCase();
    
    return tasks.filter(task => {
      // חיפוש רגיל בכותרת ותיאור
      const basicMatch = 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query));

      // חיפוש חכם לפי תאריכים
      const dateMatch = checkDateQuery(query, task);
      
      // חיפוש לפי עדיפות
      const priorityMatch = checkPriorityQuery(query, task);
      
      // חיפוש לפי סטטוס
      const statusMatch = checkStatusQuery(query, task);
      
      // חיפוש לפי תגיות
      const tagMatch = task.tags?.some((tag: string) =>
        tag.toLowerCase().includes(query)
      );      return basicMatch || dateMatch || priorityMatch || statusMatch || tagMatch;
    });
  }, [searchQuery, tasks]);

  // 🎯 זיהוי שאילתות תאריך חכמות
  const checkDateQuery = (query: string, task: Task): boolean => {
    const today = new Date();
    
    if (query.includes('היום') && task.dueDate) {
      return new Date(task.dueDate).toDateString() === today.toDateString();
    }
    
    if (query.includes('מחר') && task.dueDate) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(task.dueDate).toDateString() === tomorrow.toDateString();
    }
    
    if (query.includes('השבוע') && task.dueDate) {
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return new Date(task.dueDate) <= weekFromNow;
    }
    
    return false;
  };

  const checkPriorityQuery = (query: string, task: Task): boolean => {
    if (query.includes('חשוב') || query.includes('דחוף')) {
      return task.priority === 'high';
    }
    if (query.includes('בינוני')) {
      return task.priority === 'medium';
    }
    if (query.includes('נמוך')) {
      return task.priority === 'low';
    }
    return false;
  };

  const checkStatusQuery = (query: string, task: Task): boolean => {
    if (query.includes('הושלם') || query.includes('גמור')) {
      return task.completed;
    }
    if (query.includes('ממתין') || query.includes('לא גמור')) {
      return !task.completed;
    }
    return false;
  };

  // 🔍 הצעות חיפוש חכמות
  const searchSuggestions = useMemo(() => {
    const suggestions = [
      'משימות לhיום',
      'משימות חשובות',
      'משימות ממתינות',
      'משימות שהושלמו',
      'קניות',
      'עבודה',
      'בית'
    ];

    // הוסף תגיות קיימות
    const existingTags = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach((tag: string) => existingTags.add(tag));
    });

    return [...suggestions, ...Array.from(existingTags)];
  }, [tasks]);

  useEffect(() => {
    onFilteredTasks(smartSearch);
  }, [smartSearch, onFilteredTasks]);

  // 🎯 פילטרים מהירים
  const quickFilters = [
    { label: 'היום', query: 'היום' },
    { label: 'חשוב', query: 'חשוב' },
    { label: 'ממתין', query: 'ממתין' },
    { label: 'קניות', query: 'קניות' },
    { label: 'עבודה', query: 'עבודה' }
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {/* שדה חיפוש חכם */}
      <Autocomplete
        freeSolo
        options={searchSuggestions}
        value={searchQuery}
        onChange={(_, newValue) => setSearchQuery(newValue || '')}
        onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="חפש משימות... (נסה: 'היום', 'חשוב', 'קניות')"
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchQuery && (
                <IconButton onClick={() => setSearchQuery('')} size="small">
                  <Clear />
                </IconButton>
              )
            }}
          />
        )}
      />

      {/* פילטרים מהירים */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        {quickFilters.map(filter => (
          <Chip
            key={filter.label}
            label={filter.label}
            onClick={() => setSearchQuery(filter.query)}
            variant={searchQuery === filter.query ? 'filled' : 'outlined'}
            size="small"
          />
        ))}
      </Box>

      {/* תוצאות חיפוש */}
      {searchQuery && (
        <Paper sx={{ mt: 1, p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            <span>נמצאו {smartSearch.length} משימות עבור "{searchQuery}"</span>
          </Box>
        </Paper>
      )}
    </Box>
  );
};