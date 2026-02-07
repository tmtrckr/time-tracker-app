import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalProgress, GoalAlert, DateRange } from '../types';
import { api } from '../services/api';
import { getGoalDateRange } from '../utils/goals';

export const useGoals = (activeOnly = true) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.goals.getGoals(activeOnly);
      // Ensure we always have an array, even if empty
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      // Set empty array on error so UI can still function
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (goal: Omit<Goal, 'id' | 'created_at'>) => {
    const id = await api.goals.createGoal(goal);
    await fetchGoals();
    return id;
  };

  const updateGoal = async (goal: Goal) => {
    await api.goals.updateGoal(goal);
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  };

  const deleteGoal = async (id: number) => {
    await api.goals.deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getGoalProgress = async (goalId: number, range: DateRange): Promise<GoalProgress> => {
    return api.goals.getGoalProgress(goalId, range);
  };

  const checkAlerts = async (): Promise<GoalAlert[]> => {
    return api.goals.checkGoalAlerts();
  };

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    checkAlerts,
  };
};

/**
 * Hook to get progress for a specific goal
 */
export const useGoalProgress = (goalId: number | null, autoRefresh = true) => {
  const { getGoalProgress } = useGoals();
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (goal: Goal) => {
    if (!goal) return;
    
    try {
      setLoading(true);
      setError(null);
      const dateRange = getGoalDateRange(goal);
      const progressData = await getGoalProgress(goal.id, dateRange);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goal progress');
    } finally {
      setLoading(false);
    }
  }, [getGoalProgress]);

  useEffect(() => {
    if (!goalId) {
      setProgress(null);
      return;
    }

    // Get goal from API to calculate date range
    api.goals.getGoals(false).then(goals => {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        fetchProgress(goal);
      }
    }).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to fetch goal');
    });

    if (autoRefresh) {
      const interval = setInterval(() => {
        api.goals.getGoals(false).then(goals => {
          const goal = goals.find(g => g.id === goalId);
          if (goal) {
            fetchProgress(goal);
          }
        });
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [goalId, autoRefresh, fetchProgress]);

  return { progress, loading, error, refetch: () => goalId && api.goals.getGoals(false).then(goals => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) fetchProgress(goal);
  }) };
};

/**
 * Hook to monitor goal alerts
 */
export const useGoalAlerts = (autoRefresh = true) => {
  const { checkAlerts } = useGoals();
  const [alerts, setAlerts] = useState<GoalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goal alerts');
    } finally {
      setLoading(false);
    }
  }, [checkAlerts]);

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
};
