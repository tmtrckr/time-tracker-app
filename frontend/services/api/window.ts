import { invoke, dateToTimestamp } from './utils';

export const windowApi = {
  showMainWindow: (): Promise<void> => {
    return invoke('show_main_window');
  },
  
  hideMainWindow: (): Promise<void> => {
    return invoke('hide_main_window');
  },
  
  showIdlePrompt: (idleDuration: number, idleStart: Date): Promise<void> => {
    return invoke('show_idle_prompt', {
      idle_duration: idleDuration,
      idle_start: dateToTimestamp(idleStart),
    });
  },
};
