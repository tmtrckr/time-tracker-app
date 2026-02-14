import React from 'react';

export const AboutSettings: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm text-center">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⏱️</div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Time Tracker
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
          Version {import.meta.env.VITE_APP_VERSION || 'Stable Release'}
        </p>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-md mx-auto px-4">
          Desktop application for automatic time tracking with smart idle time handling.
        </p>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Technologies
          </h3>
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {['Tauri', 'React', 'TypeScript', 'Rust', 'SQLite', 'Tailwind CSS'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 px-4">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            © 2026 Time Tracker. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
            Special thanks to Anastasiya Murenka, Aliaksei Berkau, and Andrei Zhytkevich for the ideas.
          </p>
        </div>
      </div>
    </div>
  );
};
