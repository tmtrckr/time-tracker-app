import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
}) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 ${className}`}
    >
      <div className="relative inline-flex items-center flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label={label || 'Toggle'}
          tabIndex={-1}
        />
        <div
          onClick={handleToggle}
          role="switch"
          aria-checked={checked ? 'true' : 'false'}
          aria-label={label || 'Toggle'}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              onChange(!checked);
            }
          }}
          className={`
            relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out
            ${checked 
              ? 'bg-primary-600 dark:bg-primary-500 shadow-inner' 
              : 'bg-gray-300 dark:bg-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          `}
        >
          <div
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg
              transform transition-transform duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
              ${!disabled && 'hover:shadow-xl'}
            `}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="font-medium text-gray-900 dark:text-white block">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;
