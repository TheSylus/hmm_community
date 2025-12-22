
import React, { ReactNode } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { SettingsIcon, MagnifyingGlassIcon, FunnelIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ChevronLeftIcon, XMarkIcon } from './Icons';
import { BottomNavigation } from './BottomNavigation';
import { OfflineIndicator } from './OfflineIndicator';
import { OwnerFilter, RatingFilter, TypeFilter } from '../App';

interface LayoutProps {
  shoppingListCount: number;
  isOnline: boolean;
  
  // Header Props (Passed down from App logic for now)
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isAnyFilterActive: boolean;
  toggleAllCategories: () => void;
  isAllCollapsed: boolean;
  onOpenSettings: () => void;
  onOpenFilter: () => void;
  
  // Filter Display Props
  ownerFilter: OwnerFilter;
  setOwnerFilter: (f: OwnerFilter) => void;
  aiSearchQuery: string;
  clearAiSearch: () => void;
  typeFilter: TypeFilter;
  setTypeFilter: (f: TypeFilter) => void;
  ratingFilter: RatingFilter;
  setRatingFilter: (f: RatingFilter) => void;
  clearAllFilters: () => void;
}

const ActiveFilterPill: React.FC<{onDismiss: () => void, children: React.ReactNode}> = ({onDismiss, children}) => (
  <div className="flex items-center gap-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-600/50 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded-full">
      <span>{children}</span>
      <button onClick={onDismiss} className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/50">
          <XMarkIcon className="w-3 h-3"/>
      </button>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ 
    shoppingListCount, isOnline,
    searchTerm, setSearchTerm, isAnyFilterActive, toggleAllCategories, isAllCollapsed, onOpenSettings, onOpenFilter,
    ownerFilter, setOwnerFilter, aiSearchQuery, clearAiSearch, typeFilter, setTypeFilter, ratingFilter, setRatingFilter, clearAllFilters
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Route Config
  const isInventory = location.pathname === '/';
  const showBackBtn = location.pathname !== '/' && location.pathname !== '/shopping' && location.pathname !== '/finance';
  
  // Determine Page Title
  let pageTitle = t('header.title');
  if (location.pathname === '/shopping') pageTitle = t('shoppingList.title');
  if (location.pathname === '/finance') pageTitle = 'Finanzen'; // Should add to i18n
  if (location.pathname === '/settings') pageTitle = t('settings.title');
  if (location.pathname.startsWith('/add')) pageTitle = t('form.addNewButton');
  if (location.pathname.startsWith('/edit')) pageTitle = t('form.editTitle');
  
  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-md dark:shadow-lg sticky top-0 z-30 pt-safe-top">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center gap-4">
                    {showBackBtn ? (
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    ) : (
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400">
                            {pageTitle}
                        </h1>
                    )}
                    
                    {!showBackBtn && (
                        <Link to="/settings" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('settings.title')}>
                            <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                        </Link>
                    )}
                </div>
                
                {/* Search & Filter Bar (Only on Inventory) */}
                {isInventory && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="search"
                                    placeholder={t('header.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2 pl-10 pr-4 transition"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-md p-1">
                                <button 
                                    onClick={onOpenFilter} 
                                    className="flex items-center justify-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                                    title={t('header.filter.button')}
                                >
                                    <FunnelIcon className="w-5 h-5" />
                                </button>
                                
                                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>

                                <button
                                    onClick={toggleAllCategories}
                                    className="flex items-center justify-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                                    title={isAllCollapsed ? "Alles ausklappen" : "Alles einklappen"}
                                >
                                    {isAllCollapsed ? <ArrowsPointingOutIcon className="w-5 h-5" /> : <ArrowsPointingInIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {isAnyFilterActive && (
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                                {ownerFilter !== 'all' && <ActiveFilterPill onDismiss={() => setOwnerFilter('all')}>{t(`header.filter.active.owner.${ownerFilter}`)}</ActiveFilterPill>}
                                {searchTerm.trim() && <ActiveFilterPill onDismiss={() => setSearchTerm('')}>{t('header.filter.active.search', { term: searchTerm })}</ActiveFilterPill>}
                                {aiSearchQuery && <ActiveFilterPill onDismiss={clearAiSearch}>{t('header.filter.active.aiSearch', { term: aiSearchQuery })}</ActiveFilterPill>}
                                {typeFilter !== 'all' && <ActiveFilterPill onDismiss={() => setTypeFilter('all')}>{t(`header.filter.active.type.${typeFilter}`)}</ActiveFilterPill>}
                                {ratingFilter !== 'all' && <ActiveFilterPill onDismiss={() => setRatingFilter('all')}>{t(`header.filter.active.rating.${ratingFilter}`)}</ActiveFilterPill>}
                                <button onClick={clearAllFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">{t('header.filter.clearAll')}</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
        
        <OfflineIndicator isOnline={isOnline} />

        <main className="container mx-auto p-4 md:p-8 pb-32">
            <Outlet />
        </main>

        <BottomNavigation shoppingListCount={shoppingListCount} />
    </div>
  );
};
