import React from 'react';
import { Inbox } from 'lucide-react';
import { HistoryItem as HistoryItemType } from './HistoryItem';
import { HistoryDateHeader } from './HistoryDateHeader';
import { ActivityItem, ManualItem } from './HistoryItem';
import { Activity, ManualEntry } from '../../types';

interface HistoryListProps {
  groupedItems: Record<string, HistoryItemType[]>;
  selectedItem: string | null;
  onSelectItem: (id: string) => void;
  getCategoryInfo: (categoryId?: number) => { name: string; color: string; icon: string };
  isActivityInProgress?: Set<number>;
  onEditEntry?: (entry: ManualEntry) => void;
  onDeleteActivity?: (id: number) => void;
  onDeleteManualEntry?: (id: number) => void;
  onCreateRule?: (activity: Activity) => void;
  isDeletingActivity?: boolean;
  isDeletingManualEntry?: boolean;
  dateHeadersRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  groupedItems,
  selectedItem,
  onSelectItem,
  getCategoryInfo,
  isActivityInProgress = new Set(),
  onEditEntry,
  onDeleteActivity,
  onDeleteManualEntry,
  onCreateRule,
  isDeletingActivity = false,
  isDeletingManualEntry = false,
  dateHeadersRef,
  containerRef,
}) => {
  const dateKeys = Object.keys(groupedItems).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (dateKeys.length === 0) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-gray-600 dark:text-gray-400">
          No records for the selected period
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {dateKeys.map((date) => {
          const items = groupedItems[date];
          return (
            <div key={date}>
              <HistoryDateHeader
                date={date}
                itemsCount={items.length}
                innerRef={(el) => {
                  if (el) {
                    dateHeadersRef.current.set(date, el);
                  } else {
                    dateHeadersRef.current.delete(date);
                  }
                }}
              />
              <div className="space-y-3">
                {items.map((item) => {
                  const isSelected = selectedItem === item.id;
                  const commonProps = {
                    item,
                    isSelected,
                    onSelect: onSelectItem,
                    getCategoryInfo,
                  };

                  if (item.type === 'activity') {
                    return (
                      <ActivityItem
                        key={item.id}
                        {...commonProps}
                        item={item as HistoryItemType & { data: Activity }}
                        isActivityInProgress={isActivityInProgress}
                        onCreateRule={onCreateRule}
                        onDeleteActivity={onDeleteActivity}
                        isDeletingActivity={isDeletingActivity}
                      />
                    );
                  }
                  if (item.type === 'manual') {
                    return (
                      <ManualItem
                        key={item.id}
                        {...commonProps}
                        item={item as HistoryItemType & { data: ManualEntry }}
                        onEdit={onEditEntry}
                        onDeleteManualEntry={onDeleteManualEntry}
                        isDeletingManualEntry={isDeletingManualEntry}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
