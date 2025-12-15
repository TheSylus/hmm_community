
import React, { useMemo } from 'react';
import { TrendingUpIcon, TrendingDownIcon, ReceiptPercentIcon, SparklesIcon, SpinnerIcon, CategoryOtherIcon } from '../Icons';
import { GroceryCategory, Receipt } from '../../types';
import { useTranslation } from '../../i18n/index';

interface FinanceDashboardProps {
    monthlyData: { label: string; value: number; active?: boolean }[];
    categoryData: { label: string; value: number; color: string }[];
    totalSpend: number;
    isLoading: boolean;
    onScan: () => void;
}

// Simple SVG Bar Chart Component
const SimpleBarChart: React.FC<{ data: { label: string; value: number; active?: boolean }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="flex items-end justify-between h-48 w-full gap-2 pt-6">
            {data.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full group">
                    <div className="relative flex-1 w-full flex items-end justify-center">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {item.value.toFixed(2)} €
                        </div>
                        {/* The Bar */}
                        <div 
                            className={`w-full max-w-[20px] rounded-t-md transition-all duration-500 ease-out ${item.active ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        ></div>
                    </div>
                    <span className={`text-[10px] mt-2 font-medium ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

// Simple SVG Donut Chart
const SimpleDonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (total === 0) return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="w-full h-full rounded-full border-8 border-gray-200 dark:border-gray-700 opacity-30"></div>
            <span className="absolute text-xs text-gray-400">Keine Daten</span>
        </div>
    );

    return (
        <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
                {data.map((slice, i) => {
                    const startPercent = cumulativePercent;
                    const slicePercent = slice.value / total;
                    cumulativePercent += slicePercent;
                    const endPercent = cumulativePercent;

                    // If full circle
                    if (slicePercent === 1) {
                        return <circle key={i} cx="0" cy="0" r="0.8" fill="transparent" stroke={slice.color} strokeWidth="0.4" />;
                    }

                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(endPercent);
                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');

                    return (
                        <path 
                            key={i} 
                            d={pathData} 
                            fill={slice.color} 
                            className="transition-all hover:opacity-80 cursor-pointer"
                        />
                    );
                })}
                <circle cx="0" cy="0" r="0.6" fill="var(--bg-card)" className="fill-white dark:fill-gray-900" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{total.toFixed(0)}€</span>
            </div>
        </div>
    );
};

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ monthlyData, categoryData, totalSpend, isLoading, onScan }) => {
    const { t } = useTranslation();
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    
    // Calculate Mock diff for now or implement logic (previous month comparison)
    // For MVP, just comparing vs average of prev months
    const avg = monthlyData.length > 1 ? (monthlyData.slice(0, -1).reduce((acc, c) => acc + c.value, 0) / (monthlyData.length - 1)) : totalSpend;
    const diffPercent = avg > 0 ? Math.round(((totalSpend - avg) / avg) * 100) : 0;

    if (isLoading && totalSpend === 0) {
        return <div className="flex justify-center py-20"><SpinnerIcon className="w-8 h-8 text-indigo-500"/></div>;
    }

    return (
        <div className="space-y-6 pb-24 animate-fade-in">
            {/* Header / Month Selector */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzen</h2>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                    <span className="text-sm font-semibold">{new Date().getFullYear()}</span>
                </div>
            </div>

            {/* Main KPI Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Gesamtausgaben ({currentMonth})</p>
                    <h3 className="text-4xl font-extrabold mb-4">{totalSpend.toFixed(2)} €</h3>
                    
                    <div className="flex items-center gap-2">
                        {totalSpend > 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${diffPercent < 0 ? 'bg-green-400/20 text-green-300' : 'bg-white/20 text-white'}`}>
                                {diffPercent < 0 ? <TrendingDownIcon className="w-3 h-3" /> : <TrendingUpIcon className="w-3 h-3" />}
                                <span>{Math.abs(diffPercent)}%</span>
                            </div>
                        )}
                        <span className="text-indigo-200 text-xs">vs. Durchschnitt</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spend History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Verlauf (6 Monate)</h4>
                    <SimpleBarChart data={monthlyData} />
                </div>

                {/* Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Ausgaben nach Kategorie</h4>
                    <div className="flex flex-col items-center">
                        <SimpleDonutChart data={categoryData} />
                        <div className="mt-6 w-full grid grid-cols-2 gap-2">
                            {categoryData.slice(0, 6).map((cat, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{t(`category.${cat.label}`)}</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.value.toFixed(0)}€</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scan Action Callout */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex items-center justify-between border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2.5 rounded-full text-indigo-600 dark:text-indigo-300">
                        <ReceiptPercentIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Neuer Einkauf?</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Scanne deinen Kassenbon für Details.</p>
                    </div>
                </div>
                <button 
                    onClick={onScan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors"
                >
                    Scannen
                </button>
            </div>
        </div>
    );
};
