import { useState, useEffect, useCallback } from 'react';
import { GoalAlert } from '../../types';
import { formatDuration } from '../../utils/format';
import { api } from '../../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';

interface GoalAlertsProps {
  onGoalClick?: (goalId: number) => void;
  maxAlerts?: number;
}

const GoalAlerts: React.FC<GoalAlertsProps> = ({ 
  onGoalClick,
  maxAlerts = 5 
}) => {
  const [alerts, setAlerts] = useState<GoalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.goals.checkGoalAlerts();
      setAlerts(data.slice(0, maxAlerts));
    } catch (error) {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [maxAlerts]);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Goal Alerts
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAlerts}
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {alerts.map((alert) => {
            const isCompleted = alert.alert_type === 'completed';
            
            return (
              <div
                key={alert.goal_id}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}
                onClick={() => onGoalClick?.(alert.goal_id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 ${
                    isCompleted 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {alert.goal_name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        isCompleted
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      }`}>
                        {isCompleted ? 'Completed' : '80%+'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {formatDuration(alert.current_seconds)} / {formatDuration(alert.target_seconds)}
                      </span>
                      <span className="font-semibold">
                        {alert.percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    {isCompleted && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        🎉 Congratulations! You've achieved your goal!
                      </p>
                    )}
                    {!isCompleted && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        ⚠️ You're making great progress! Keep it up!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {alerts.length >= maxAlerts && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            Showing {maxAlerts} of {alerts.length} alerts
          </p>
        )}
      </div>
    </Card>
  );
};

export default GoalAlerts;
