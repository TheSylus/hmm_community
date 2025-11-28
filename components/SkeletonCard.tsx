
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden h-28 sm:h-32 flex animate-pulse">
        {/* Left Side: Image Placeholder */}
        <div className="w-28 sm:w-32 shrink-0 bg-gray-200 dark:bg-gray-700"></div>

        {/* Right Side: Content Placeholder */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
                <div className="flex justify-between items-start gap-2">
                    {/* Title */}
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    {/* Icons */}
                    <div className="flex gap-1">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                </div>

                {/* Stars Line */}
                <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    ))}
                </div>
            </div>
            
            {/* Bottom Row: Tags */}
            <div className="flex gap-2 mt-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
        </div>
    </div>
  );
};
