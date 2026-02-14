// Activity types
export interface Activity {
  id: number;
  app_name: string;
  window_title: string | null;
  domain: string | null;
  category_id: number | null;
  started_at: number; // Unix timestamp
  duration_sec: number;
  is_idle: boolean;
}

export interface ActivityWithCategory extends Activity {
  category: Category | null;
}

// Category types
export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  is_productive: boolean | null;
  sort_order: number;
  is_system?: boolean;
  is_pinned?: boolean;
}

// Rule types
export type RuleType = 'app_name' | 'window_title' | 'domain';

export interface Rule {
  id: number;
  rule_type: RuleType;
  pattern: string;
  category_id: number;
  priority: number;
}

// Manual entry types
export interface ManualEntry {
  id: number;
  description: string | null;
  category_id: number | null;
  started_at: number;
  ended_at: number;
}

// Settings types
export interface Settings {
  idle_threshold_minutes: number;
  idle_prompt_threshold_minutes: number;
  autostart: boolean;
  minimize_to_tray: boolean;
  show_notifications: boolean;
  date_format: string;
  time_format: '12h' | '24h';
  // Exact seconds for precision (optional, calculated from minutes if not provided)
  idle_threshold_seconds?: number;
  idle_prompt_threshold_seconds?: number;
  // Frontend-only properties (not synced with backend)
  idleThreshold?: number; // Convenience property for UI (calculated from idle_threshold_seconds/minutes)
  pollingInterval?: number; // Frontend-only setting for UI
  idlePromptThreshold?: number; // Convenience property for UI (calculated from idle_prompt_threshold_seconds/minutes)
  autoStart?: boolean; // Alias for autostart
  theme?: 'system' | 'light' | 'dark'; // Frontend-only theme setting
  darkMode?: boolean; // Frontend-only dark mode setting
  enable_marketplace?: boolean;
  plugin_registry_urls?: string[];
}

// Statistics types
export interface DailyStats {
  total_duration_sec: number;
  productive_duration_sec: number;
  categories: CategoryStats[];
  top_apps: AppStats[];
}

export interface CategoryStats {
  category: Category;
  duration_sec: number;
  percentage: number;
}

export interface AppStats {
  app_name: string;
  duration_sec: number;
  category: Category | null;
}

/** Response from get_stats (aggregated stats for any date range) */
export interface StatsResponse {
  total_seconds: number;
  productive_seconds: number;
  category_breakdown: { category_id: number; category_name: string; color: string; seconds: number }[];
  app_breakdown: { app_name: string; seconds: number }[];
}

// Timeline types
export interface TimelineBlock {
  start: number;
  end: number;
  app_name: string;
  domain: string | null;
  category: Category | null;
  is_idle: boolean;
  is_manual: boolean;
}

// Date range types
export type DateRangePreset = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// Window info from Rust backend
export interface WindowInfo {
  app_name: string;
  window_title: string;
}

// Tracker status
export interface TrackerStatus {
  is_tracking: boolean;
  is_idle: boolean;
  current_app: string | null;
  today_total_sec: number;
}


// Domain statistics
export interface DomainStat {
  domain: string;
  duration_sec: number;
  count: number;
}

// Statistics types (additional)
export interface AppUsage {
  app_name: string;
  duration_sec: number;
  count: number;
  category: Category | null;
}

export interface CategoryUsage {
  category: Category;
  duration_sec: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  duration_sec: number;
  productive_duration_sec: number;
}

// Plugin types
export * from './plugin';
