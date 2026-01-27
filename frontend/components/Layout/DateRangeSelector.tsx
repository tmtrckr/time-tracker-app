import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import type { DateRangePreset } from '../../types';
import { startOfDay, endOfDay } from 'date-fns';

const presets: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

export default function DateRangeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { dateRangePreset, setDateRangePreset, setSelectedDateRange, getDateRange } = useStore();

  const currentPreset = presets.find((p) => p.id === dateRangePreset);
  const range = getDateRange();
  // Ensure dates are Date objects (defensive check)
  const start = range.start instanceof Date ? range.start : new Date(range.start);
  const end = range.end instanceof Date ? range.end : new Date(range.end);

  const handleSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
      // Don't close the dropdown yet, wait for custom picker
    } else {
      setDateRangePreset(preset);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomRangeApply = (startDate: Date, endDate: Date) => {
    setSelectedDateRange({
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });
    setDateRangePreset('custom');
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const formatRange = () => {
    if (dateRangePreset === 'today') {
      return format(start, 'EEEE, MMMM d');
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowCustomPicker(false);
        }}
        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 min-w-0"
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <div className="text-left min-w-0 flex-1 hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentPreset?.label}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{formatRange()}</p>
        </div>
        <div className="text-left min-w-0 flex-1 sm:hidden">
          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
            {currentPreset?.label}
          </p>
        </div>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => {
              setIsOpen(false);
              setShowCustomPicker(false);
            }}
          />

          {/* Dropdown */}
          <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[100] animate-fade-in overflow-hidden ${
            showCustomPicker ? 'w-[calc(100vw-2rem)] sm:w-80' : 'w-48 sm:w-56'
          }`}>
            {!showCustomPicker ? (
              <div className="py-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      dateRangePreset === preset.id
                        ? 'text-primary-700 dark:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <CustomDateRangePicker
                initialStart={start}
                initialEnd={end}
                onApply={handleCustomRangeApply}
                onCancel={() => {
                  setShowCustomPicker(false);
                  setIsOpen(false);
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CustomDateRangePicker({
  initialStart,
  initialEnd,
  onApply,
  onCancel,
}: {
  initialStart: Date;
  initialEnd: Date;
  onApply: (start: Date, end: Date) => void;
  onCancel: () => void;
}) {
  const [startDate, setStartDate] = useState(format(initialStart, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(initialEnd, 'yyyy-MM-dd'));

  const handleApply = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }
    
    // Ensure start is before end
    if (start > end) {
      return;
    }
    
    onApply(start, end);
  };

  return (
    <div className="p-3 sm:p-4 w-full min-w-0">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
        Select Date Range
      </h3>
      
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="start-date" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            aria-label="Start Date"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            aria-label="End Date"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
