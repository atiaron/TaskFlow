// Export components from the task-list feature
import TaskListScreen from './components/TaskListScreen';
import TaskCard from './components/TaskCard';
import MobileTaskCard from './components/MobileTaskCard';
import NextTask from './components/NextTask';
import TaskCategory from './components/TaskCategory';
import QuickInputField from './components/QuickInputField';
import CompletionRewards from './components/CompletionRewards';
import DailySummary from './components/DailySummary';
import GoogleTasksEmptyState from './components/GoogleTasksEmptyState';
import GoogleTasksStarredEmptyState from './components/GoogleTasksStarredEmptyState';

// Export demo data
import { tasks } from './data/taskListData';

// Export utility functions
import { 
  applyFilters, 
  groupTasksByDateStatus, 
  getTaskStatusTag,
  TAG_TYPES,
  formatDate
} from './utils/taskUtils';

// Demo task lists
const taskLists = [
  { id: 'all', name: 'כל המשימות', icon: 'list' },
  { id: 'today', name: 'היום', icon: 'today' },
  { id: 'week', name: 'השבוע', icon: 'calendar_month' },
  { id: 'important', name: 'חשוב', icon: 'priority_high' }
];

export {
  TaskListScreen,
  TaskCard,
  MobileTaskCard,
  NextTask,
  TaskCategory,
  QuickInputField,
  CompletionRewards,
  DailySummary,
  GoogleTasksEmptyState,
  GoogleTasksStarredEmptyState,
  tasks,
  taskLists,
  applyFilters,
  groupTasksByDateStatus,
  getTaskStatusTag,
  TAG_TYPES,
  formatDate
};