import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalProgress, Category, Project } from '../../types';
import { formatDuration, formatDurationCompact } from '../../utils/format';
import { getGoalDateRange, getGoalProgressColor, getGoalProgressTextColor, getAlertType, formatGoalName } from '../../utils/goals';
import { api } from '../../services/api';
import { Edit2, CheckCircle2, AlertCircle, Target, Power } from 'lucide-react';
import Button from '../Common/Button';
import Card from '../Common/Card';

interface GoalCardProps {
  goal: Goal;
  category?: Category | null;
  project?: Project | null;
  progress?: GoalProgress | null;
  onEdit: (goal: Goal) => void;
  onDelete: (id: number) => void;
  onToggleActive: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  category,
  project,
  progress,
  onEdit,
  onDelete: _onDelete,
  onToggleActive,
}) => {
  const [currentProgress, setCurrentProgress] = useState<GoalProgress | null>(progress || null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const loadProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const dateRange = getGoalDateRange(goal);
      const progressData = await api.goals.getGoalProgress(goal.id, dateRange);
      setCurrentProgress(progressData);
    } catch (error) {
      // Silently handle error - goal progress is optional
    } finally {
      setLoadingProgress(false);
    }
  }, [goal]);

  useEffect(() => {
    if (!currentProgress) {
      loadProgress();
    }
  }, [goal.id, currentProgress, loadProgress]);

  // Refresh progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadProgress();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadProgress]);

  const percentage = currentProgress?.percentage || 0;
  const currentSeconds = currentProgress?.current_seconds || 0;
  const remainingSeconds = currentProgress?.remaining_seconds || goal.target_seconds;
  const alertType = getAlertType(percentage);

  return (
    <Card className={`${!goal.active ? 'opacity-60' : ''} ${alertType === 'completed' ? 'border-green-500 border-2' : alertType === 'warning' ? 'border-blue-500 border-2' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatGoalName(goal, category?.name, project?.name)}
              </h3>
              {!goal.active && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  Inactive
                </span>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </span>
              )}
              {project && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: `${project.color || '#888888'}20`, color: project.color || '#888888' }}>
                  <span>{project.name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Alert Badge */}
          {alertType && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              alertType === 'completed' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}>
              {alertType === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {alertType === 'completed' ? 'Completed' : '80%+'}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              {loadingProgress ? 'Loading...' : formatDuration(currentSeconds)}
            </span>
            <span className={`font-semibold ${getGoalProgressTextColor(percentage)}`}>
              {percentage.toFixed(1)}%
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDuration(goal.target_seconds)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${getGoalProgressColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {remainingSeconds > 0 
                ? `Remaining: ${formatDurationCompact(remainingSeconds)}`
                : 'Goal achieved!'
              }
            </span>
            <span>
              {new Date(goal.start_date * 1000).toLocaleDateString()}
              {goal.end_date && ` - ${new Date(goal.end_date * 1000).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(goal)}
            title="Edit goal"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onToggleActive(goal)}
            title={goal.active ? 'Deactivate goal' : 'Activate goal'}
            className="whitespace-nowrap min-w-fit"
          >
            <Power className="w-4 h-4 mr-1" />
            {goal.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GoalCard;
