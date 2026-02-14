import React, { useState } from 'react';
import { Category } from '../../types';
import Button from '../Common/Button';
import Toggle from '../Common/Toggle';
import { Check, X, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { useStore } from '../../store';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useResetSystemCategory } from '../../hooks/useCategories';

export const CategoriesSettings: React.FC = () => {
  const categories = useStore((state) => state.categories);
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const resetSystemCategoryMutation = useResetSystemCategory();
  
  const [newCategory, setNewCategory] = useState<Partial<Category> | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const handleCreateCategory = async () => {
    if (!newCategory || !newCategory.name?.trim()) {
      const { showError } = await import('../../utils/toast');
      showError('Please enter a category name');
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategory.name.trim(),
        color: newCategory.color || '#888888',
        icon: newCategory.icon || '📁',
        is_productive: newCategory.is_productive !== undefined ? newCategory.is_productive : true,
        sort_order: categories.length,
        is_pinned: newCategory.is_pinned ?? false,
      });
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Category created successfully');
      setNewCategory(null);
    } catch (error) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(error, 'Failed to create category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategory({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      is_productive: category.is_productive,
      sort_order: category.sort_order,
      is_pinned: category.is_pinned ?? false,
    });
    setNewCategory(null);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name?.trim() || !editingCategoryId) {
      const { showError } = await import('../../utils/toast');
      showError('Please enter a category name');
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategoryId,
        name: editingCategory.name.trim(),
        color: editingCategory.color || '#888888',
        icon: editingCategory.icon || '📁',
        is_productive: editingCategory.is_productive !== undefined 
          ? editingCategory.is_productive 
          : null,
        sort_order: editingCategory.sort_order ?? 0,
        is_pinned: editingCategory.is_pinned ?? false,
      });
      
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Category updated successfully');
      setEditingCategoryId(null);
      setEditingCategory(null);
    } catch (error) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(error, 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      const { showSuccess } = await import('../../utils/toast');
      showSuccess('Category deleted successfully');
      setEditingCategoryId(null);
      setEditingCategory(null);
    } catch (error) {
      const { handleApiError } = await import('../../utils/toast');
      handleApiError(error, 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize and manage your activity categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => {
              setNewCategory({ name: '', color: '#888888', icon: '📁', is_productive: true, is_pinned: false });
              setEditingCategoryId(null);
              setEditingCategory(null);
            }}
          >
            + New Category
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Categories
          </h3>
        </div>
        
        {newCategory && (
          <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={newCategory.icon || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  maxLength={2}
                  placeholder="📁"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategory.color || '#888888'}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCategory.color || '#888888'}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="#888888"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Productivity Status
                </label>
                <select
                  value={newCategory.is_productive === true ? 'productive' : newCategory.is_productive === false ? 'unproductive' : 'neutral'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewCategory({
                      ...newCategory,
                      is_productive: value === 'productive' ? true : value === 'unproductive' ? false : null
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="productive">✓ Productive</option>
                  <option value="unproductive">✗ Unproductive</option>
                  <option value="neutral">— Neutral</option>
                </select>
              </div>
              <div>
                <Toggle
                  checked={newCategory.is_pinned === true}
                  onChange={(checked) => {
                    setNewCategory({ 
                      ...newCategory, 
                      is_pinned: checked
                    });
                  }}
                  label="Pinned"
                  description="Show in quick selection forms"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="success"
                size="sm" 
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  'Creating...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Create
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => setNewCategory(null)}
              >
                ✕ Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id}>
              {editingCategoryId === category.id && editingCategory ? (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={editingCategory.icon || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        maxLength={2}
                        placeholder="📁"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingCategory.color || '#888888'}
                          onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editingCategory.color || '#888888'}
                          onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="#888888"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Productivity Status
                      </label>
                      <select
                        value={editingCategory.is_productive === true ? 'productive' : editingCategory.is_productive === false ? 'unproductive' : 'neutral'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditingCategory({
                            ...editingCategory,
                            is_productive: value === 'productive' ? true : value === 'unproductive' ? false : null
                          });
                        }}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="productive">✓ Productive</option>
                        <option value="unproductive">✗ Unproductive</option>
                        <option value="neutral">— Neutral</option>
                      </select>
                    </div>
                    <div>
                      <Toggle
                        checked={editingCategory.is_pinned === true}
                        onChange={(checked) => {
                          setEditingCategory({ 
                            ...editingCategory, 
                            is_pinned: checked
                          });
                        }}
                        label="Pinned"
                        description="Show in quick selection forms"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="success"
                        size="sm" 
                        onClick={handleUpdateCategory}
                        disabled={updateCategoryMutation.isPending}
                      >
                        {updateCategoryMutation.isPending ? (
                          'Saving...'
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategory(null);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    {category.is_system ? (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={async () => {
                          if (editingCategoryId && confirm('Reset category to default settings?')) {
                            try {
                              const resetCategory = await resetSystemCategoryMutation.mutateAsync(editingCategoryId);
                              const { showSuccess } = await import('../../utils/toast');
                              showSuccess('Category reset to default settings');
                              setEditingCategory(resetCategory);
                            } catch (error) {
                              const { handleApiError } = await import('../../utils/toast');
                              handleApiError(error, 'Failed to reset category');
                            }
                          }
                        }}
                        disabled={resetSystemCategoryMutation.isPending || updateCategoryMutation.isPending}
                      >
                        {resetSystemCategoryMutation.isPending ? (
                          'Resetting...'
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => {
                          if (editingCategoryId && confirm('Delete category? Records will be marked as "Uncategorized"')) {
                            handleDeleteCategory(editingCategoryId);
                          }
                        }}
                        disabled={updateCategoryMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.is_productive === true && '✓ Productive'}
                      {category.is_productive === false && '✗ Unproductive'}
                      {category.is_productive === null && '— Neutral'}
                    </p>
                  </div>
                  
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: category.color }}
                  />
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
