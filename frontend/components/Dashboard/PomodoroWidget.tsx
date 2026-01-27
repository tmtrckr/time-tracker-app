import React from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { formatTimerTime } from '../../utils/format';
import Card from '../Common/Card';
import Button from '../Common/Button';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { showSuccess, handleApiError } from '../../utils/toast';

const PomodoroWidget: React.FC = () => {
  const { status, startPomodoro, stopPomodoro, pausePomodoro, resumePomodoro } = usePomodoro();

  const handleStart = async () => {
    try {
      await startPomodoro('work');
      showSuccess('Work session started');
    } catch (err) {
      handleApiError(err, 'Failed to start Pomodoro');
    }
  };

  const handleStop = async () => {
    try {
      await stopPomodoro();
      showSuccess('Pomodoro stopped');
    } catch (err) {
      handleApiError(err, 'Failed to stop Pomodoro');
    }
  };

  const handlePause = () => {
    pausePomodoro();
  };

  const handleResume = () => {
    resumePomodoro();
  };

  const isActive = status.is_running && status.is_active;
  const isPaused = status.is_running && !status.is_active;
  const progress = status.total_sec > 0 
    ? ((status.total_sec - status.remaining_sec) / status.total_sec) * 100 
    : 0;

  const colors = {
    work: {
      primary: '#EF4444',
      light: '#FEE2E2',
    },
    break: {
      primary: '#10B981',
      light: '#D1FAE5',
    },
  };

  const currentColors = colors[status.pomodoro_type as 'work' | 'break'] || colors.work;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pomodoro Timer</h3>
        </div>
      </div>

      {status.is_running ? (
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div
              className="text-4xl font-bold mb-1"
              style={{ color: currentColors.primary }}
            >
              {formatTimerTime(status.remaining_sec)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {status.pomodoro_type} {isPaused && '(Paused)'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                backgroundColor: currentColors.primary,
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {isActive ? (
              <Button
                onClick={handlePause}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={handleResume}
                variant="primary"
                size="sm"
                className="flex-1"
                style={{ backgroundColor: currentColors.primary }}
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            <Button
              onClick={handleStop}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Start a focus session to track your work time
          </p>
          <Button
            onClick={handleStart}
            variant="primary"
            size="md"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Work Session
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PomodoroWidget;
