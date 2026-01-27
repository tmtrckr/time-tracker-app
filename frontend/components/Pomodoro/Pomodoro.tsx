import React from 'react';
import PomodoroTimer from './PomodoroTimer';
import { ErrorBoundary } from '../Common/ErrorBoundary';

const Pomodoro: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pomodoro Timer</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Focus sessions with integrated project and task tracking
            </p>
          </div>
        </div>

        {/* Content */}
        <ErrorBoundary>
          <PomodoroTimer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default Pomodoro;
