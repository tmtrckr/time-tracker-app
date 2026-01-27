import { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { Check, X, Trash2 } from 'lucide-react';
import Button from '../Common/Button';
import { useCategories } from '../../hooks/useCategories';
import { useProjects } from '../../hooks/useProjects';

interface GoalFormProps {
  goal?: Goal | null;
  onSubmit: (goal: Omit<Goal, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => Promise<void>;
  isSubmitting?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({
  goal,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
}) => {
  const { data: categories = [] } = useCategories();
  const { projects } = useProjects(false);
  
  const [formData, setFormData] = useState<{
    goal_type: 'daily' | 'weekly' | 'monthly';
    target_hours: number;
    target_minutes: number;
    category_id: number | null;
    project_id: number | null;
    start_date: string;
    end_date: string | null;
    name: string | null;
  }>({
    goal_type: 'daily',
    target_hours: 0,
    target_minutes: 0,
    category_id: null,
    project_id: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    name: null,
  });

  useEffect(() => {
    if (goal) {
      const totalSeconds = goal.target_seconds;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      setFormData({
        goal_type: goal.goal_type,
        target_hours: hours,
        target_minutes: minutes,
        category_id: goal.category_id,
        project_id: goal.project_id,
        start_date: new Date(goal.start_date * 1000).toISOString().split('T')[0],
        end_date: goal.end_date ? new Date(goal.end_date * 1000).toISOString().split('T')[0] : null,
        name: goal.name || null,
      });
    } else {
      setFormData({
        goal_type: 'daily',
        target_hours: 0,
        target_minutes: 0,
        category_id: null,
        project_id: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        name: null,
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const target_seconds = formData.target_hours * 3600 + formData.target_minutes * 60;
    
    if (target_seconds <= 0) {
      const { showError } = await import('../../utils/toast');
      showError('Please enter a valid target time');
      return;
    }

    const startDate = new Date(formData.start_date);
    startDate.setHours(0, 0, 0, 0);
    const start_timestamp = Math.floor(startDate.getTime() / 1000);

    let end_timestamp: number | null = null;
    if (formData.end_date) {
      const endDate = new Date(formData.end_date);
      endDate.setHours(23, 59, 59, 999);
      end_timestamp = Math.floor(endDate.getTime() / 1000);
    }

    const goalData: Omit<Goal, 'id' | 'created_at'> = {
      goal_type: formData.goal_type,
      target_seconds,
      category_id: formData.category_id || null,
      project_id: formData.project_id || null,
      start_date: start_timestamp,
      end_date: end_timestamp,
      active: goal?.active ?? true,
      name: formData.name || null,
    };

    await onSubmit(goalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Custom goal name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Goal Type *
          </label>
          <select
            value={formData.goal_type}
            onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as 'daily' | 'weekly' | 'monthly' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Time *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.target_hours}
              onChange={(e) => setFormData({ ...formData, target_hours: parseInt(e.target.value) || 0 })}
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Hours"
              min="0"
              required
            />
            <input
              type="number"
              value={formData.target_minutes}
              onChange={(e) => setFormData({ ...formData, target_minutes: parseInt(e.target.value) || 0 })}
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Minutes"
              min="0"
              max="59"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category (optional)
          </label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project (optional)
          </label>
          <select
            value={formData.project_id || ''}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">None</option>
            {projects.filter(p => !p.is_archived).map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date (optional)
          </label>
          <input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            min={formData.start_date}
          />
        </div>
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
                {goal ? 'Save' : 'Create'}
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
        {goal && onDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={async () => {
              if (confirm(`Are you sure you want to delete this ${goal.goal_type} goal?`)) {
                await onDelete(goal.id);
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

export default GoalForm;
