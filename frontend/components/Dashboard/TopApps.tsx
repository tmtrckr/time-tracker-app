import { formatDuration, calculatePercentage, getAppColor } from '../../utils';
import type { AppStats } from '../../types';

interface TopAppsProps {
  apps: AppStats[];
  totalDuration: number;
}

export default function TopApps({ apps, totalDuration }: TopAppsProps) {
  const displayedApps = apps.slice(0, 7);
  const maxDuration = displayedApps.length > 0 ? displayedApps[0].duration_sec : 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Applications</h3>
      </div>
      
      <div className="space-y-5">
        {displayedApps.map((app, index) => {
          const percentage = calculatePercentage(app.duration_sec, totalDuration);
          const barWidth = calculatePercentage(app.duration_sec, maxDuration);
          const color = app.category?.color || getAppColor(app.app_name);

          return (
            <div key={app.app_name} className="relative group">
              {/* App info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-gray-400 dark:text-gray-500 text-sm font-bold w-6 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{app.app_name}</span>
                  {app.category && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${app.category.color}15`,
                        color: app.category.color,
                        border: `1px solid ${app.category.color}30`,
                      }}
                    >
                      {app.category.icon} {app.category.name}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {formatDuration(app.duration_sec)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}

        {displayedApps.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No activity recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
