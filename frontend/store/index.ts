import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, Category, Settings, ManualEntry, DateRange, DateRangePreset } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type SettingsTab = 'general' | 'categories' | 'rules' | 'about';

export type View = 'dashboard' | 'history' | 'reports' | 'settings' | 'marketplace';

/** Shared helper: compute date range from preset (and optional custom range for preset 'custom'). */
export function presetToDateRange(preset: DateRangePreset, now: Date, customRange?: DateRange): DateRange {
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'custom': {
      if (!customRange) return { start: startOfDay(now), end: endOfDay(now) };
      return {
        start: customRange.start instanceof Date ? customRange.start : new Date(customRange.start),
        end: customRange.end instanceof Date ? customRange.end : new Date(customRange.end),
      };
    }
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

interface AppState {
  // UI State
  currentView: View;
  selectedDateRange: DateRange;
  dateRangePreset: DateRangePreset;
  isTrackingPaused: boolean;
  isThinkingMode: boolean;

  // Data
  activities: Activity[];
  categories: Category[];
  manualEntries: ManualEntry[];
  settings: Settings;


  // Settings navigation
  pendingRuleData: { rule_type: 'app_name' | 'window_title' | 'domain', pattern: string, category_id?: number } | null;
  settingsActiveTab: SettingsTab | null;
  scrollToIdlePromptThreshold: boolean;

  // Actions
  setCurrentView: (view: View) => void;
  setSelectedDateRange: (range: DateRange) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;
  getDateRange: () => DateRange;
  setIsTrackingPaused: (paused: boolean) => void;
  setIsThinkingMode: (thinking: boolean) => void;
  setActivities: (activities: Activity[]) => void;
  setCategories: (categories: Category[]) => void;
  setManualEntries: (entries: ManualEntry[]) => void;
  setSettings: (settings: Settings) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setPendingRuleData: (data: { rule_type: 'app_name' | 'window_title' | 'domain', pattern: string, category_id?: number } | null) => void;
  setSettingsActiveTab: (tab: SettingsTab | null) => void;
  setScrollToIdlePromptThreshold: (scroll: boolean) => void;
}

const defaultSettings: Settings = {
  idle_threshold_minutes: 2,
  idle_prompt_threshold_minutes: 5,
  autostart: false,
  minimize_to_tray: false,
  show_notifications: true,
  date_format: 'YYYY-MM-DD',
  time_format: '24h',
  // Frontend-only properties (not synced with backend)
  idleThreshold: 120, // seconds - convenience property for UI
  pollingInterval: 5, // seconds - frontend-only setting
  idlePromptThreshold: 300, // seconds - convenience property for UI
  autoStart: false, // alias for autostart
  theme: 'system', // frontend-only theme setting
  darkMode: false, // frontend-only dark mode setting
  enable_marketplace: true, // Default to true for new installations
};

const store = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial UI State
      currentView: 'dashboard',
      selectedDateRange: {
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      },
      dateRangePreset: 'today',
      isTrackingPaused: false,
      isThinkingMode: false,

      // Initial Data
      activities: [],
      categories: [],
      manualEntries: [],
      settings: defaultSettings,


      // Settings navigation (not persisted - runtime only)
      pendingRuleData: null,
      settingsActiveTab: null,
      scrollToIdlePromptThreshold: false,

      // Actions
      setCurrentView: (view) => set({ currentView: view }),

      setSelectedDateRange: (range) => set({ 
        selectedDateRange: range,
        dateRangePreset: 'custom',
      }),

      setDateRangePreset: (preset) => {
        const now = new Date();
        const range = presetToDateRange(preset, now, preset === 'custom' ? get().selectedDateRange : undefined);
        set({ 
          dateRangePreset: preset,
          selectedDateRange: range,
        });
      },

      getDateRange: () => {
        const state = get();
        return presetToDateRange(
          state.dateRangePreset,
          new Date(),
          state.dateRangePreset === 'custom' ? state.selectedDateRange : undefined
        );
      },

      setIsTrackingPaused: (paused) => set({ isTrackingPaused: paused }),

      setIsThinkingMode: (thinking) => set({ isThinkingMode: thinking }),

      setActivities: (activities) => set({ activities }),

      setCategories: (categories) => set({ categories }),

      setManualEntries: (entries) => set({ manualEntries: entries }),

      setSettings: (settings) => set({ settings }),

      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),

      
      setPendingRuleData: (data) => set({ pendingRuleData: data }),
      
      setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
      
      setScrollToIdlePromptThreshold: (scroll) => set({ scrollToIdlePromptThreshold: scroll }),
    }),
    {
      name: 'timetracker-storage',
      partialize: (state) => ({
        settings: state.settings,
        isTrackingPaused: state.isTrackingPaused,
        dateRangePreset: state.dateRangePreset,
        selectedDateRange: state.selectedDateRange,
        // Don't persist consecutive counters - they should reset on app restart
        // consecutiveWorkCount: state.consecutiveWorkCount,
        // consecutiveBreakCount: state.consecutiveBreakCount,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects after rehydration
        if (state?.selectedDateRange) {
          const range = state.selectedDateRange;
          if (range.start && !(range.start instanceof Date)) {
            state.selectedDateRange = {
              start: new Date(range.start),
              end: range.end && !(range.end instanceof Date) ? new Date(range.end) : range.end,
            };
          } else if (range.end && !(range.end instanceof Date)) {
            state.selectedDateRange = {
              ...range,
              end: new Date(range.end),
            };
          }
        }
      },
    }
  )
);

export const useStore = store;
export type { SettingsTab };
export default store;
