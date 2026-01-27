import React, { useMemo } from 'react';
import { useFocusSessions } from '../../hooks/useFocusSessions';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { formatTime, formatDuration, formatDate } from '../../utils/format';
import DateRangeSelector from '../Layout/DateRangeSelector';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useStore } from '../../store';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Briefcase, Coffee, CheckCircle2, XCircle } from 'lucide-react';

const FocusSessions: React.FC = () => {
  const dateRangePreset = useStore((state) => state.dateRangePreset);
  const customStartTimestamp = useStore((state) => 
    state.dateRangePreset === 'custom' 
      ? (state.selectedDateRange.start instanceof Date 
          ? state.selectedDateRange.start.getTime() 
          : new Date(state.selectedDateRange.start).getTime())
      : null
  );
  const customEndTimestamp = useStore((state) => 
    state.dateRangePreset === 'custom'
      ? (state.selectedDateRange.end instanceof Date 
          ? state.selectedDateRange.end.getTime() 
          : new Date(state.selectedDateRange.end).getTime())
      : null
  );

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (dateRangePreset) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'custom':
        return {
          start: customStartTimestamp !== null ? new Date(customStartTimestamp) : startOfDay(now),
          end: customEndTimestamp !== null ? new Date(customEndTimestamp) : endOfDay(now),
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
    }
  }, [dateRangePreset, customStartTimestamp, customEndTimestamp]);

  const { sessions, loading, error } = useFocusSessions({
    start: dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start),
    end: dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end),
  });

  const { projects } = useProjects();
  // Get all tasks for all projects
  const { tasks: allTasks } = useTasks(undefined, false);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof sessions> = {};
    
    sessions.forEach((session) => {
      const date = new Date(session.started_at * 1000);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });

    // Sort sessions within each group by start time (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => b.started_at - a.started_at);
    });

    return groups;
  }, [sessions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_sec || 0), 0);
    const workSessions = sessions.filter(s => s.pomodoro_type === 'work').length;
    const breakSessions = sessions.filter(s => s.pomodoro_type === 'break').length;

    return {
      totalSessions,
      completedSessions,
      totalDuration,
      workSessions,
      breakSessions,
    };
  }, [sessions]);

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || null;
  };

  const getTaskName = (taskId: number | null) => {
    if (!taskId) return null;
    const task = allTasks.find(t => t.id === taskId);
    return task?.name || null;
  };

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Error loading focus sessions: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Focus Sessions</h2>
        <DateRangeSelector />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedSessions}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(stats.totalDuration)}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Work / Break</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.workSessions} / {stats.breakSessions}
            </p>
          </div>
        </Card>
      </div>

      {/* Sessions List */}
      {loading ? (
        <Card>
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No focus sessions found for the selected period.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([dateKey, daySessions]) => (
              <Card key={dateKey}>
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(new Date(dateKey))}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-3">
                  {daySessions.map((session) => {
                    const isWork = session.pomodoro_type === 'work';
                    const projectName = getProjectName(session.project_id);
                    const taskName = getTaskName(session.task_id);

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Type Icon */}
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              isWork
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}
                          >
                            {isWork ? (
                              <Briefcase className="w-5 h-5" />
                            ) : (
                              <Coffee className="w-5 h-5" />
                            )}
                          </div>

                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-sm font-medium ${
                                  isWork
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-green-700 dark:text-green-300'
                                }`}
                              >
                                {isWork ? 'Work' : 'Break'}
                              </span>
                              {session.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTime(session.started_at * 1000, '24h')}
                              {session.duration_sec > 0 && (
                                <span className="ml-2">• {formatDuration(session.duration_sec)}</span>
                              )}
                            </div>
                            {(projectName || taskName) && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {projectName && <span>{projectName}</span>}
                                {projectName && taskName && <span> • </span>}
                                {taskName && <span>{taskName}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default FocusSessions;
