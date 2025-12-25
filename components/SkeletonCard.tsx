
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-row h-24 sm:h-28 animate-pulse w-full">
        {/* Left Side: Image Placeholder (Square) */}
        <div className="aspect-square h-full shrink-0 bg-gray-200 dark:bg-gray-700/50 relative">
             <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600/50"></div>
        </div>

        {/* Right Side: Content Placeholder */}
        <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
            <div>
                <div className="flex justify-between items-start gap-1">
                    {/* Title */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    {/* Icon Placeholder */}
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                </div>

                {/* Stars Line */}
                <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    ))}
                </div>
                
                {/* Metadata Line (Location/Price) */}
                <div className="mt-2 flex items-center justify-between">
                     <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                     <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
                </div>
            </div>
            
            {/* Bottom Row: Tags */}
            <div className="flex gap-1 mt-1 overflow-hidden">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-10"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-14"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
            </div>
        </div>
    </div>
  );
};
