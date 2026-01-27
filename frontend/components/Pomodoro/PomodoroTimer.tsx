import { useState, useEffect, useRef, useCallback } from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { formatTimerTime } from '../../utils/format';
import { showSuccess, handleApiError } from '../../utils/toast';
import Button from '../Common/Button';
import Card from '../Common/Card';
import PomodoroTransitionModal from './PomodoroTransitionModal';
import { Play, Pause, Square, Coffee, Briefcase, X } from 'lucide-react';

const PomodoroTimer: React.FC = () => {
  const { status, completedSessionType, suggestedNextType, getNextBreakType, startPomodoro, stopPomodoro, pausePomodoro, resumePomodoro, startNextSession, clearCompletedSessionType, clearSuggestedNextType } = usePomodoro();
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(undefined);
  const [pomodoroType, setPomodoroType] = useState<'work' | 'break'>('work');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [nextSessionType, setNextSessionType] = useState<'work' | 'break'>('work');
  const [nextBreakType, setNextBreakType] = useState<'short' | 'long' | undefined>(undefined);
  const isConfirmingRef = useRef(false);
  
  const { tasks } = useTasks(selectedProjectId, false);

  // Filter out archived projects
  const activeProjects = projects.filter(p => !p.is_archived);
  const activeTasks = tasks.filter(t => !t.is_archived);

  // Calculate progress percentage
  const progress = status.total_sec > 0 
    ? ((status.total_sec - status.remaining_sec) / status.total_sec) * 100 
    : 0;

  // Calculate circumference for circular progress (radius = 120, so circumference = 2 * π * 120)
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Colors based on pomodoro type
  const colors = {
    work: {
      primary: '#EF4444', // red-500
      light: '#FEE2E2', // red-100
      dark: '#DC2626', // red-600
    },
    break: {
      primary: '#10B981', // green-500
      light: '#D1FAE5', // green-100
      dark: '#059669', // green-600
    },
  };

  // Use status.pomodoro_type when session is running, otherwise use pomodoroType for selection
  const activePomodoroType = status.is_running ? status.pomodoro_type : pomodoroType;
  const currentColors = colors[activePomodoroType as 'work' | 'break'] || colors.work;

  // TODO: Проверить автопереход между сессиями Work и Break
  // TODO 7: Проверить handleConfirmTransition - нет ли блокировки через isConfirmingRef, которая препятствует автопереходу
  const handleConfirmTransition = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isConfirmingRef.current) {
      return;
    }
    
    isConfirmingRef.current = true;
    try {
      await startNextSession(nextSessionType, selectedProjectId, selectedTaskId);
      setShowTransitionModal(false);
      showSuccess(`${nextSessionType === 'work' ? 'Work' : 'Break'} session started`);
    } catch (err) {
      handleApiError(err, 'Failed to start next session');
      setShowTransitionModal(false);
    } finally {
      isConfirmingRef.current = false;
    }
  }, [startNextSession, nextSessionType, selectedProjectId, selectedTaskId]);

  // TODO: Проверить автопереход между сессиями Work и Break
  // TODO 3: Проверить useEffect, который отслеживает completedSessionType и показывает модальное окно
  // TODO 4: Проверить, что PomodoroTransitionModal получает правильные пропсы (isOpen, type, breakType)
  // TODO 8: Проверить race conditions: может ли модальное окно закрыться до того, как сработает автоподтверждение
  // Handle completed session and show modal (auto-confirm is handled by the modal itself)
  useEffect(() => {
    if (completedSessionType === 'work') {
      const breakType = getNextBreakType();
      setNextSessionType('break');
      setNextBreakType(breakType);
      setShowTransitionModal(true);
      isConfirmingRef.current = false; // Reset flag when showing new modal
    } else if (completedSessionType === 'break') {
      setNextSessionType('work');
      setNextBreakType(undefined);
      setShowTransitionModal(true);
      isConfirmingRef.current = false; // Reset flag when showing new modal
    }
  }, [completedSessionType, getNextBreakType]);

  const handleStart = async () => {
    try {
      await startPomodoro(pomodoroType, selectedProjectId, selectedTaskId);
      showSuccess(`${pomodoroType === 'work' ? 'Work' : 'Break'} session started`);
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

  // Reset selections when stopping
  useEffect(() => {
    if (!status.is_running) {
      setSelectedProjectId(undefined);
      setSelectedTaskId(undefined);
    }
  }, [status.is_running]);

  // Sync pomodoroType with suggestedNextType when context is available
  // When no context, always use 'work'
  useEffect(() => {
    if (!status.is_running) {
      if (suggestedNextType) {
        setPomodoroType(suggestedNextType);
      } else {
        setPomodoroType('work');
      }
    }
  }, [suggestedNextType, status.is_running]);

  const handleSkipTransition = () => {
    setShowTransitionModal(false);
    // Clear completed session type to prevent showing modal again
    clearCompletedSessionType();
    // Don't call stopPomodoro() to preserve context (suggestedNextType)
    // The status is already reset by the completion handler
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Sidebar - Project/Task Selection */}
        <div className="lg:w-96 flex-shrink-0">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project & Task
              </h3>
              
              {/* Suggested Type Indicator */}
              {!status.is_running && suggestedNextType !== null && (
                <div className="mb-4">
                  <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 ${
                    suggestedNextType === 'work'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {suggestedNextType === 'work' ? (
                        <Briefcase className={`w-4 h-4 ${suggestedNextType === 'work' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                      ) : (
                        <Coffee className={`w-4 h-4 ${suggestedNextType === 'break' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                      )}
                      <span className={`text-xs font-medium ${
                        suggestedNextType === 'work'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {suggestedNextType === 'work' ? 'Work' : 'Break'}
                      </span>
                    </div>
                    <button
                      onClick={clearSuggestedNextType}
                      className={`p-1 rounded hover:bg-opacity-20 transition-colors ${
                        suggestedNextType === 'work'
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-600'
                          : 'text-green-600 dark:text-green-400 hover:bg-green-600'
                      }`}
                      title="Reset context"
                      aria-label="Reset context"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Project/Task Selectors */}
              {!status.is_running && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project (optional)
                    </label>
                    <select
                      value={selectedProjectId || ''}
                      onChange={(e) => {
                        const projectId = e.target.value ? Number(e.target.value) : undefined;
                        setSelectedProjectId(projectId);
                        setSelectedTaskId(undefined); // Reset task when project changes
                      }}
                      aria-label="Select project"
                      title="Select project"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">No project</option>
                      {activeProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProjectId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Task (optional)
                      </label>
                      <select
                        value={selectedTaskId || ''}
                        onChange={(e) => {
                          const taskId = e.target.value ? Number(e.target.value) : undefined;
                          setSelectedTaskId(taskId);
                        }}
                        aria-label="Select task"
                        title="Select task"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No task</option>
                        {activeTasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Show selected project/task when running */}
              {status.is_running && (
                <div className="space-y-2 text-sm">
                  {selectedProjectId && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Project:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activeProjects.find(p => p.id === selectedProjectId)?.name || 'Unknown'}
                      </p>
                    </div>
                  )}
                  {selectedTaskId && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Task:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activeTasks.find(t => t.id === selectedTaskId)?.name || 'Unknown'}
                      </p>
                    </div>
                  )}
                  {!selectedProjectId && !selectedTaskId && (
                    <p className="text-gray-500 dark:text-gray-400">No project/task selected</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side - Timer */}
        <div className="flex-1">
          <Card>
            <div className="flex flex-col items-center p-8">
              {/* Timer Display */}
              <div className="relative mb-8">
                {/* Circular Progress */}
                <svg className="transform -rotate-90" width="280" height="280">
                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    stroke={currentColors.primary}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-6xl font-bold mb-2"
                    style={{ color: currentColors.primary }}
                  >
                    {formatTimerTime(status.remaining_sec)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium uppercase">
                    {status.pomodoro_type === 'work' ? 'Work Session' : 'Break Time'}
                  </div>
                  {status.is_running && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {status.is_active ? 'Running' : 'Paused'}
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!status.is_running ? (
                  <Button
                    onClick={handleStart}
                    variant="primary"
                    size="lg"
                    className="px-8"
                    style={{ backgroundColor: currentColors.primary }}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <>
                    {status.is_active ? (
                      <Button
                        onClick={handlePause}
                        variant="secondary"
                        size="lg"
                        className="px-8"
                      >
                        <Pause className="w-5 h-5 mr-0 lg:mr-2" />
                        <span className="hidden lg:inline">Pause</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleResume}
                        variant="primary"
                        size="lg"
                        className="px-8"
                        style={{ backgroundColor: currentColors.primary }}
                      >
                        <Play className="w-5 h-5 mr-0 lg:mr-2" />
                        <span className="hidden lg:inline">Resume</span>
                      </Button>
                    )}
                    <Button
                      onClick={handleStop}
                      variant="ghost"
                      size="lg"
                      className="px-8"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Transition Modal */}
      <PomodoroTransitionModal
        isOpen={showTransitionModal}
        type={completedSessionType || 'work'}
        breakType={nextBreakType}
        onConfirm={handleConfirmTransition}
        onCancel={handleSkipTransition}
      />
    </>
  );
};

export default PomodoroTimer;
