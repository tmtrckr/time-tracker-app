import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useStore, type View } from '../store';
import { showSuccess, handleApiError } from '../utils/toast';

const VALID_VIEWS: View[] = ['dashboard', 'history', 'reports', 'settings', 'marketplace'];

interface UseTauriEventsOptions {
  onIdleReturn?: (durationMinutes: number, startedAt: number) => void;
  onActivityUpdate?: () => void;
  onNavigate?: (view: View) => void;
  onOpenManualEntry?: () => void;
  onStartThinkingMode?: () => void;
  onTogglePause?: () => void;
}

export function useTauriEvents(options: UseTauriEventsOptions = {}) {
  const {
    onIdleReturn,
    onActivityUpdate,
    onNavigate,
    onOpenManualEntry,
    onStartThinkingMode,
    onTogglePause,
  } = options;

  useEffect(() => {
    let unlistenIdleReturn: (() => void) | undefined;
    let unlistenActivityUpdate: (() => void) | undefined;
    let unlistenNavigate: (() => void) | undefined;
    let unlistenOpenManualEntry: (() => void) | undefined;
    let unlistenStartThinkingMode: (() => void) | undefined;
    let unlistenTogglePause: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        // Listen for idle return events from Tauri backend
        unlistenIdleReturn = await listen<{ duration_minutes: number; started_at: number }>(
          'idle-return',
          (event) => {
            const store = useStore.getState();
            const settings = store.settings;
            const idleDurationMinutes = event.payload.duration_minutes;
            const idlePromptThresholdMinutes = settings.idle_prompt_threshold_minutes || 5;

            // Filter by prompt threshold: only show prompt for periods >= threshold
            if (idleDurationMinutes < idlePromptThresholdMinutes) {
              return;
            }

            onIdleReturn?.(idleDurationMinutes, event.payload.started_at);
          }
        );

        // Listen for activity updates
        unlistenActivityUpdate = await listen('activity-updated', () => {
          onActivityUpdate?.();
        });

        // Listen for navigation events from tray
        unlistenNavigate = await listen<string>('navigate', (event) => {
          const view = event.payload;
          if (VALID_VIEWS.includes(view as View)) {
            onNavigate?.(view as View);
          }
        });

        // Listen for open manual entry event
        unlistenOpenManualEntry = await listen('open-manual-entry', () => {
          onOpenManualEntry?.();
        });

        // Listen for start thinking mode event
        unlistenStartThinkingMode = await listen('start-thinking-mode', async () => {
          try {
            const { invoke } = await import('@tauri-apps/api/tauri');
            await invoke('start_thinking_mode');
            const store = useStore.getState();
            store.setIsThinkingMode(true);
            showSuccess('Thinking mode started');
            onStartThinkingMode?.();
          } catch (error) {
            handleApiError(error, 'Failed to start thinking mode');
          }
        });

        // Listen for toggle pause event
        unlistenTogglePause = await listen('toggle-pause', async () => {
          try {
            const { invoke } = await import('@tauri-apps/api/tauri');
            const store = useStore.getState();
            const isPaused = store.isTrackingPaused;
            if (isPaused) {
              await invoke('resume_tracking');
              store.setIsTrackingPaused(false);
              showSuccess('Tracking resumed');
            } else {
              await invoke('pause_tracking');
              store.setIsTrackingPaused(true);
              showSuccess('Tracking paused');
            }
            onTogglePause?.();
          } catch (error) {
            handleApiError(error, 'Failed to toggle tracking');
          }
        });
      } catch (error) {
        // Running in browser without Tauri - silently ignore
      }
    };

    setupListeners();

    return () => {
      if (unlistenIdleReturn) unlistenIdleReturn();
      if (unlistenActivityUpdate) unlistenActivityUpdate();
      if (unlistenNavigate) unlistenNavigate();
      if (unlistenOpenManualEntry) unlistenOpenManualEntry();
      if (unlistenStartThinkingMode) unlistenStartThinkingMode();
      if (unlistenTogglePause) unlistenTogglePause();
    };
  }, [onIdleReturn, onActivityUpdate, onNavigate, onOpenManualEntry, onStartThinkingMode, onTogglePause]);
}
