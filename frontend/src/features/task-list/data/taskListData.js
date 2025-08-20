/**
 * Demo tasks data for TaskFlow application
 * Each task has properties matching Google Tasks format with RTL support
 */

export const tasks = [
  {
    id: "1",
    title: "לשלם את חשבון החשמל",
    description: "לשלם באתר או באפליקציה",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    completed: false,
    starred: false,
    priority: "high",
    listId: "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["תשלומים", "חשבונות"]
  },
  {
    id: "2",
    title: "להכין מצגת לישיבת צוות",
    description: "לסכם את התוצאות מהרבעון האחרון ולהציג תחזית לרבעון הבא",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    completed: false,
    starred: true,
    priority: "high",
    listId: "work",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["עבודה", "מצגות"]
  },
  {
    id: "3",
    title: "לקנות מצרכים לשבת",
    description: "חלב, לחם, ביצים, ירקות, פירות, בשר לשבת",
    dueDate: new Date().toISOString(), // today
    completed: false,
    starred: false,
    priority: "medium",
    listId: "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["קניות", "שבת"]
  },
  {
    id: "4",
    title: "פגישה עם יועץ כלכלי",
    description: "לדון בתכנית החיסכון והשקעות",
    dueDate: new Date().toISOString(), // today
    completed: true,
    completedAt: new Date().toISOString(),
    starred: false,
    priority: "medium",
    listId: "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["פגישות", "כספים"]
  },
  {
    id: "5",
    title: "להתקשר לאמא",
    description: "",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday (overdue)
    completed: false,
    starred: true,
    priority: "high",
    listId: "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["משפחה"]
  },
  {
    id: "6",
    title: "לתקן את הבאג בממשק המשתמש",
    description: "הכפתור בדף הבית לא עובד במכשירים ניידים",
    dueDate: null, // no due date
    completed: false,
    starred: false,
    priority: "low",
    listId: "work",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["עבודה", "באגים"]
  }
];