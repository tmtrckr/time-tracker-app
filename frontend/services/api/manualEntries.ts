import { ManualEntry, DateRange } from '../../types';
import { invoke, dateRangeToParams } from './utils';

export const manualEntriesApi = {
  getManualEntries: (range: DateRange): Promise<ManualEntry[]> => {
    return invoke('get_manual_entries', dateRangeToParams(range));
  },
  
  createManualEntry: (entry: {
    description: string | null;
    category_id: number | null;
    started_at: number;
    ended_at: number;
    // Плагины должны использовать call_db_method для работы с этими полями
  }): Promise<ManualEntry> => {
    return invoke('create_manual_entry', {
      description: entry.description,
      categoryId: entry.category_id,
      startedAt: entry.started_at,
      endedAt: entry.ended_at,
    });
  },
  
  updateManualEntry: (entry: {
    id: number;
    description: string | null;
    category_id: number | null;
    started_at: number;
    ended_at: number;
    // Плагины должны использовать call_db_method для работы с этими полями
  }): Promise<ManualEntry> => {
    return invoke('update_manual_entry', {
      id: entry.id,
      description: entry.description,
      categoryId: entry.category_id,
      startedAt: entry.started_at,
      endedAt: entry.ended_at,
    });
  },
  
  deleteManualEntry: (id: number): Promise<void> => {
    return invoke('delete_manual_entry', { id });
  },
  
  startManualEntry: (categoryId: number, description?: string): Promise<number> => {
    return invoke('start_manual_entry', { categoryId, description });
  },
  
  stopManualEntry: (): Promise<ManualEntry> => {
    return invoke('stop_manual_entry');
  },
};
