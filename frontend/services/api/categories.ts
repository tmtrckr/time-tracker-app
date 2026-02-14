import { Category } from '../../types';
import { invoke, boolToTauriNum } from './utils';

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    return invoke<Category[]>('get_categories');
  },

  createCategory: (category: Omit<Category, 'id'>): Promise<Category> => {
    // Плагины должны использовать call_db_method для работы с этими полями
    return invoke('create_category', {
      name: category.name,
      color: category.color,
      icon: category.icon ?? null,
      isProductive: boolToTauriNum(category.is_productive),
      sortOrder: category.sort_order,
      isSystem: category.is_system ?? false,
      isPinned: category.is_pinned ?? false,
    });
  },

  updateCategory: (category: Category): Promise<Category> => {
    // Плагины должны использовать call_db_method для работы с этими полями
    return invoke('update_category', {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon ?? null,
      isProductive: boolToTauriNum(category.is_productive),
      sortOrder: category.sort_order,
      isPinned: category.is_pinned ?? false,
    });
  },
  
  deleteCategory: (id: number): Promise<void> => {
    return invoke('delete_category', { id });
  },
  
  resetSystemCategory: (id: number): Promise<Category> => {
    return invoke('reset_system_category', { id });
  },
  
  getPinnedCategories: async (): Promise<Category[]> => {
    const categories = await invoke<Category[]>('get_categories');
    return categories.filter(c => c.is_pinned === true);
  },
};
