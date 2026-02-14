import React from 'react';
import { Filter, Calendar } from 'lucide-react';

interface HistoryFiltersProps {
  filter: 'all' | 'activities' | 'manual' | 'focus';
  onFilterChange: (filter: 'all' | 'activities' | 'manual' | 'focus') => void;
  dateKeys: string[];
  activeDate: string | null;
  onDateClick: (date: string) => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filter,
  onFilterChange,
  dateKeys,
  activeDate,
  onDateClick,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex flex-row items-center gap-3 sm:gap-4 flex-wrap">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as typeof filter)}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="activities">Auto</option>
            <option value="focus">Focus</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        
        {/* Date Quick Navigation */}
        {dateKeys.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Quick Dates:</span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 min-w-0 flex-1">
              {dateKeys.map((date) => {
                const dateObj = new Date(date);
                const isActive = activeDate === date;
                const dayNumber = dateObj.getDate();
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <button
                    key={date}
                    onClick={() => onDateClick(date)}
                    className={`
                      flex flex-col items-center justify-center px-2 py-1 rounded-lg text-xs whitespace-nowrap flex-shrink-0 min-w-[35px] border border-gray-300 dark:border-gray-600
                      ${isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }
                    `}
                    title={date}
                  >
                    <div className="font-semibold text-[10px] opacity-75 leading-tight">{dayName}</div>
                    <div className="font-bold text-base leading-tight">{dayNumber}</div>
                    <div className="font-medium text-[10px] opacity-75 leading-tight">{month}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
