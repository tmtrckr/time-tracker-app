import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import Button from '../Common/Button';
import Toggle from '../Common/Toggle';
import { Check, X, Trash2 } from 'lucide-react';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (project: Partial<Project>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (projectId: number) => Promise<void>;
  isSubmitting?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client_name: null,
    color: '#888888',
    is_billable: false,
    hourly_rate: null,
    budget_hours: null,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        client_name: project.client_name ?? null,
        color: project.color ?? '#888888',
        is_billable: project.is_billable ?? false,
        hourly_rate: project.hourly_rate ?? null,
        budget_hours: project.budget_hours ?? null,
      });
    } else {
      setFormData({
        name: '',
        client_name: null,
        color: '#888888',
        is_billable: false,
        hourly_rate: null,
        budget_hours: null,
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      const { showError } = await import('../../utils/toast');
      showError('Please enter a project name');
      return;
    }

    const projectData: Partial<Project> = {
      ...formData,
      name: formData.name.trim(),
      client_name: formData.client_name?.trim() || null,
      color: formData.color || '#888888',
      is_billable: formData.is_billable ?? false,
      hourly_rate: formData.is_billable ? (formData.hourly_rate ?? 0) : null,
      budget_hours: formData.budget_hours ?? null,
    };

    if (project) {
      projectData.id = project.id;
      projectData.is_archived = project.is_archived;
    }

    await onSubmit(projectData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Project name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={formData.client_name || ''}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Client name (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color || '#888888'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer"
              aria-label="Color picker"
            />
            <input
              type="text"
              value={formData.color || '#888888'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="#888888"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 h-5"></div>
          <Toggle
            checked={formData.is_billable === true}
            onChange={(checked) => {
              setFormData({ 
                ...formData, 
                is_billable: checked,
                hourly_rate: checked ? formData.hourly_rate : null,
                budget_hours: checked ? formData.budget_hours : null
              });
            }}
            label="Billable"
            description="Enable billing for this project"
          />
        </div>

        {formData.is_billable === true && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Hours (optional)
              </label>
              <input
                type="number"
                value={formData.budget_hours ?? ''}
                onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Budget hours"
                step="0.1"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hourly Rate
              </label>
              <input
                type="number"
                value={formData.hourly_rate ?? ''}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </>
        )}
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
                {project ? 'Save' : 'Create'}
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
        {project && onDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                await onDelete(project.id);
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

export default ProjectForm;
