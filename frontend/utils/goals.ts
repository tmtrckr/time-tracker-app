import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { Goal, DateRange } from '../types';

/**
 * Calculate date range for a goal based on its type
 */
export function getGoalDateRange(goal: Goal): DateRange {
  const now = new Date();
  
  switch (goal.goal_type) {
    case 'daily':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'weekly':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
}

/**
 * Format goal type for display
 */
export function formatGoalType(type: string): string {
  const types: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };
  return types[type] || type;
}

/**
 * Get color for progress bar based on percentage
 */
export function getGoalProgressColor(percentage: number): string {
  if (percentage >= 100) {
    return 'bg-green-500'; // Completed
  }
  if (percentage >= 80) {
    return 'bg-blue-500'; // Warning (80%+)
  }
  if (percentage >= 50) {
    return 'bg-yellow-500'; // Good progress
  }
  return 'bg-red-500'; // Needs work
}

/**
 * Get text color for progress bar based on percentage
 */
export function getGoalProgressTextColor(percentage: number): string {
  if (percentage >= 100) {
    return 'text-green-600 dark:text-green-400';
  }
  if (percentage >= 80) {
    return 'text-blue-600 dark:text-blue-400';
  }
  if (percentage >= 50) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-red-600 dark:text-red-400';
}

/**
 * Check if alert should be shown for a percentage
 */
export function shouldShowAlert(percentage: number): boolean {
  return percentage >= 80;
}

/**
 * Get alert type based on percentage
 */
export function getAlertType(percentage: number): 'completed' | 'warning' | null {
  if (percentage >= 100) {
    return 'completed';
  }
  if (percentage >= 80) {
    return 'warning';
  }
  return null;
}

/**
 * Format goal name with filters
 */
export function formatGoalName(goal: Goal, categoryName?: string | null, projectName?: string | null): string {
  // If goal has a custom name, use it
  if (goal.name) {
    return goal.name;
  }
  
  // Otherwise, generate name from type and filters
  const type = formatGoalType(goal.goal_type);
  const parts: string[] = [type];
  
  if (categoryName) {
    parts.push(`in ${categoryName}`);
  }
  if (projectName) {
    parts.push(`for ${projectName}`);
  }
  
  return parts.join(' ');
}
