import { DomainStat, DateRange } from '../../types';
import { invoke, dateRangeToParams } from './utils';

export const domainsApi = {
  getTopDomains: (range: DateRange, limit?: number): Promise<DomainStat[]> => {
    return invoke('get_top_domains', {
      ...dateRangeToParams(range),
      limit: limit ?? 10,
    });
  },
};
