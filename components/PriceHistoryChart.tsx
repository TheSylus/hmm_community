
import React, { useMemo } from 'react';
import { PricePoint } from '../services/priceService';
import { TrendingUpIcon, TrendingDownIcon, BuildingStorefrontIcon } from './Icons';
import { useTranslation } from '../i18n/index';

interface PriceHistoryChartProps {
    history: PricePoint[];
    currentPrice?: number;
    itemName: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ history, currentPrice, itemName }) => {
    const { t, language } = useTranslation();

    // 1. Data Prep
    const data = useMemo(() => {
        // If we have a current price from the item itself, add it as the "latest" point if newer or distinct
        let points = [...history];
        
        // Filter out zero prices which might be errors
        points = points.filter(p => p.price > 0);

        if (currentPrice && currentPrice > 0) {
            // Check if last point is same price/date to avoid duplicates
            const last = points[points.length - 1];
            const isDuplicate = last && Math.abs(last.price - currentPrice) < 0.01 && new Date().getTime() - new Date(last.date).getTime() < 86400000; // within 24h
            
            if (!isDuplicate) {
                points.push({
                    date: new Date().toISOString(),
                    price: currentPrice,
                    merchant: 'Aktuell'
                });
            }
        }
        // Sort by date ensures correct line drawing
        points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return points;
    }, [history, currentPrice]);

    // 2. Logic: Need at least 2 points for a line, but 1 is okay to just show "Last Price"
    if (data.length < 2) {
        return (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center text-center">
                <span className="text-2xl mb-2">📊</span>
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Price Watch</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 max-w-xs">
                    Scanne weitere Belege mit "{itemName}", um die Preisentwicklung zu sehen.
                </p>
            </div>
        );
    }

    // 3. Stats Calculation
    const latestPrice = data[data.length - 1].price;
    const previousPrice = data[data.length - 2].price;
    const priceDiff = latestPrice - previousPrice;
    const isInflation = priceDiff > 0;
    const percentChange = previousPrice > 0 ? Math.round((Math.abs(priceDiff) / previousPrice) * 100) : 0;

    const minPrice = Math.min(...data.map(d => d.price)) * 0.9; // 10% padding
    const maxPrice = Math.max(...data.map(d => d.price)) * 1.1;
    const priceRange = maxPrice - minPrice || 1;

    // 4. SVG Coordinates
    const width = 300;
    const height = 80;
    const padding = 10;

    const getX = (index: number) => {
        return padding + (index / (data.length - 1)) * (width - 2 * padding);
    };

    const getY = (price: number) => {
        // Invert Y because SVG 0 is top
        const normalized = (price - minPrice) / priceRange;
        return height - padding - (normalized * (height - 2 * padding));
    };

    const pointsStr = data.map((d, i) => `${getX(i)},${getY(d.price)}`).join(' ');

    // Gradient fill area
    const areaStr = `${pointsStr} ${getX(data.length - 1)},${height} ${getX(0)},${height}`;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preisentwicklung</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {latestPrice.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' })}
                        </span>
                        {priceDiff !== 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold ${isInflation ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                {isInflation ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                                <span>{percentChange}%</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Last Merchant Info */}
                <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Zuletzt bei</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-end gap-1">
                        <BuildingStorefrontIcon className="w-3 h-3" />
                        {data[data.length - 1].merchant}
                    </span>
                </div>
            </div>

            {/* The Chart */}
            <div className="relative w-full h-20">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isInflation ? '#ef4444' : '#22c55e'} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={isInflation ? '#ef4444' : '#22c55e'} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    <polygon points={areaStr} fill="url(#chartGradient)" />
                    
                    {/* Line */}
                    <polyline 
                        points={pointsStr} 
                        fill="none" 
                        stroke={isInflation ? '#ef4444' : '#22c55e'} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />

                    {/* Points */}
                    {data.map((d, i) => (
                        <circle 
                            key={i} 
                            cx={getX(i)} 
                            cy={getY(d.price)} 
                            r={i === data.length - 1 ? 4 : 2} 
                            fill={isInflation ? '#ef4444' : '#22c55e'} 
                            stroke="white" 
                            strokeWidth={i === data.length - 1 ? 2 : 0}
                            className="transition-all hover:r-4"
                        />
                    ))}
                </svg>
                
                {/* Tooltip-ish Overlay for Start/End Dates */}
                <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-mono">
                    <span>{new Date(data[0].date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</span>
                    <span>{new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};
