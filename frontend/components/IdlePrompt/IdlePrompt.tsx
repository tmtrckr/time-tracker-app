import React, { useState } from 'react';
import { useStore } from '../../store';
import { formatDuration } from '../../utils/format';
import Button from '../Common/Button';
import { usePinnedCategories } from '../../hooks/useCategories';

interface IdlePromptProps {
  durationMinutes: number;
  onSubmit: (categoryId: number, comment?: string) => Promise<void>;
  onSkip: () => void;
}

const IdlePrompt: React.FC<IdlePromptProps> = ({ durationMinutes, onSubmit, onSkip }) => {
  const { settings } = useStore();
  const { data: pinnedCategories = [] } = usePinnedCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [dontAskForShort, setDontAskForShort] = useState(false);
  
  const idleDuration = durationMinutes;
  
  const handleSave = async () => {
    if (selectedCategoryId) {
      await onSubmit(selectedCategoryId, description || undefined);
    }
  };
  
  const handleSkip = () => {
    onSkip();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            You're back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Away for: <span className="font-medium text-primary-700 dark:text-primary-300">{formatDuration(idleDuration)}</span>
          </p>
        </div>
        
        {/* Activity Options */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            What were you doing?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {pinnedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                  ${selectedCategoryId === category.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                style={{
                  borderColor: selectedCategoryId === category.id ? category.color : undefined,
                  backgroundColor: selectedCategoryId === category.id ? category.color + '20' : undefined,
                }}
              >
                <span className="text-2xl mb-1">{category.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Description Input */}
        {selectedCategoryId && (
          <div className="mb-6 animate-fade-in">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What were you thinking about, who did you call..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            disabled={!selectedCategoryId}
          >
            Save
          </Button>
        </div>
        
        {/* Don't ask for short idle */}
        <div className="mt-4 flex items-center justify-center">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontAskForShort}
              onChange={(e) => setDontAskForShort(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 
                         focus:ring-primary-500 dark:bg-gray-700"
            />
            Don't ask for &lt; {Math.floor((settings.idle_prompt_threshold_minutes || 5) * 60 / 60)} min
          </label>
        </div>
      </div>
    </div>
  );
};

export default IdlePrompt;
