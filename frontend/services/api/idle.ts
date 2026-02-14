import { invoke, dateToTimestamp } from './utils';

export const idleApi = {
  getIdleTime: (): Promise<number> => {
    return invoke('get_idle_time');
  },
  
  classifyIdleTime: (
    idleStart: Date,
    idleEnd: Date,
    classification: string,
    description?: string
  ): Promise<void> => {
    return invoke('classify_idle_time', {
      idle_start: dateToTimestamp(idleStart),
      idle_end: dateToTimestamp(idleEnd),
      classification,
      description,
    });
  },
};
