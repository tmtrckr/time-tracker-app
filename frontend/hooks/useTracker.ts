import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useTrackerStatus() {
  return useQuery({
    queryKey: ['trackerStatus'],
    queryFn: () => api.tracking.getTrackingStatus(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function usePauseTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.tracking.pauseTracking(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackerStatus'] });
    },
  });
}

export function useResumeTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.tracking.resumeTracking(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackerStatus'] });
    },
  });
}

export function useStartThinkingMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.tracking.startThinkingMode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackerStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useStopThinkingMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.tracking.stopThinkingMode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackerStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
