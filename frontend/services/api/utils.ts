import { DateRange } from '../../types';
import { isTauriAvailable } from '../../utils/tauri';

// Error message for Tauri requirement
export const TAURI_REQUIRED_ERROR = 'This feature requires the desktop application. Please use the Tauri desktop app.';

// Tauri invoke wrapper with web fallback
export const invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  // Check if Tauri is available before trying to use it
  if (!isTauriAvailable()) {
    throw new Error(TAURI_REQUIRED_ERROR);
  }
  
  try {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/tauri');
    return tauriInvoke<T>(cmd, args);
  } catch (error) {
    // If import fails or invoke fails, provide a helpful error message
    if (error instanceof Error && error.message.includes('__TAURI_IPC__')) {
      throw new Error(TAURI_REQUIRED_ERROR);
    }
    throw error;
  }
};

// Helper function to convert Date to Unix timestamp
export const dateToTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

// Helper function to convert DateRange to API params
export const dateRangeToParams = (range: DateRange): { start: number; end: number } => ({
  start: dateToTimestamp(range.start),
  end: dateToTimestamp(range.end),
});

// Convert boolean | null to Tauri i32: 1 = true, 0 = false, -1 = neutral/null
export const boolToTauriNum = (value: boolean | null | undefined): number =>
  value === true ? 1 : value === false ? 0 : -1;
