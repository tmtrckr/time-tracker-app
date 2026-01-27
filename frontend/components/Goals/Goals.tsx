import React, { useState } from 'react';
import { Goal } from '../../types';
import { useGoals } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import Toggle from '../Common/Toggle';
import GoalForm from './GoalForm';
import GoalCard from './GoalCard';
import { formatGoalType } from '../../utils/goals';
import { Filter } from 'lucide-react';

type GoalTypeFilter = 'all' | 'daily' | 'weekly' | 'monthly';

const Goals: React.FC = () => {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [goalTypeFilter, setGoalTypeFilter] = useState<GoalTypeFilter>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { goals, loading, error, refetch, createGoal, updateGoal, deleteGoal } = useGoals(!includeInactive);
  const { data: categories = [] } = useCategories();
  const { projects } = useProjects(false);

  const handleCreateGoal = async (goalData: Omit<Goal, 'id' | 'created_at'>) => {
    try {
      setIsSubmitting(true);
      await createGoal(goalData);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Goal created successfully');
      setShowNewForm(false);
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (goalData: Omit<Goal, 'id' | 'created_at'>) => {
    if (!editingGoalId) return;
    
    try {
      setIsSubmitting(true);
      const goal = goals.find(g => g.id === editingGoalId);
      if (!goal) return;

      await updateGoal({
        ...goal,
        ...goalData,
      } as Goal);
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Goal updated successfully');
      setEditingGoalId(null);
      // Refresh the list to ensure consistency
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to update goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (goal: Goal) => {
    try {
      await updateGoal({
        ...goal,
        active: !goal.active,
      });
      const { showSuccess } = await import('../../utils/toast');
      showSuccess(goal.active ? 'Goal deactivated' : 'Goal activated');
      refetch();
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, `Failed to ${goal.active ? 'deactivate' : 'activate'} goal`);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteGoal(id);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Goal deleted successfully');
    } catch (err) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(err, 'Failed to delete goal');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setShowNewForm(false);
  };

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (goalTypeFilter !== 'all' && goal.goal_type !== goalTypeFilter) {
      return false;
    }
    return true;
  });

  const activeGoals = filteredGoals.filter(g => g.active);
  const inactiveGoals = filteredGoals.filter(g => !g.active);

  // Helper to get category/project for a goal
  const getCategory = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId) || null;
  };

  const getProject = (projectId: number | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId) || null;
  };

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
              You can still create new goals.
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set and track your daily, weekly, and monthly time goals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle
            checked={includeInactive}
            onChange={setIncludeInactive}
            label="Show inactive"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowNewForm(true);
              setEditingGoalId(null);
            }}
            disabled={showNewForm || editingGoalId !== null}
          >
            + New Goal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(['all', 'daily', 'weekly', 'monthly'] as GoalTypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setGoalTypeFilter(type)}
                className={`px-4 py-2 text-sm transition-colors ${
                  goalTypeFilter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? 'All' : formatGoalType(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Goal Form */}
      {showNewForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 shadow-sm border-2 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Goal
          </h2>
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowNewForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Edit Goal Form */}
      {editingGoalId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 shadow-sm border-2 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Edit Goal
          </h2>
          <GoalForm
            goal={goals.find(g => g.id === editingGoalId) || null}
            onSubmit={handleUpdateGoal}
            onCancel={() => setEditingGoalId(null)}
            onDelete={handleDeleteGoal}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Goals ({activeGoals.length})
        </h2>
        
        {activeGoals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-600 dark:text-gray-400">
              No active goals. Create your first goal to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                category={getCategory(goal.category_id)}
                project={getProject(goal.project_id)}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Goals */}
      {includeInactive && inactiveGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inactive Goals ({inactiveGoals.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inactiveGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                category={getCategory(goal.category_id)}
                project={getProject(goal.project_id)}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
