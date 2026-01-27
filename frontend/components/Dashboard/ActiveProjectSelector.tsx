import { useState, useEffect } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { api } from '../../services/api';
import Card from '../Common/Card';
import Button from '../Common/Button';
import { Target, RotateCcw } from 'lucide-react';
import { showSuccess, handleApiError } from '../../utils/toast';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function ActiveProjectSelector() {
  const { projects, loading: projectsLoading } = useProjects(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeProjects = projects.filter(p => !p.is_archived);
  const { tasks, loading: tasksLoading } = useTasks(activeProjectId || undefined, false);

  // Load active project/task on mount
  useEffect(() => {
    const loadActive = async () => {
      try {
        const projectId = await api.activeProject.get();
        const taskId = await api.activeTask.get();
        setActiveProjectId(projectId);
        setActiveTaskId(taskId);
      } catch (err) {
        handleApiError(err, 'Failed to load active project');
      } finally {
        setLoading(false);
      }
    };
    loadActive();
  }, []);

  const handleProjectChange = async (projectId: number | null) => {
    setSaving(true);
    try {
      await api.activeProject.set(projectId);
      setActiveProjectId(projectId);
      // Clear task if project is cleared
      if (projectId === null) {
        await api.activeTask.set(null);
        setActiveTaskId(null);
      }
      showSuccess(projectId ? 'Active project set' : 'Active project cleared');
    } catch (err) {
      handleApiError(err, 'Failed to set active project');
    } finally {
      setSaving(false);
    }
  };

  const handleTaskChange = async (taskId: number | null) => {
    setSaving(true);
    try {
      await api.activeTask.set(taskId);
      setActiveTaskId(taskId);
      showSuccess(taskId ? 'Active task set' : 'Active task cleared');
    } catch (err) {
      handleApiError(err, 'Failed to set active task');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await api.activeProject.set(null);
      await api.activeTask.set(null);
      setActiveProjectId(null);
      setActiveTaskId(null);
      showSuccess('Active project cleared');
    } catch (err) {
      handleApiError(err, 'Failed to clear active project');
    } finally {
      setSaving(false);
    }
  };

  if (loading || projectsLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const activeProject = activeProjectId 
    ? activeProjects.find(p => p.id === activeProjectId)
    : null;
  const activeTask = activeTaskId && tasks.length > 0
    ? tasks.find(t => t.id === activeTaskId)
    : null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Project/Task
        </h3>
      </div>

      <div className="space-y-4">
        {/* Current Active Project/Task Display */}
        {(activeProject || activeTask) && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Currently tracking:</div>
                {activeProject && (
                  <div className="font-medium text-gray-900 dark:text-white">
                    {activeProject.name}
                    {activeProject.client_name && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({activeProject.client_name})
                      </span>
                    )}
                  </div>
                )}
                {activeTask && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Task: {activeTask.name}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={saving}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Clear active project/task"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Project Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project
          </label>
          <select
            value={activeProjectId || ''}
            onChange={(e) => {
              const projectId = e.target.value ? Number(e.target.value) : null;
              handleProjectChange(projectId);
            }}
            disabled={saving}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">No active project</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.client_name && ` (${project.client_name})`}
              </option>
            ))}
          </select>
        </div>

        {/* Task Selector */}
        {activeProjectId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task (optional)
            </label>
            {tasksLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : (
              <select
                value={activeTaskId || ''}
                onChange={(e) => {
                  const taskId = e.target.value ? Number(e.target.value) : null;
                  handleTaskChange(taskId);
                }}
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No active task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            )}
            {tasks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No tasks available for this project
              </p>
            )}
          </div>
        )}

        {!activeProjectId && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a project to automatically assign it to tracked activities
          </p>
        )}
      </div>
    </Card>
  );
}
