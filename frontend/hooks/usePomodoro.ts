import { useState, useEffect, useRef, useCallback } from 'react';
import { PomodoroStatus } from '../types';
import { api } from '../services/api';
import { useStore } from '../store';
import store from '../store';

// Global refs to track state (shared across all hook instances)
const hasRestoredRef = { current: false };
const globalIntervalRef: { current: number | null } = { current: null };
const globalIsCompletingRef: { current: boolean } = { current: false };
const globalCompletingSessionIdRef: { current: number | null } = { current: null };
const globalCompletedSessionTypeRef: { current: 'work' | 'break' | null } = { current: null };
const globalCompletedSessionTypeListeners: Set<() => void> = new Set();
const globalSuggestedNextTypeRef: { current: 'work' | 'break' | null } = { current: null };
const globalSuggestedNextTypeListeners: Set<() => void> = new Set();

export const usePomodoro = () => {
  const { settings, incrementPomodoroWorkSessions, resetPomodoroWorkSessions, syncPomodoroCounterFromDB, pomodoroStatus, setPomodoroStatus, consecutiveWorkCount, consecutiveBreakCount, incrementConsecutiveWork, incrementConsecutiveBreak, resetConsecutiveSessions } = useStore();
  
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
    // Use consecutiveWorkCount instead of pomodoroWorkSessionsCount
    // pomodoroWorkSessionsCount is total count for today, not consecutive
    // Long break should trigger after EVERY Nth session (2nd, 4th, 6th, etc.)
    // Use modulo to check if current count is a multiple of threshold
    const shouldBeLong = consecutiveWorkCount > 0 && consecutiveWorkCount % threshold === 0;
    return shouldBeLong ? 'long' : 'short';
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
  
  // Use global ref for completedSessionType to share across all hook instances
  const [completedSessionType, setCompletedSessionTypeState] = useState<'work' | 'break' | null>(globalCompletedSessionTypeRef.current);
  
  // Sync local state with global ref
  useEffect(() => {
    const listener = () => {
      setCompletedSessionTypeState(globalCompletedSessionTypeRef.current);
    };
    globalCompletedSessionTypeListeners.add(listener);
    return () => {
      globalCompletedSessionTypeListeners.delete(listener);
    };
  }, []);
  
  const setCompletedSessionType = useCallback((value: 'work' | 'break' | null) => {
    globalCompletedSessionTypeRef.current = value;
    // Notify all listeners
    globalCompletedSessionTypeListeners.forEach(listener => listener());
  }, []);
  const [, setIsLongBreak] = useState(false); // Отслеживать, был ли текущий break длинным
  
  // Use global ref for suggestedNextType to share across all hook instances
  const [suggestedNextType, setSuggestedNextTypeState] = useState<'work' | 'break' | null>(globalSuggestedNextTypeRef.current);
  
  // Sync local state with global ref
  useEffect(() => {
    const listener = () => {
      setSuggestedNextTypeState(globalSuggestedNextTypeRef.current);
    };
    globalSuggestedNextTypeListeners.add(listener);
    return () => {
      globalSuggestedNextTypeListeners.delete(listener);
    };
  }, []);
  
  const setSuggestedNextType = useCallback((value: 'work' | 'break' | null) => {
    globalSuggestedNextTypeRef.current = value;
    // Notify all listeners
    globalSuggestedNextTypeListeners.forEach(listener => listener());
  }, []);
  const isStoppingRef = useRef(false); // Track if we're in the process of stopping
  const isLongBreakRef = useRef(false); // Use ref to track isLongBreak to avoid closure issues
  // Use global refs shared across all hook instances to prevent multiple intervals
  const intervalRef = globalIntervalRef;
  const isCompletingRef = globalIsCompletingRef;
  const completingSessionIdRef = globalCompletingSessionIdRef;
  
  // Sync counter from DB on mount
  // Note: consecutive counters are not persisted and start at 0 on each app restart
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
            // Long break should trigger after EVERY Nth session (2nd, 4th, 6th, etc.)
            const wasLongBreak = consecutiveWorkCount > 0 && consecutiveWorkCount % threshold === 0;
            setIsLongBreak(wasLongBreak);
            isLongBreakRef.current = wasLongBreak;
          }
          
          // Calculate elapsed time
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - activeSession.started_at;
          const remaining = Math.max(0, duration - elapsed);
          
          // If session has expired, mark it as completed
          if (remaining === 0) {
            // Session expired - complete it
            // Don't increment consecutive counters here - they should only track sessions completed in current app session
            try {
              await api.pomodoro.stopPomodoro(activeSession.id, duration, true);
              // Trigger completion handler (but don't increment consecutive counters for expired sessions)
              if (activeSession.pomodoro_type === 'work') {
                incrementPomodoroWorkSessions();
                setSuggestedNextType('break');
              } else {
                const threshold = settings.pomodoro_sessions_until_long_break ?? 4;
                // Long break should trigger after EVERY Nth session (2nd, 4th, 6th, etc.)
                const wasLongBreak = consecutiveWorkCount > 0 && consecutiveWorkCount % threshold === 0;
                if (wasLongBreak) {
                  resetPomodoroWorkSessions();
                  resetConsecutiveSessions();
                }
                setIsLongBreak(false);
                isLongBreakRef.current = false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pomodoro_work_duration_seconds, settings.pomodoro_work_duration_minutes, getWorkDuration]);

  const handleSessionCompletion = useCallback(async (currentStatus: PomodoroStatus) => {
    // Prevent multiple simultaneous calls - use session_id to track which session we're completing
    const sessionId = currentStatus.session_id;
    
    // Check if already completing a DIFFERENT session (shouldn't happen, but be safe)
    // If completing the SAME session, we should proceed (timer may have set the flag)
    if (isCompletingRef.current && completingSessionIdRef.current !== null && completingSessionIdRef.current !== sessionId) {
      return;
    }
    
    // Capture isLongBreak from ref IMMEDIATELY - BEFORE setting any flags
    // This must happen before any state changes or async operations
    const wasLongBreak = isLongBreakRef.current;
    
    // Ensure session ID and flag are set (timer may have already set them)
    // If timer already set them for this session, that's fine - we'll proceed
    if (completingSessionIdRef.current !== sessionId) {
      completingSessionIdRef.current = sessionId;
    }
    if (!isCompletingRef.current) {
      isCompletingRef.current = true;
    }
    
    // Final verification: ensure we're still processing the correct session
    if (completingSessionIdRef.current !== sessionId) {
      // Another call changed the session ID - this shouldn't happen, but be safe
      return;
    }
    
    try {
      // Save session to DB as completed FIRST, before updating state
      if (currentStatus.session_id) {
        try {
          // Save session to DB as completed with full duration
          await api.pomodoro.stopPomodoro(currentStatus.session_id, currentStatus.total_sec, true);
        } catch (error) {
          // Continue with transition even if DB save fails
        }
      }
      
      // Reset timer to initial state (work session with default duration)
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
      
      // Always trigger transition regardless of DB save success
      if (currentStatus.pomodoro_type === 'work') {
        // Increment work sessions counter
        incrementPomodoroWorkSessions();
        // Increment consecutive work sessions counter
        incrementConsecutiveWork();
        // Set suggested next type to break (for context after skip)
        setSuggestedNextType('break');
        // Set completed session type to trigger automatic transition
        setCompletedSessionType('work');
      } else if (currentStatus.pomodoro_type === 'break') {
        // After break, check if we need to reset counters
        // If we just finished a long break, reset both counters (long break ends the cycle)
        // Use wasLongBreak from ref (captured at start of function) instead of state
        if (wasLongBreak) {
          resetPomodoroWorkSessions();
          resetConsecutiveSessions();
        } else {
          // Increment consecutive break sessions counter only for short breaks
          incrementConsecutiveBreak();
        }
        // Reset flag AFTER processing (not before)
        setIsLongBreak(false);
        isLongBreakRef.current = false;
        // Set suggested next type to work (for context after skip)
        setSuggestedNextType('work');
        // Set completed session type to trigger automatic transition
        setCompletedSessionType('break');
      }
    } finally {
      // Reset flag after a longer delay to prevent race conditions
      setTimeout(() => {
        isCompletingRef.current = false;
        completingSessionIdRef.current = null;
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incrementPomodoroWorkSessions, resetPomodoroWorkSessions, getWorkDuration, setPomodoroStatus, incrementConsecutiveWork, incrementConsecutiveBreak, resetConsecutiveSessions]);

  // TODO: Проверить автопереход между сессиями Work и Break
  // TODO 1: Проверить, что таймер правильно определяет завершение сессии (remaining_sec <= 0)
  // TODO 2: Проверить, что handleSessionCompletion вызывается при завершении сессии
  useEffect(() => {
    if (status.is_active && status.remaining_sec >= 0 && pomodoroStatus) {
      // Don't create interval if one already exists
      if (intervalRef.current) {
        return;
      }
      
      intervalRef.current = window.setInterval(() => {
        const currentStatus = store.getState().pomodoroStatus;
        if (!currentStatus) return;
        
        if (currentStatus.remaining_sec <= 0) {
          // Clear interval FIRST to prevent race conditions
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Check if we're already completing this session
          const sessionId = currentStatus.session_id;
          
          // IMMEDIATE check: if already processing this exact session, skip
          if (completingSessionIdRef.current === sessionId && isCompletingRef.current) {
            // Already processing this session - skip
            return;
          }
          
          // Try to claim this session: set session ID FIRST (this is our "claim")
          const previousSessionId = completingSessionIdRef.current;
          completingSessionIdRef.current = sessionId;
          
          // CRITICAL: Double-check immediately - if session ID changed, we lost the race
          if (completingSessionIdRef.current !== sessionId) {
            // Another call claimed this session between our read and write - we lost the race
            return;
          }
          
          // We successfully claimed the session - set the flag
          isCompletingRef.current = true;
          
          // Final check: verify we still own the claim (defense against race conditions)
          if (completingSessionIdRef.current !== sessionId) {
            // Lost the race - reset our claim
            completingSessionIdRef.current = previousSessionId;
            isCompletingRef.current = false;
            return;
          }
          
          // Timer finished naturally - handle completion
          // handleSessionCompletion will reset the timer to initial state
          handleSessionCompletion(currentStatus);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.is_active, pomodoroStatus, handleSessionCompletion, setPomodoroStatus]);

  const startPomodoro = async (type: 'work' | 'break' = 'work', projectId?: number, taskId?: number) => {
    const sessionId = await api.pomodoro.startPomodoro(type, projectId, taskId);
    let duration: number;
    if (type === 'work') {
      duration = getWorkDuration();
    } else {
      const breakType = getNextBreakType();
      duration = breakType === 'long' ? getLongBreakDuration() : getShortBreakDuration();
      const willBeLongBreak = breakType === 'long';
      setIsLongBreak(willBeLongBreak);
      isLongBreakRef.current = willBeLongBreak; // Update ref as well
    }
    // Don't clear suggestedNextType when starting manually - it should persist
    // It will be updated when the session completes
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
      isLongBreakRef.current = false; // Reset ref as well
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
    // Don't clear suggestedNextType here - it should persist until the next session completes
    // It will be updated when the next session completes
    
    // Determine break duration if needed
    let duration: number;
    if (type === 'work') {
      duration = getWorkDuration();
      setIsLongBreak(false);
      isLongBreakRef.current = false; // Update ref as well
    } else {
      const breakType = getNextBreakType();
      duration = breakType === 'long' ? getLongBreakDuration() : getShortBreakDuration();
      const willBeLongBreak = breakType === 'long';
      setIsLongBreak(willBeLongBreak);
      isLongBreakRef.current = willBeLongBreak; // Update ref as well
    }
    
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
  };

  const clearCompletedSessionType = useCallback(() => {
    setCompletedSessionType(null);
  }, [setCompletedSessionType]);

  const clearSuggestedNextType = useCallback(() => {
    setSuggestedNextType(null);
  }, [setSuggestedNextType]);

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
    consecutiveWorkCount,
    consecutiveBreakCount,
    resetConsecutiveSessions,
  };
};
