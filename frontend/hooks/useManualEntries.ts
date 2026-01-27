import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useStore } from '../store';

export function useManualEntries() {
  const { getDateRange } = useStore();
  const range = getDateRange();

  // Ensure dates are Date objects (defensive check)
  const normalizedRange = {
    start: range.start instanceof Date ? range.start : new Date(range.start),
    end: range.end instanceof Date ? range.end : new Date(range.end),
  };

  return useQuery({
    queryKey: ['manualEntries', normalizedRange.start.getTime(), normalizedRange.end.getTime()],
    queryFn: () => api.manualEntries.getManualEntries(normalizedRange),
  });
}

export function useCreateManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: {
      description: string | null;
      category_id: number | null;
      project_id?: number | null;
      task_id?: number | null;
      started_at: number;
      ended_at: number;
    }) => api.manualEntries.createManualEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['todayTotal'] });
    },
  });
}

export function useUpdateManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: {
      id: number;
      description: string | null;
      category_id: number | null;
      project_id?: number | null;
      task_id?: number | null;
      started_at: number;
      ended_at: number;
    }) => api.manualEntries.updateManualEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['todayTotal'] });
    },
  });
}

export function useDeleteManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.manualEntries.deleteManualEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['todayTotal'] });
    },
  });
}
