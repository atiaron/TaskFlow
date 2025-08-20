import React, { useState, useEffect } from 'react';
import { tasks as initialTasks } from '../data/taskListData';
import { applyFilters, groupTasksByDateStatus } from '../utils/taskUtils';
import TaskCard from './TaskCard';
import MobileTaskCard from './MobileTaskCard';
import GoogleTasksEmptyState from './GoogleTasksEmptyState';
import GoogleTasksStarredEmptyState from './GoogleTasksStarredEmptyState';
import LoadingState from './LoadingState';
import NextTask from './NextTask';
import TaskCategory from './TaskCategory';
import FloatingActionButton from './FloatingActionButton';
import QuickInputField from './QuickInputField';
import TopNavigation from './TopNavigation';
import CompletionRewards from './CompletionRewards';
import DailySummary from './DailySummary';
import { Calendar, Clock, AlertCircle, Calendar as CalendarIcon, Star, CheckCircle } from 'lucide-react';
import '../styles/light-theme.css';
import '../styles/google-tasks.css';

/**
 * Main TaskList Screen Component
 * Responsive layout with 3-panel design for desktop, collapsing to
 * single panel with drawer navigation on mobile
 */
const TaskListScreen = () => {
  // Add loading state
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState(initialTasks);
  const [filters, setFilters] = useState({
    listId: 'all',
    showCompleted: true,
    searchQuery: '',
    onlyStarred: false
  });
  
  // Show/hide quick input field
  const [showQuickInput, setShowQuickInput] = useState(true);
  
  // Active tab in top navigation - התחל במבט 'היום' במקום 'הכל'
  const [activeTab, setActiveTab] = useState('today');
  
  // Check if the device is mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Task completion animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [completedTask, setCompletedTask] = useState(null);
  
  // Daily summary states
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailySummaryData, setDailySummaryData] = useState(null);
  
  // User points and level (would typically come from a user profile)
  const [userStats, setUserStats] = useState({
    points: 0,
    level: 1,
    streak: 1
  });
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simulate loading data with smooth transition
  useEffect(() => {
    // Simulate API/data loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check for end of day summary
  useEffect(() => {
    // Check if it's the end of the day (between 8pm-9pm) or if the user has completed most tasks
    const checkForDailySummary = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Get completed tasks count
      const completedToday = tasks.filter(task => {
        if (!task.completed) return false;
        
        // Check if completed today
        const completedDate = new Date(task.completedAt || new Date());
        const today = new Date();
        return completedDate.toDateString() === today.toDateString();
      }).length;
      
      // Get tomorrow's tasks count
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === tomorrow.getTime();
      }).length;
      
      // Either it's end of day or user completed most tasks
      const shouldShowSummary = 
        (hour >= 20 && hour < 21) || 
        (completedToday >= 3 && completedToday / tasks.length > 0.7);
      
      if (shouldShowSummary) {
        // Create summary data
        const summaryData = {
          completedTasks: completedToday,
          totalTasks: tasks.length,
          efficiency: Math.round((completedToday / tasks.length) * 100) || 0,
          streak: userStats.streak,
          points: userStats.points + (completedToday * 10),
          level: userStats.level,
          pointsToNextLevel: 100 - (userStats.points % 100),
          tomorrowTasks
        };
        
        setDailySummaryData(summaryData);
        setShowDailySummary(true);
        
        // Update user stats
        setUserStats(prev => ({
          ...prev,
          points: prev.points + (completedToday * 10),
          level: Math.floor(prev.points / 100) + 1,
          streak: prev.streak + 1
        }));
      }
    };
    
    // Only run this check once after initial load
    const timer = setTimeout(checkForDailySummary, 10000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle task completion animation
  const handleTaskCompletion = (task) => {
    // Show completion animation
    setCompletedTask(task);
    setShowAnimation(true);
    
    // Update user stats (add points)
    setUserStats(prev => ({
      ...prev,
      points: prev.points + 10
    }));
  };
  
  // Handle animation complete
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setCompletedTask(null);
  };
  
  // Handle daily summary close
  const handleCloseDailySummary = () => {
    setShowDailySummary(false);
    setDailySummaryData(null);
  };

  // Apply filters based on active tab and filter settings
  const getFilteredTasks = () => {
    // First apply standard filters
    let filtered = applyFilters(tasks, filters);
    
    // Then apply tab-specific filtering
    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        });
        break;
      case 'starred':
        filtered = filtered.filter(task => task.starred);
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        });
        break;
      default:
        // 'all' tab shows everything, no additional filtering needed
        break;
    }
    
    return filtered;
  };
  
  const filteredTasks = getFilteredTasks();
  
  // Group tasks by date status
  const groupedTasks = groupTasksByDateStatus(filteredTasks);
  
  // Removed staggered animation effect
  
  // הוסרה פונקציית בחירת רשימה מאחר והסרנו את הסיידבר

  // Toggle showing completed tasks
  const toggleShowCompleted = () => {
    setFilters(prev => ({ ...prev, showCompleted: !prev.showCompleted }));
  };

  // Toggle showing only starred tasks
  const toggleStarredOnly = () => {
    setFilters(prev => ({ ...prev, onlyStarred: !prev.onlyStarred }));
  };

  // Handle search input
  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  // Handle task actions (toggle, star, delete, etc.)
  const handleTaskAction = (actionType, task) => {
    
    // Update task based on action type
    switch (actionType) {
      case 'toggle':
        // If task is being completed (not uncompleted), show animation
        if (!task.completed) {
          // First update the task
          const updatedTask = { ...task, completed: true, completedAt: new Date().toISOString() };
          
          // Update tasks in state
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === task.id ? updatedTask : t
            )
          );
          
          // Show completion animation
          handleTaskCompletion(updatedTask);
        } else {
          // Just toggle without animation for uncompleting
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === task.id ? { ...t, completed: false, completedAt: null } : t
            )
          );
        }
        break;
        
      case 'star':
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, starred: !t.starred } : t
          )
        );
        break;
        
      case 'delete':
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        break;
        
      default:
        // TODO: implement other action types
    }
  };
  
  // Handle adding a new task
  const handleAddTask = (newTask) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 google-tasks-font h-full" dir="rtl">
      {/* Google Tasks Style Top Navigation */}
      <TopNavigation 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSettings={() => {/* TODO: open settings */}}
        onOpenHelp={() => {/* TODO: open help */}}
      />

      {/* Main Content - Adding top padding to account for fixed header */}
  <div className={`h-[calc(100vh-56px)] w-full mx-auto pt-14 ${showQuickInput ? 'pb-40' : ''}`}>
        {/* Main Tasks Panel - Google Tasks Style */}
  <main className="overflow-y-auto w-full pb-10 bg-white h-full transition-[padding] duration-150 ease-out">
          {/* Only show search bar and filters when there are tasks */}
          {filteredTasks.length > 0 && (
            <>
              <div className="mb-4 flex justify-between items-center content-optimize p-4">
                <h2 className="text-xl font-bold text-gray-900">רשימת המשימות שלי</h2>
                <div className="relative">
                  <div className="relative w-full">
                    <input
                      type="search"
                      placeholder="חיפוש משימות..."
                      className="search-bar bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/50 focus:bg-white"
                      value={filters.searchQuery}
                      onChange={handleSearch}
                      aria-label="חיפוש משימות"
                      inputMode="search"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 px-4 flex flex-wrap gap-2 text-sm">
                <button 
                  className={`filter-button px-4 py-2 rounded-full ${filters.onlyStarred ? 'active bg-[#1A73E8] text-white shadow-md' : 'bg-gray-100 text-gray-700'} text-sm min-w-[120px] flex justify-center items-center gap-2`}
                  onClick={toggleStarredOnly}
                >
                  <Star size={16} className="inline-block" /> מסומנות בכוכב
                </button>
                <button 
                  className={`filter-button px-4 py-2 rounded-full ${!filters.showCompleted ? 'active bg-[#1A73E8] text-white shadow-md' : 'bg-gray-100 text-gray-700'} text-sm min-w-[120px] flex justify-center items-center gap-2`}
                  onClick={toggleShowCompleted}
                >
                  <CheckCircle size={16} className="inline-block" /> הסתר הושלמו
                </button>
              </div>
            </>
          )}

          {/* Next Task Component - Shows the most important task at the top */}
          {!loading && filteredTasks.length > 0 && activeTab === 'today' && groupedTasks.today.length > 0 && (
            <div className="mx-4 mb-6 p-4 rounded-xl border border-[#D2E3FC] bg-[#E8F0FE] shadow-sm flex flex-col gap-2" aria-label="המשימה הבאה">
              <div className="flex items-center gap-2 text-[#1967D2] text-xs font-medium tracking-wide">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D2E3FC] text-[#1967D2] font-semibold">✓</span>
                <span>המשימה הבאה</span>
              </div>
              <NextTask 
                task={groupedTasks.today[0]} 
                onComplete={(task) => handleTaskAction('toggle', task)} 
              />
            </div>
          )}
          
          <div className="virtual-list-container h-full" role="list">
            {loading ? (
              <LoadingState />
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-1 px-4">
                {/* Overdue Tasks - הצג תמיד בגלל הדחיפות */}
                {groupedTasks.overdue.length > 0 && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>באיחור</span>
                        <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.overdue.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<AlertCircle size={20} />}
                    accentColor="red"
                    isExpanded={true}
                    className="mt-8 gt-category-accent-red pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.overdue.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
                
                {/* Today's Tasks - הצג תמיד כי זה הפוקוס העיקרי */}
                {groupedTasks.today.length > 0 && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>היום</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.today.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<Clock size={20} />}
                    accentColor="green"
                    isExpanded={true}
                    className="mt-8 gt-category-accent-green pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.today.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
                
                {/* Tomorrow's Tasks - פתוח רק במבט היום */}
                {groupedTasks.tomorrow.length > 0 && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>מחר</span>
                        <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.tomorrow.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<CalendarIcon size={20} />}
                    accentColor="purple"
                    isExpanded={activeTab === 'today' ? false : true}
                    className="mt-8 gt-category-accent-purple pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.tomorrow.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
                
                {/* This Week's Tasks - לא מציג במבט היום */}
                {groupedTasks.thisWeek.length > 0 && activeTab !== 'today' && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>השבוע</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.thisWeek.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<Calendar size={20} />}
                    accentColor="blue"
                    isExpanded={false}
                    className="mt-8 gt-category-accent-blue pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.thisWeek.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
                
                {/* Later Tasks - לא מציג במבט היום */}
                {groupedTasks.later.length > 0 && activeTab !== 'today' && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>בעתיד</span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.later.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<Calendar size={20} />}
                    accentColor="gray"
                    isExpanded={false}
                    className="mt-8 gt-category-accent-gray pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.later.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
                
                {/* Tasks without due date - לא מציג במבט היום */}
                {groupedTasks.noDate.length > 0 && activeTab !== 'today' && (
                  <TaskCategory 
                    title={
                      <span className="flex items-center gap-2">
                        <span>ללא תאריך</span>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5">
                          {groupedTasks.noDate.length}
                        </span>
                      </span>
                    }
                    count={undefined}
                    icon={<Calendar size={20} />}
                    accentColor="yellow"
                    isExpanded={false}
                    className="mt-8 gt-category-accent-yellow pr-3"
                  >
                    <div className="space-y-2">
                      {groupedTasks.noDate.map((task) => (
                        isMobile ? (
                          <MobileTaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        ) : (
                          <TaskCard 
                            key={task.id}
                            task={task} 
                            onAction={handleTaskAction} 
                          />
                        )
                      ))}
                    </div>
                  </TaskCategory>
                )}
              </div>
            ) : (
              activeTab === 'starred' ? (
                <GoogleTasksStarredEmptyState 
                  onAddTask={() => setShowQuickInput(true)}
                />
              ) : (
                <GoogleTasksEmptyState 
                  message="אין עדיין אף משימה"
                  description="לכאן אפשר להוסיף את המשימות שלך ב-Google Workspace ולעקוב אחריהן בקלות"
                  onAddTask={() => setShowQuickInput(true)}
                />
              )
            )}
          </div>

          {/* Enhanced Floating Action Button - Only shown when quick input is hidden */}
          {!showQuickInput && (
            <div>
              <FloatingActionButton onClick={() => setShowQuickInput(true)} />
            </div>
          )}
          
          {/* Quick Input Field */}
          {showQuickInput && (
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
              <QuickInputField onAddTask={handleAddTask} />
            </div>
          )}
          
          {/* Task Completion Animation */}
          <CompletionRewards 
            showAnimation={showAnimation}
            completedTask={completedTask}
            onAnimationComplete={handleAnimationComplete}
            dailySummary={null}
          />
          
          {/* Daily Summary */}
          {showDailySummary && (
            <DailySummary 
              summaryData={dailySummaryData}
              onClose={handleCloseDailySummary}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default TaskListScreen;