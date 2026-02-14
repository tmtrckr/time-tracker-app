import { invoke } from './utils';

export const trackingApi = {
  getTodayTotal: (): Promise<number> => {
    return invoke('get_today_total');
  },
  
  pauseTracking: (): Promise<void> => {
    return invoke('pause_tracking');
  },
  
  resumeTracking: (): Promise<void> => {
    return invoke('resume_tracking');
  },
  
  getTrackingStatus: (): Promise<{ isTracking: boolean; isPaused: boolean; currentApp: string | null }> => {
    return invoke('get_tracking_status');
  },
  
  startThinkingMode: (): Promise<number> => {
    return invoke('start_thinking_mode');
  },
  
  stopThinkingMode: (): Promise<void> => {
    return invoke('stop_thinking_mode');
  },
};
