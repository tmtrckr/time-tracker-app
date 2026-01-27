import { useMemo } from 'react';
import { useActivities } from '../../hooks/useActivities';
import { useProjects } from '../../hooks/useProjects';
import { useFocusSessions } from '../../hooks/useFocusSessions';
import { useStore } from '../../store';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatDuration, calculatePercentage } from '../../utils/format';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import { FolderKanban } from 'lucide-react';

interface ProjectStat {
  projectId: number | null;
  projectName: string;
  duration_sec: number;
  percentage: number;
  color: string;
}

export default function ProjectBreakdown() {
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { projects, loading: projectsLoading } = useProjects(false);
  
  // Get date range from store for focus sessions
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
  
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return {
          start: customStartTimestamp !== null ? new Date(customStartTimestamp) : startOfDay(now),
          end: customEndTimestamp !== null ? new Date(customEndTimestamp) : endOfDay(now),
        };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [dateRangePreset, customStartTimestamp, customEndTimestamp]);
  
  const { sessions: focusSessions, loading: focusSessionsLoading } = useFocusSessions(dateRange);

  const isLoading = activitiesLoading || projectsLoading || focusSessionsLoading;

  const projectStats = useMemo(() => {
    if ((!activities || activities.length === 0) && (!focusSessions || focusSessions.length === 0)) {
      return [];
    }

    // Filter out idle activities
    const activeActivities = activities?.filter(a => !a.is_idle) || [];
    
    // Получить focus sessions за период
    const workSessions = (focusSessions || []).filter(s => 
      s.pomodoro_type === 'work' && 
      s.completed && 
      s.project_id !== null &&
      s.duration_sec > 0
    );
    
    // Создать карту времени из focus sessions по проектам
    const focusSessionTimeByProject = new Map<number, number>();
    workSessions.forEach(session => {
      const projectId = session.project_id!;
      const current = focusSessionTimeByProject.get(projectId) || 0;
      focusSessionTimeByProject.set(projectId, current + session.duration_sec);
    });
    
    // Создать карту перекрывающихся activities (которые попадают в период focus sessions)
    const overlappingActivityIds = new Set<number>();
    workSessions.forEach(session => {
      const sessionStart = session.started_at;
      const sessionEnd = session.ended_at || (session.started_at + session.duration_sec);
      
      activeActivities.forEach(activity => {
        const activityStart = activity.started_at;
        const activityEnd = activity.started_at + activity.duration_sec;
        
        // Проверить перекрытие по времени и project_id
        if (activity.project_id === session.project_id &&
            activityStart < sessionEnd && 
            activityEnd > sessionStart) {
          overlappingActivityIds.add(activity.id!);
        }
      });
    });
    
    // Рассчитать время по проектам: приоритет focus sessions
    const projectMap = new Map<number | null, number>();
    
    // Сначала добавить время из activities, исключая перекрывающиеся
    activeActivities.forEach(activity => {
      if (!overlappingActivityIds.has(activity.id!)) {
        const projectId = activity.project_id ?? null;
        const current = projectMap.get(projectId) || 0;
        projectMap.set(projectId, current + activity.duration_sec);
      }
    });
    
    // Затем добавить время из focus sessions (приоритет)
    focusSessionTimeByProject.forEach((duration, projectId) => {
      const current = projectMap.get(projectId) || 0;
      projectMap.set(projectId, current + duration);
    });
    
    // Calculate total duration
    const totalDuration = Array.from(projectMap.values()).reduce((sum, d) => sum + d, 0);
    
    if (totalDuration === 0) {
      return [];
    }

    // Convert to array and enrich with project info
    const stats: ProjectStat[] = Array.from(projectMap.entries())
      .map(([projectId, duration_sec]) => {
        const project = projectId ? projects.find(p => p.id === projectId) : null;
        const projectName = project 
          ? project.name 
          : projectId === null 
            ? 'No Project' 
            : `Project #${projectId}`;
        
        const color = project?.color || '#9E9E9E';
        
        return {
          projectId,
          projectName,
          duration_sec,
          percentage: calculatePercentage(duration_sec, totalDuration),
          color,
        };
      })
      .sort((a, b) => b.duration_sec - a.duration_sec)
      .slice(0, 10); // Top 10 projects

    return stats;
  }, [activities, projects, focusSessions]);

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const maxDuration = projectStats.length > 0 ? projectStats[0].duration_sec : 1;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <FolderKanban className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Breakdown</h3>
      </div>

      {projectStats.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No project activity recorded for this period
        </div>
      ) : (
        <div className="space-y-4">
          {projectStats.map((stat, index) => {
            const barWidth = calculatePercentage(stat.duration_sec, maxDuration);
            
            return (
              <div key={stat.projectId ?? 'no-project'} className="relative group">
                {/* Project info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-bold w-6 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {stat.projectName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {formatDuration(stat.duration_sec)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
