import React, { useState } from 'react';
import { Task } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import Toggle from '../Common/Toggle';
import TaskForm from './TaskForm';
import { Edit2, Archive, RotateCcw, Trash2, Filter } from 'lucide-react';

const Tasks: React.FC = () => {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { projects } = useProjects();
  const { tasks, loading, error, refetch, createTask, updateTask, deleteTask } = useTasks(selectedProjectId, includeArchived);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!taskData.project_id) {
      const { showError } = await import('../../utils/toast');
      showError('Please select a project');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTask({
        project_id: taskData.project_id,
        name: taskData.name || '',
        description: taskData.description ?? null,
      });
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Task created successfully');
      setShowNewForm(false);
      // Refresh the list to ensure consistency and clear any previous errors
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTaskId) return;
    
    try {
      setIsSubmitting(true);
      const task = tasks.find(t => t.id === editingTaskId);
      if (!task) return;

      // Prevent editing archived tasks
      if (task.is_archived) {
        const { showError } = await import('../../utils/toast');
        showError('Cannot edit archived tasks. Please restore the task first.');
        setEditingTaskId(null);
        return;
      }

      await updateTask({
        ...task,
        ...taskData,
      } as Task);
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Task updated successfully');
      setEditingTaskId(null);
      // Refresh the list to ensure consistency
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveTask = async (id: number, archive: boolean) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      // If archiving a task that's being edited, cancel editing
      if (archive && editingTaskId === id) {
        setEditingTaskId(null);
      }

      await updateTask({
        ...task,
        is_archived: archive,
      });
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess(archive ? 'Task archived' : 'Task restored');
      // Refresh the list to update the task's position
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, `Failed to ${archive ? 'archive' : 'restore'} task`);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTask(id);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Task deleted successfully');
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to delete task');
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project #${projectId}`;
  };

  const getProjectColor = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#888888';
  };

  const activeTasks = tasks.filter(t => !t.is_archived);
  const archivedTasks = tasks.filter(t => t.is_archived);

  // Group tasks by project
  const tasksByProject = activeTasks.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = [];
    }
    acc[task.project_id].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  const archivedTasksByProject = archivedTasks.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = [];
    }
    acc[task.project_id].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Warning */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Warning: {error}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              You can still create new tasks.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="ml-4"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your tasks and organize work by projects
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle
            checked={includeArchived}
            onChange={setIncludeArchived}
            label="Show archived"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowNewForm(true);
              setEditingTaskId(null);
            }}
            disabled={showNewForm}
          >
            + New Task
          </Button>
        </div>
      </div>

      {/* Project Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Projects</option>
            {projects.filter(p => !p.is_archived).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* New Task Form */}
      {showNewForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 shadow-sm border-2 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Task
          </h2>
          <TaskForm
            projects={projects.filter(p => !p.is_archived)}
            onSubmit={handleCreateTask}
            onCancel={() => setShowNewForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Active Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Tasks ({activeTasks.length})
        </h2>
        
        {activeTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedProjectId 
                ? `No active tasks for ${getProjectName(selectedProjectId)}. Create your first task to get started.`
                : 'No active tasks. Create your first task to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByProject).map(([projectId, projectTasks]) => (
              <div key={projectId} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getProjectColor(Number(projectId)) }}
                  />
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                    {getProjectName(Number(projectId))}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({projectTasks.length})
                  </span>
                </div>
                {projectTasks.map((task) => (
                  <div key={task.id}>
                    {editingTaskId === task.id ? (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                          Edit Task
                        </h3>
                        <TaskForm
                          projects={projects.filter(p => !p.is_archived)}
                          task={task}
                          onSubmit={handleUpdateTask}
                          onCancel={() => setEditingTaskId(null)}
                          onDelete={async (id) => {
                            await handleDeleteTask(id);
                            setEditingTaskId(null);
                          }}
                          isSubmitting={isSubmitting}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-6">
                        {/* Project Color Indicator */}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getProjectColor(task.project_id) }}
                        />
                        
                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {task.name}
                            </h3>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Project: {getProjectName(task.project_id)}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingTaskId(task.id)}
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleArchiveTask(task.id, true)}
                            title="Archive task"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Tasks */}
      {includeArchived && archivedTasks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Archived Tasks ({archivedTasks.length})
          </h2>
          
          <div className="space-y-6">
            {Object.entries(archivedTasksByProject).map(([projectId, projectTasks]) => (
              <div key={projectId} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getProjectColor(Number(projectId)) }}
                  />
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                    {getProjectName(Number(projectId))}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({projectTasks.length})
                  </span>
                </div>
                {projectTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg opacity-75 ml-6">
                    {/* Project Color Indicator */}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProjectColor(task.project_id) }}
                    />
                    
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-600 dark:text-gray-400 line-through">
                          {task.name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          Archived
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {task.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Project: {getProjectName(task.project_id)}
                      </p>
                    </div>
                    
                    {/* Actions - Only Restore and Delete for archived tasks */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleArchiveTask(task.id, false)}
                        title="Restore to Active"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
