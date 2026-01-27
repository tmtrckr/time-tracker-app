import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { api } from '../services/api';

export const useTasks = (projectId?: number, includeArchived = false) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.tasks.getTasks(projectId, includeArchived);
      // Ensure we always have an array, even if empty
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      // Set empty array on error so UI can still function
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, includeArchived]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'is_archived'>) => {
    const newTask = await api.tasks.createTask(task);
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const updateTask = async (task: Task) => {
    const updated = await api.tasks.updateTask(task);
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
    return updated;
  };

  const deleteTask = async (id: number) => {
    await api.tasks.deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};
