import { Activity, DateRange } from '../../types';
import { invoke, dateRangeToParams } from './utils';

export const activitiesApi = {
  /**
   * Get activities for a date range with optional pagination.
   * @param range - Date range to query
   * @param limit - Optional: maximum number of activities to return
   * @param offset - Optional: number of activities to skip (requires limit)
   * @returns Promise resolving to array of activities
   * 
   * Examples:
   * - getActivities(range) - returns all activities
   * - getActivities(range, 100) - returns first 100 activities
   * - getActivities(range, 100, 50) - returns 100 activities starting from 50th
   */
  getActivities: (range: DateRange, limit?: number, offset?: number): Promise<Activity[]> => {
    const params: Record<string, unknown> = {
      ...dateRangeToParams(range),
    };
    // Only include limit/offset if they are explicitly provided
    // This allows the backend to handle: limit only, limit+offset, or neither
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    return invoke('get_activities', params);
  },
  
  getActivityById: (id: number): Promise<Activity | null> => {
    return invoke('get_activity', { id });
  },
  
  updateActivityCategory: (activityId: number, categoryId: number): Promise<void> => {
    return invoke('update_activity_category', { activityId, categoryId });
  },
  
  deleteActivity: (id: number): Promise<void> => {
    return invoke('delete_activity', { id });
  },
  
  reapplyCategorizationRules: (): Promise<void> => {
    return invoke('reapply_categorization_rules');
  },
};
