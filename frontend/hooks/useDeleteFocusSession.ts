import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

export function useDeleteFocusSession() {
  return useMutation({
    mutationFn: (id: number) => api.pomodoro.deleteFocusSession(id),
  });
}
