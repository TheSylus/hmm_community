
import React from 'react';
import { HomeIcon, ShoppingCartIcon, ChartBarIcon } from './Icons';

interface BottomNavigationProps {
  activeTab: 'inventory' | 'shopping' | 'finance';
  onTabChange: (tab: 'inventory' | 'shopping' | 'finance') => void;
  shoppingListCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, shoppingListCount }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] z-40 transition-all">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'inventory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Vorrat</span>
        </button>

        <button
          onClick={() => onTabChange('shopping')}
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'shopping' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <ShoppingCartIcon className="w-6 h-6" />
            {shoppingListCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-white dark:border-gray-900">
                {shoppingListCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Einkauf</span>
        </button>

        <button
          onClick={() => onTabChange('finance')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'finance' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ChartBarIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Finanzen</span>
        </button>
      </div>
    </nav>
  );
};
