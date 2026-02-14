import { DailyStats, AppUsage, CategoryUsage, HourlyActivity, DateRange, StatsResponse } from '../../types';
import { invoke, dateRangeToParams, dateToTimestamp } from './utils';

export const statsApi = {
  getDailyStats: (date: Date): Promise<DailyStats> => {
    // Get start of day timestamp
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return invoke('get_daily_stats', { date: dateToTimestamp(startOfDay) });
  },
  
  getTopApps: (range: DateRange, limit?: number): Promise<AppUsage[]> => {
    return invoke('get_top_apps', {
      ...dateRangeToParams(range),
      limit: limit || 10,
    });
  },
  
  getCategoryUsage: (range: DateRange): Promise<CategoryUsage[]> => {
    return invoke('get_category_usage', dateRangeToParams(range));
  },
  
  getHourlyActivity: (date: Date): Promise<HourlyActivity[]> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return invoke('get_hourly_activity', { date: dateToTimestamp(startOfDay) });
  },
  
  getProductiveTime: (range: DateRange): Promise<number> => {
    return invoke('get_productive_time', dateRangeToParams(range));
  },

  getStats: (range: DateRange): Promise<StatsResponse> => {
    return invoke('get_stats', dateRangeToParams(range));
  },
};
