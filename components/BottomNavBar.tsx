import React from 'react';
// FIX: Changed to a type-only import to satisfy isolated modules.
import type { View } from '../App';
import { HomeIcon, ListBulletIcon, GlobeAltIcon, UserGroupIcon } from './Icons';
import { useTranslation } from '../i18n';

interface BottomNavBarProps {
    currentView: View;
    setView: (view: View) => void;
}

interface NavItem {
    view: View;
    labelKey: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
    { view: 'dashboard', labelKey: 'bottomNav.dashboard', Icon: HomeIcon },
    { view: 'list', labelKey: 'bottomNav.list', Icon: ListBulletIcon },
    { view: 'discover', labelKey: 'bottomNav.discover', Icon: GlobeAltIcon },
    { view: 'groups', labelKey: 'bottomNav.groups', Icon: UserGroupIcon },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setView }) => {
    const { t } = useTranslation();
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-top z-30">
            <div className="container mx-auto grid grid-cols-4">
                {navItems.map(({ view, labelKey, Icon }) => {
                    const isActive = currentView === view;
                    return (
                        <button
                            key={view}
                            onClick={() => setView(view)}
                            className={`flex flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 ${
                                isActive 
                                ? 'text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>{t(labelKey)}</span>
                        </button>
                    );
                })}
            </div>
            <style>{`
             .shadow-top {
                box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1);
             }
            `}</style>
        </nav>
    );
};