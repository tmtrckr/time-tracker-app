import { useState, useEffect } from 'react';
import { useGoals } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useProjects } from '../../hooks/useProjects';
import { GoalProgress } from '../../types';
import { formatDurationCompact } from '../../utils/format';
import { getGoalDateRange, getGoalProgressColor, getGoalProgressTextColor, getAlertType, formatGoalName } from '../../utils/goals';
import { api } from '../../services/api';
import Card from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GoalProgressWidget() {
  const { goals, loading: goalsLoading } = useGoals(true); // Only active goals
  const { data: categories = [] } = useCategories();
  const { projects } = useProjects(false);
  
  const [goalProgresses, setGoalProgresses] = useState<Map<number, GoalProgress>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Load progress for all active goals
  useEffect(() => {
    if (goals.length === 0) {
      setGoalProgresses(new Map());
      return;
    }

    const loadProgresses = async () => {
      setLoadingProgress(true);
      try {
        const progresses = new Map<number, GoalProgress>();
        
        await Promise.all(
          goals.map(async (goal) => {
            try {
              const dateRange = getGoalDateRange(goal);
              const progress = await api.goals.getGoalProgress(goal.id, dateRange);
              progresses.set(goal.id, progress);
            } catch (error) {
              // Silently handle error - goal progress is optional
            }
          })
        );
        
        setGoalProgresses(progresses);
      } catch (error) {
        // Silently handle error - goal progress is optional
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgresses();

    // Refresh progress every minute
    const interval = setInterval(loadProgresses, 60000);
    return () => clearInterval(interval);
  }, [goals]);

  const isLoading = goalsLoading || loadingProgress;

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.active);
  
  if (activeGoals.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Goal Progress</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No active goals set
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
          <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Goal Progress</h3>
      </div>

      <div className="space-y-4">
        {activeGoals.slice(0, 3).map((goal) => {
          const progress = goalProgresses.get(goal.id);
          const percentage = progress?.percentage || 0;
          const currentSeconds = progress?.current_seconds || 0;
          const remainingSeconds = progress?.remaining_seconds || goal.target_seconds;
          const alertType = getAlertType(percentage);
          
          const category = goal.category_id 
            ? categories.find(c => c.id === goal.category_id) || null
            : null;
          const project = goal.project_id
            ? projects.find(p => p.id === goal.project_id) || null
            : null;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border ${
                alertType === 'completed'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : alertType === 'warning'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatGoalName(goal, category?.name, project?.name)}
                    </span>
                    {alertType && (
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                        alertType === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                      }`}>
                        {alertType === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span className="font-medium">
                          {alertType === 'completed' ? 'Done' : '80%+'}
                        </span>
                      </div>
                    )}
                  </div>
                  {(category || project) && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {category && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                          {category.icon} {category.name}
                        </span>
                      )}
                      {project && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${project.color || '#888888'}20`, color: project.color || '#888888' }}>
                          {project.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDurationCompact(currentSeconds)}
                  </span>
                  <span className={`font-semibold ${getGoalProgressTextColor(percentage)}`}>
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDurationCompact(goal.target_seconds)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getGoalProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {remainingSeconds > 0 
                    ? `Remaining: ${formatDurationCompact(remainingSeconds)}`
                    : 'Goal achieved! 🎉'
                  }
                </div>
              </div>
            </div>
          );
        })}

        {activeGoals.length > 3 && (
          <div className="text-center pt-2 text-sm text-gray-500 dark:text-gray-400">
            +{activeGoals.length - 3} more goal{activeGoals.length - 3 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  );
}
