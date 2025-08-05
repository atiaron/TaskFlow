// Demo data for TaskFlow application
// This can be used to populate the app with sample tasks for testing

export const demoTasks = [
  {
    title: "Review project proposal",
    description: "Go through the Q4 marketing proposal and provide feedback",
    priority: "high" as const,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ["work", "marketing", "review"],
    completed: false
  },
  {
    title: "Buy groceries",
    description: "Milk, bread, eggs, and vegetables for the week",
    priority: "medium" as const,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    tags: ["personal", "shopping"],
    completed: false
  },
  {
    title: "Call dentist",
    description: "Schedule regular checkup appointment",
    priority: "low" as const,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    tags: ["health", "appointments"],
    completed: false
  },
  {
    title: "Finish React component",
    description: "Complete the user dashboard component with TypeScript",
    priority: "high" as const,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    tags: ["coding", "react", "typescript"],
    completed: false
  },
  {
    title: "Plan weekend trip",
    description: "Research destinations and book accommodation",
    priority: "low" as const,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    tags: ["personal", "travel", "planning"],
    completed: false
  },
  {
    title: "Complete online course",
    description: "Finish the last 3 modules of the AI/ML course",
    priority: "medium" as const,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    tags: ["learning", "ai", "development"],
    completed: false
  },
  {
    title: "Update resume",
    description: "Add recent projects and skills to resume",
    priority: "medium" as const,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    tags: ["career", "personal"],
    completed: true
  },
  {
    title: "Exercise routine",
    description: "30 minutes of cardio and strength training",
    priority: "medium" as const,
    dueDate: new Date(), // Today
    tags: ["health", "fitness", "daily"],
    completed: true
  }
];

export const demoMessages = [
  {
    text: "Hello! I'm your AI assistant. I can help you manage your tasks, set priorities, and stay organized. How can I assist you today?",
    sender: "ai" as const,
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    text: "Help me prioritize my tasks for this week",
    sender: "user" as const,
    timestamp: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
  },
  {
    text: "Based on your current tasks, I recommend focusing on:\n\n1. **Review project proposal** (Due in 2 days, High priority)\n2. **Finish React component** (Due in 3 days, High priority)\n3. **Buy groceries** (Due tomorrow, Medium priority)\n\nStart with the high-priority work tasks first, then handle the groceries. The other tasks have more flexible deadlines.",
    sender: "ai" as const,
    timestamp: new Date(Date.now() - 24 * 60 * 1000) // 24 minutes ago
  }
];

// Function to seed demo data (for development/testing)
export const seedDemoData = async (userId: string) => {
  console.log("Demo data seeding not implemented - this is just sample data for reference");
  // This would typically use the FirebaseService to create demo tasks
  // Implementation would depend on the specific requirements
};