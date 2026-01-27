import React, { useState, useEffect } from 'react';
import { Task, Project } from '../../types';
import Button from '../Common/Button';
import { Check, X, Trash2 } from 'lucide-react';

interface TaskFormProps {
  projects: Project[];
  task?: Task | null;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (taskId: number) => Promise<void>;
  isSubmitting?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  projects,
  task,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    project_id: undefined,
    name: '',
    description: null,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        project_id: task.project_id,
        name: task.name,
        description: task.description ?? null,
      });
    } else {
      setFormData({
        project_id: undefined,
        name: '',
        description: null,
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      const { showError } = await import('../../utils/toast');
      showError('Please enter a task name');
      return;
    }

    if (!formData.project_id) {
      const { showError } = await import('../../utils/toast');
      showError('Please select a project');
      return;
    }

    const taskData: Partial<Task> = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      project_id: formData.project_id,
    };

    if (task) {
      taskData.id = task.id;
      taskData.is_archived = task.is_archived;
    }

    await onSubmit(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project *
          </label>
          <select
            value={formData.project_id || ''}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            disabled={!!task} // Don't allow changing project for existing tasks
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {task && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Project cannot be changed for existing tasks
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Task name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Task description (optional)"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2 justify-between">
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="success"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                {task ? 'Save' : 'Create'}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
        {task && onDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                await onDelete(task.id);
              }
            }}
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
