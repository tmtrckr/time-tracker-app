import { DateRange } from '../../types';
import { invoke, dateRangeToParams } from './utils';

export const exportApi = {
  exportToCsv: (range: DateRange, filePath: string): Promise<void> => {
    return invoke('export_to_csv', {
      ...dateRangeToParams(range),
      filePath: filePath,
    });
  },
  
  exportToJson: (range: DateRange, filePath: string): Promise<void> => {
    return invoke('export_to_json', {
      ...dateRangeToParams(range),
      filePath: filePath,
    });
  },
};
