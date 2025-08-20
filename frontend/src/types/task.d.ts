export type Task = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean; // legacy name
  isCompleted?: boolean; // alt flag (some code paths)
  starred?: boolean;
  isStarred?: boolean;
  reminderAt?: string | null;
  completedAt?: string | null;
  dueAt?: string | null;
  priority?: 'p1'|'p2'|'p3'|string|number|null;
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  sortKey?: number | null; // future manual order (DnD)
  // order?: never; // removed
};
