import { useMemo } from 'react';
import { format } from 'date-fns';
import { formatDuration, truncate } from '../../utils';
import type { TimelineBlock } from '../../types';

interface TimelineProps {
  blocks: TimelineBlock[];
}

export default function Timeline({ blocks }: TimelineProps) {
  // Calculate timeline boundaries (9 AM to 6 PM by default, or actual bounds)
  const { startHour, endHour, hours } = useMemo(() => {
    if (blocks.length === 0) {
      return { startHour: 9, endHour: 18, hours: Array.from({ length: 10 }, (_, i) => 9 + i) };
    }

    const minTime = Math.min(...blocks.map((b) => b.start));
    const maxTime = Math.max(...blocks.map((b) => b.end));
    
    const minHour = Math.max(0, new Date(minTime).getHours() - 1);
    const maxHour = Math.min(24, new Date(maxTime).getHours() + 1);
    
    const hoursArray = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
    
    return { startHour: minHour, endHour: maxHour, hours: hoursArray };
  }, [blocks]);

  const totalMinutes = (endHour - startHour) * 60;

  // Calculate position and width for each block
  const getBlockStyle = (block: TimelineBlock) => {
    const blockStart = new Date(block.start);
    const blockEnd = new Date(block.end);
    
    const startMinutes = blockStart.getHours() * 60 + blockStart.getMinutes() - startHour * 60;
    const endMinutes = blockEnd.getHours() * 60 + blockEnd.getMinutes() - startHour * 60;
    
    const left = Math.max(0, (startMinutes / totalMinutes) * 100);
    const width = Math.min(100 - left, ((endMinutes - startMinutes) / totalMinutes) * 100);
    
    return {
      left: `${left}%`,
      width: `${Math.max(width, 0.5)}%`,
    };
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timeline</h3>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No activity recorded for this period</p>
        </div>
      ) : (
        <>
          {/* Time labels */}
          <div className="relative h-8 mb-3">
            {hours.map((hour) => {
              const position = ((hour - startHour) / (endHour - startHour)) * 100;
              return (
                <div
                  key={hour}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {format(new Date().setHours(hour, 0), 'HH:mm')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline bar */}
          <div className="relative h-16 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
            {/* Hour markers - vertical lines */}
            {hours.map((hour) => {
              const position = ((hour - startHour) / (endHour - startHour)) * 100;
              return (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 opacity-50"
                  style={{ left: `${position}%` }}
                />
              );
            })}

            {/* Activity blocks */}
            {blocks.map((block, index) => {
              const style = getBlockStyle(block);
              const duration = Math.round((block.end - block.start) / 1000);
              // Use category color, or default gray for uncategorized
              const baseColor = block.category?.color || '#9E9E9E';
              
              // Helper function to convert hex to rgba
              const hexToRgba = (hex: string, alpha: number) => {
                // Remove # if present
                const cleanHex = hex.replace('#', '');
                // Handle both 3-digit and 6-digit hex
                const r = cleanHex.length === 3 
                  ? parseInt(cleanHex[0] + cleanHex[0], 16)
                  : parseInt(cleanHex.slice(0, 2), 16);
                const g = cleanHex.length === 3
                  ? parseInt(cleanHex[1] + cleanHex[1], 16)
                  : parseInt(cleanHex.slice(2, 4), 16);
                const b = cleanHex.length === 3
                  ? parseInt(cleanHex[2] + cleanHex[2], 16)
                  : parseInt(cleanHex.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };
              
              // For idle blocks, use a lighter/muted version of the color
              const backgroundColor = block.is_idle 
                ? hexToRgba(baseColor, 0.5)
                : baseColor;
              
              // Border for categorized blocks
              const borderStyle = block.category 
                ? `1px solid ${hexToRgba(baseColor, 0.25)}`
                : 'none';
              
              return (
                <div
                  key={index}
                  className="absolute top-1 bottom-1 rounded-lg cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-lg hover:z-10 hover:scale-y-110 hover:brightness-110"
                  style={{
                    ...style,
                    backgroundColor: backgroundColor,
                    minWidth: '2px',
                    border: borderStyle,
                  }}
                  title={`${block.app_name}: ${formatDuration(duration)}${block.domain ? ` (${block.domain})` : ''}`}
                >
                  {/* Pattern overlay for idle - diagonal stripes */}
                  {block.is_idle && (
                    <div 
                      className="absolute inset-0 rounded-lg opacity-30" 
                      style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px)',
                        mixBlendMode: 'multiply'
                      }} 
                    />
                  )}
                  {/* Border for manual entries */}
                  {block.is_manual && (
                    <div className="absolute inset-0 rounded-lg border-2 border-white dark:border-gray-800 border-dashed opacity-70" />
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      {block.category?.icon && (
                        <span className="text-base">{block.category.icon}</span>
                      )}
                      <p className="font-bold text-sm">{truncate(block.app_name, 25)}</p>
                    </div>
                    <div className="space-y-0.5 text-gray-300 dark:text-gray-300">
                      <p className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {format(new Date(block.start), 'HH:mm')} - {format(new Date(block.end), 'HH:mm')}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {formatDuration(duration)}
                      </p>
                      {block.category && (
                        <p className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: baseColor }} />
                          {block.category.name}
                        </p>
                      )}
                    </div>
                    {block.is_manual && (
                      <p className="mt-1.5 pt-1.5 border-t border-gray-700 dark:border-gray-600 text-blue-300 dark:text-blue-400 font-medium">
                        📝 Manual entry
                      </p>
                    )}
                    {block.is_idle && (
                      <p className="mt-1.5 pt-1.5 border-t border-gray-700 dark:border-gray-600 text-yellow-300 dark:text-yellow-400 font-medium">
                        ⏸️ Idle time
                      </p>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


          {/* Legend */}
          {Array.from(new Set(blocks.map((b) => b.category?.name).filter(Boolean))).length > 0 && (
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {Array.from(new Set(blocks.map((b) => b.category?.name).filter(Boolean))).map((categoryName) => {
                const block = blocks.find((b) => b.category?.name === categoryName);
                if (!block?.category) return null;
                
                return (
                  <div 
                    key={categoryName} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  >
                    <span
                      className="w-3 h-3 rounded shadow-sm"
                      style={{ backgroundColor: block.category.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {block.category.icon} {block.category.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
