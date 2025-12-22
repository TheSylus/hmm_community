
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ShoppingCartIcon, ChartBarIcon } from './Icons';

interface BottomNavigationProps {
  shoppingListCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ shoppingListCount }) => {
  const location = useLocation();
  const path = location.pathname;

  // Simple active check: strictly equal or starts with for sub-sections if needed
  const isActive = (route: string) => path === route;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] z-40 transition-all">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Vorrat</span>
        </Link>

        <Link
          to="/shopping"
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/shopping') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
        </Link>

        <Link
          to="/finance"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/finance') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ChartBarIcon className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Finanzen</span>
        </Link>
      </div>
    </nav>
  );
};
