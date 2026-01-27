import { useState, useEffect, useRef, useCallback } from 'react';
import { PomodoroStatus } from '../types';
import { api } from '../services/api';
import { useStore } from '../store';
import store from '../store';

// Global ref to track if session has been restored (shared across all hook instances)
const hasRestoredRef = { current: false };

export const usePomodoro = () => {
  const { settings, pomodoroWorkSessionsCount, incrementPomodoroWorkSessions, resetPomodoroWorkSessions, syncPomodoroCounterFromDB, pomodoroStatus, setPomodoroStatus } = useStore();
  
  // Get durations from settings or use defaults
  const getWorkDuration = useCallback(() => {
    return settings.pomodoro_work_duration_seconds ?? 
           (settings.pomodoro_work_duration_minutes ?? 25) * 60;
  }, [settings.pomodoro_work_duration_seconds, settings.pomodoro_work_duration_minutes]);
  
  const getShortBreakDuration = () => {
    return settings.pomodoro_short_break_seconds ?? 
           (settings.pomodoro_short_break_minutes ?? 5) * 60;
  };
  
  const getLongBreakDuration = () => {
    return settings.pomodoro_long_break_seconds ?? 
           (settings.pomodoro_long_break_minutes ?? 15) * 60;
  };
  
  const getNextBreakType = (): 'short' | 'long' => {
    const threshold = settings.pomodoro_sessions_until_long_break ?? 4;
    return pomodoroWorkSessionsCount >= threshold ? 'long' : 'short';
  };
  
  const defaultWorkDuration = getWorkDuration();
  
  // Use shared status from store, or initialize with default
  const status = pomodoroStatus || {
    is_running: false,
    is_active: false,
    session_id: null,
    pomodoro_type: 'work',
    started_at: null,
    duration_sec: defaultWorkDuration,
    remaining_sec: defaultWorkDuration,
    total_sec: defaultWorkDuration,
  };
  
  const [completedSessionType, setCompletedSessionType] = useState<'work' | 'break' | null>(null);
  const [isLongBreak, setIsLongBreak] = useState(false); // Отслеживать, был ли текущий break длинным
  const [suggestedNextType, setSuggestedNextType] = useState<'work' | 'break' | null>(null); // Контекст следующей ожидаемой сессии
  const intervalRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false); // Track if we're in the process of stopping
  
  // Sync counter from DB on mount
  useEffect(() => {
    syncPomodoroCounterFromDB();
  }, [syncPomodoroCounterFromDB]);
  
  // Restore active pomodoro session from DB on mount (after settings are loaded)
  useEffect(() => {
    // Only restore if settings are loaded (check if default duration is set)
    if (defaultWorkDuration === 0 || hasRestoredRef.current) {
      return;
    }
    
    const restoreActiveSession = async () => {
      try {
        const activeSession = await api.pomodoro.getActivePomodoroSession();
        if (activeSession) {
          // Calculate duration based on session type
          let duration: number;
          const workDuration = getWorkDuration();
          const longBreakDuration = getLongBreakDuration();
          
          if (activeSession.pomodoro_type === 'work') {
            duration = workDuration;
          } else {
            // For break sessions, we need to determine if it's long or short
            // Since we don't store this info, we'll use the threshold logic
            // But we need to check completed work sessions count at the time of session start
            // For simplicity, use long break duration (maximum) to be safe
            // If session already expired, it will be handled by timer logic
            duration = longBreakDuration;
            // Try to determine if it's long break based on current counter
            // This is approximate but should work in most cases
            const threshold = settings.pomodoro_sessions_until_long_break ?? 4;
            setIsLongBreak(pomodoroWorkSessionsCount >= threshold);
          }
          
          // Calculate elapsed time
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - activeSession.started_at;
          const remaining = Math.max(0, duration - elapsed);
          
          // If session has expired, mark it as completed
          if (remaining === 0) {
            // Session expired - complete it
            try {
              await api.pomodoro.stopPomodoro(activeSession.id, duration, true);
              // Trigger completion handler
              if (activeSession.pomodoro_type === 'work') {
                incrementPomodoroWorkSessions();
                setSuggestedNextType('break');
              } else {
                const threshold = settings.pomodoro_sessions_until_long_break ?? 4;
                const wasLongBreak = pomodoroWorkSessionsCount >= threshold;
                if (wasLongBreak) {
                  resetPomodoroWorkSessions();
                }
                setIsLongBreak(false);
                setSuggestedNextType('work');
              }
            } catch (error) {
              // Silently handle error - expired session cleanup failed
            }
            hasRestoredRef.current = true;
            return;
          }
          
          // Restore session state
          setPomodoroStatus({
            is_running: true,
            is_active: false, // Start paused so user can resume manually
            session_id: activeSession.id,
            pomodoro_type: activeSession.pomodoro_type,
            started_at: activeSession.started_at,
            duration_sec: duration,
            remaining_sec: remaining,
            total_sec: duration,
          });
          hasRestoredRef.current = true;
        }
      } catch (error) {
        hasRestoredRef.current = true; // Mark as attempted even on error
      }
    };
    
    restoreActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWorkDuration]); // Run when settings are loaded
  
  // Update durations when settings change (but not when timer just completed or stopped)
  useEffect(() => {
    // Skip if we're in the process of stopping to prevent infinite loops
    if (isStoppingRef.current) {
      return;
    }
    // Only update if timer is idle (not running, no active session, and in default state)
    // This prevents updates when timer is stopped (session_id would be null)
    if (!status.is_running && pomodoroStatus && status.session_id === null && status.remaining_sec === status.total_sec && status.remaining_sec > 0) {
      const newWorkDuration = getWorkDuration();
      // Only update if duration actually changed
      if (newWorkDuration !== status.total_sec) {
        setPomodoroStatus({
          ...pomodoroStatus,
          duration_sec: newWorkDuration,
          remaining_sec: newWorkDuration,
          total_sec: newWorkDuration,
        });
      }
    }
  }, [settings.pomodoro_work_duration_seconds, settings.pomodoro_work_duration_minutes, getWorkDuration]);

  const handleSessionCompletion = useCallback(async (currentStatus: PomodoroStatus) => {
    // Save session to DB as completed FIRST, before updating state
    if (currentStatus.session_id) {
      try {
        // Save session to DB as completed with full duration
        await api.pomodoro.stopPomodoro(currentStatus.session_id, currentStatus.total_sec, true);
      } catch (error) {
        // Continue with transition even if DB save fails
      }
    }
    
    // Always trigger transition regardless of DB save success
    if (currentStatus.pomodoro_type === 'work') {
      // Increment counter
      incrementPomodoroWorkSessions();
      // Set suggested next type to break (for context after skip)
      setSuggestedNextType('break');
      // Set completed session type to trigger automatic transition
      setCompletedSessionType('work');
    } else if (currentStatus.pomodoro_type === 'break') {
      // After break, check if we need to reset counter
      // If we just finished a long break, reset the counter
      if (isLongBreak) {
        resetPomodoroWorkSessions();
      }
      setIsLongBreak(false); // Reset flag
      // Set suggested next type to work (for context after skip)
      setSuggestedNextType('work');
      // Set completed session type to trigger automatic transition
      setCompletedSessionType('break');
    }
  }, [incrementPomodoroWorkSessions, resetPomodoroWorkSessions, isLongBreak]);

  // TODO: Проверить автопереход между сессиями Work и Break
  // TODO 1: Проверить, что таймер правильно определяет завершение сессии (remaining_sec <= 0)
  // TODO 2: Проверить, что handleSessionCompletion вызывается при завершении сессии
  useEffect(() => {
    if (status.is_active && status.remaining_sec >= 0 && pomodoroStatus) {
      intervalRef.current = window.setInterval(() => {
        const currentStatus = store.getState().pomodoroStatus;
        if (!currentStatus) return;
        
        if (currentStatus.remaining_sec <= 0) {
          // Clear interval FIRST to prevent race conditions
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Timer finished naturally - handle completion
          // TODO: Добавить логирование здесь для отладки автоперехода
          handleSessionCompletion(currentStatus);
          // Update status to stop the timer
          setPomodoroStatus({
            ...currentStatus,
            is_active: false,
            is_running: false,
            remaining_sec: 0,
          });
        } else {
          setPomodoroStatus({
            ...currentStatus,
            remaining_sec: currentStatus.remaining_sec - 1,
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status.is_active, status.remaining_sec, pomodoroStatus, handleSessionCompletion, setPomodoroStatus]);

  const startPomodoro = async (type: 'work' | 'break' = 'work', projectId?: number, taskId?: number) => {
    try {
      const sessionId = await api.pomodoro.startPomodoro(type, projectId, taskId);
      let duration: number;
      if (type === 'work') {
        duration = getWorkDuration();
      } else {
        const breakType = getNextBreakType();
        duration = breakType === 'long' ? getLongBreakDuration() : getShortBreakDuration();
        setIsLongBreak(breakType === 'long');
      }
      // Clear suggested next type when starting a session
      setSuggestedNextType(null);
      setPomodoroStatus({
        is_running: true,
        is_active: true,
        session_id: sessionId,
        pomodoro_type: type,
        started_at: Math.floor(Date.now() / 1000),
        duration_sec: duration,
        remaining_sec: duration,
        total_sec: duration,
      });
    } catch (err) {
      throw err;
    }
  };

  const stopPomodoro = async (clearContext: boolean = false) => {
    isStoppingRef.current = true; // Mark that we're stopping
    try {
      if (status.session_id) {
        try {
          const elapsed = status.total_sec - status.remaining_sec;
          // Only mark as completed if timer reached 0 naturally
          const wasCompleted = status.remaining_sec === 0;
          await api.pomodoro.stopPomodoro(status.session_id, elapsed, wasCompleted);
        } catch (err) {
          // Silently handle error - session stop failed
        }
      }
      const defaultWorkDuration = getWorkDuration();
      setPomodoroStatus({
        is_running: false,
        is_active: false,
        session_id: null,
        pomodoro_type: 'work',
        started_at: null,
        duration_sec: defaultWorkDuration,
        remaining_sec: defaultWorkDuration,
        total_sec: defaultWorkDuration,
      });
      setIsLongBreak(false); // Reset flag when stopping
      // Always clear completedSessionType when manually stopping
      // This prevents showing modal if user stops timer manually (even if it reached 0)
      // Modal should only show when timer completes naturally via handleSessionCompletion
      setCompletedSessionType(null);
      // Clear context only if explicitly requested
      if (clearContext) {
        setSuggestedNextType(null);
      }
    } finally {
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 100);
    }
  };

  const pausePomodoro = () => {
    if (pomodoroStatus) {
      setPomodoroStatus({
        ...pomodoroStatus,
        is_active: false,
      });
    }
  };

  const resumePomodoro = () => {
    if (status.remaining_sec > 0 && pomodoroStatus) {
      setPomodoroStatus({
        ...pomodoroStatus,
        is_active: true,
      });
    }
  };

  // TODO: Проверить автопереход между сессиями Work и Break
  // TODO 9: Проверить, что startNextSession корректно запускает следующую сессию и обновляет состояние
  const startNextSession = async (type: 'work' | 'break', projectId?: number, taskId?: number) => {
    // Clear completed session type
    setCompletedSessionType(null);
    // Clear suggested next type when starting next session
    setSuggestedNextType(null);
    
    // Determine break duration if needed
    let duration: number;
    if (type === 'work') {
      duration = getWorkDuration();
      setIsLongBreak(false);
    } else {
      const breakType = getNextBreakType();
      duration = breakType === 'long' ? getLongBreakDuration() : getShortBreakDuration();
      setIsLongBreak(breakType === 'long');
    }
    
    try {
      const sessionId = await api.pomodoro.startPomodoro(type, projectId, taskId);
      setPomodoroStatus({
        is_running: true,
        is_active: true,
        session_id: sessionId,
        pomodoro_type: type,
        started_at: Math.floor(Date.now() / 1000),
        duration_sec: duration,
        remaining_sec: duration,
        total_sec: duration,
      });
    } catch (err) {
      throw err;
    }
  };

  const clearCompletedSessionType = useCallback(() => {
    setCompletedSessionType(null);
  }, []);

  const clearSuggestedNextType = useCallback(() => {
    setSuggestedNextType(null);
  }, []);

  return {
    status,
    completedSessionType,
    suggestedNextType,
    getNextBreakType,
    startPomodoro,
    stopPomodoro,
    pausePomodoro,
    resumePomodoro,
    startNextSession,
    clearCompletedSessionType,
    clearSuggestedNextType,
  };
};
