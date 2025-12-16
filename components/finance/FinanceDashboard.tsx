
import React, { useState, useMemo } from 'react';
import { TrendingUpIcon, TrendingDownIcon, ReceiptPercentIcon, SpinnerIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { Receipt } from '../../types';
import { useTranslation } from '../../i18n/index';
import { ReceiptEditModal } from './ReceiptEditModal';
import { useReceipts } from '../../hooks/useReceipts';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../hooks/useHousehold';

interface FinanceDashboardProps {
    monthlyData: { label: string; value: number; active?: boolean }[];
    categoryData: { label: string; value: number; color: string }[];
    totalSpend: number;
    isLoading: boolean;
    onScan: () => void;
}

// Helper: Is same Month & Year
const isSameMonth = (d1: Date, d2: Date) => {
    return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

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

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ isLoading, onScan }) => {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const { userProfile } = useHousehold(user);
    const { receipts, updateReceipt, deleteReceipt } = useReceipts(user, userProfile?.household_id);
    const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
    
    // --- Navigation State ---
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handlePrevMonth = () => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        const today = new Date();
        const nextMonth = new Date(selectedDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Prevent going into future
        if (nextMonth.getTime() > today.getTime() && nextMonth.getMonth() > today.getMonth()) return; 
        
        setSelectedDate(nextMonth);
    };

    const isCurrentMonth = isSameMonth(selectedDate, new Date());

    // --- Dynamic Calculations based on selectedDate ---

    const currentMonthReceipts = useMemo(() => {
        return receipts.filter(r => isSameMonth(new Date(r.date), selectedDate));
    }, [receipts, selectedDate]);

    const totalSpend = useMemo(() => {
        return currentMonthReceipts.reduce((sum, r) => sum + r.total_amount, 0);
    }, [currentMonthReceipts]);

    const previousMonthTotal = useMemo(() => {
        const prevDate = new Date(selectedDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        return receipts
            .filter(r => isSameMonth(new Date(r.date), prevDate))
            .reduce((sum, r) => sum + r.total_amount, 0);
    }, [receipts, selectedDate]);

    // Calculate Diff %
    const diffPercent = previousMonthTotal > 0 
        ? Math.round(((totalSpend - previousMonthTotal) / previousMonthTotal) * 100) 
        : 0;

    // Charts: History (Last 6 months ENDING at selectedDate)
    const monthlyHistoryData = useMemo(() => {
        const data = [];
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        const enMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const names = language === 'de' ? monthNames : enMonthNames;

        for (let i = 5; i >= 0; i--) {
            const d = new Date(selectedDate);
            d.setMonth(d.getMonth() - i);
            
            // Calculate sum for this month
            const sum = receipts
                .filter(r => isSameMonth(new Date(r.date), d))
                .reduce((acc, r) => acc + r.total_amount, 0);
            
            data.push({
                label: names[d.getMonth()],
                value: sum,
                active: i === 0 // The selected month is active
            });
        }
        return data;
    }, [receipts, selectedDate, language]);

    // Charts: Categories (Only for selected month)
    const categoryBreakdownData = useMemo(() => {
        const catData: Record<string, number> = {};
        currentMonthReceipts.forEach(receipt => {
            if (receipt.items) {
                receipt.items.forEach(item => {
                    const cat = item.category || 'other';
                    const amount = (item.price || 0) * (item.quantity || 1);
                    catData[cat] = (catData[cat] || 0) + amount;
                });
            } else {
                // If no items, put whole receipt in 'other' or a 'uncategorized' bucket?
                // For simplicity, let's ignore uncategorized receipts in the breakdown or map to 'other'
                // Ideally, receipt items should be populated. If not, maybe use a fallback.
            }
        });

        const categoryColors: Record<string, string> = {
            'produce': '#4ade80',
            'bakery': '#fbbf24',
            'meat_fish': '#f87171',
            'dairy_eggs': '#facc15',
            'pantry': '#fb923c',
            'frozen': '#38bdf8',
            'snacks': '#f472b6',
            'beverages': '#60a5fa',
            'household': '#94a3b8',
            'personal_care': '#c084fc',
            'restaurant_food': '#2dd4bf',
            'other': '#9ca3af',
        };

        return Object.entries(catData)
            .map(([cat, value]) => ({
                label: cat,
                value,
                color: categoryColors[cat] || '#ccc'
            }))
            .sort((a, b) => b.value - a.value);
    }, [currentMonthReceipts]);


    if (isLoading && receipts.length === 0) {
        return <div className="flex justify-center py-20"><SpinnerIcon className="w-8 h-8 text-indigo-500"/></div>;
    }

    const monthLabel = selectedDate.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 pb-24 animate-fade-in">
            {/* Navigation Header */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize transition-all duration-300 key={selectedDate.toString()}">
                    {monthLabel}
                </h2>
                <button 
                    onClick={handleNextMonth} 
                    disabled={isCurrentMonth}
                    className={`p-2 rounded-full transition-colors ${isCurrentMonth ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Main KPI Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-500">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Ausgaben im {selectedDate.toLocaleString('default', { month: 'long' })}</p>
                    <h3 className="text-4xl font-extrabold mb-4">{totalSpend.toFixed(2)} €</h3>
                    
                    <div className="flex items-center gap-2">
                        {totalSpend > 0 && previousMonthTotal > 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${diffPercent <= 0 ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
                                {diffPercent <= 0 ? <TrendingDownIcon className="w-3 h-3" /> : <TrendingUpIcon className="w-3 h-3" />}
                                <span>{Math.abs(diffPercent)}%</span>
                            </div>
                        )}
                        <span className="text-indigo-200 text-xs">
                            {previousMonthTotal > 0 ? "vs. Vormonat" : "kein Vormonatsdaten"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spend History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Verlauf (bis {monthLabel})</h4>
                    <SimpleBarChart data={monthlyHistoryData} />
                </div>

                {/* Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Kategorien ({monthLabel})</h4>
                    <div className="flex flex-col items-center">
                        <SimpleDonutChart data={categoryBreakdownData} />
                        <div className="mt-6 w-full grid grid-cols-2 gap-2">
                            {categoryBreakdownData.slice(0, 6).map((cat, i) => (
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

            {/* Recent Transactions List (Filtered by Month) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Umsätze ({monthLabel})</h4>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {currentMonthReceipts.length === 0 ? (
                        <p className="p-8 text-center text-sm text-gray-500">Keine Umsätze in diesem Monat.</p>
                    ) : (
                        currentMonthReceipts.map(r => (
                            <div 
                                key={r.id} 
                                onClick={() => setEditingReceipt(r)}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-500 dark:text-gray-400">
                                        <ReceiptPercentIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.merchant_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900 dark:text-white">-{r.total_amount.toFixed(2)} {r.currency}</span>
                                    <PencilIcon className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
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

            {/* Edit Modal */}
            {editingReceipt && (
                <ReceiptEditModal 
                    receipt={editingReceipt} 
                    onSave={updateReceipt} 
                    onDelete={deleteReceipt} 
                    onClose={() => setEditingReceipt(null)} 
                />
            )}
        </div>
    );
};
