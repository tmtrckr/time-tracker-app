import { useState, useEffect, useMemo, useCallback } from 'react';
import { FocusSession, DateRange } from '../types';
import { api } from '../services/api';

export const useFocusSessions = (range: DateRange) => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize timestamp values to avoid unnecessary re-renders
  const startTimestamp = useMemo(() => {
    const start = range.start instanceof Date ? range.start : new Date(range.start);
    return start.getTime();
  }, [range.start]);

  const endTimestamp = useMemo(() => {
    const end = range.end instanceof Date ? range.end : new Date(range.end);
    return end.getTime();
  }, [range.end]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Create DateRange from memoized timestamps to ensure consistency
      const dateRange: DateRange = {
        start: new Date(startTimestamp),
        end: new Date(endTimestamp),
      };
      const data = await api.pomodoro.getFocusSessions(dateRange);
      // Ensure we always have an array, even if empty
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      // Set empty array on error so UI can still function
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [startTimestamp, endTimestamp]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
};
