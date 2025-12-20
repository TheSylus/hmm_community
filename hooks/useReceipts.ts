
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Receipt, ReceiptItem, GroceryCategory } from '../types';
import { User } from '@supabase/supabase-js';
import { updateReceipt as apiUpdateReceipt, deleteReceipt as apiDeleteReceipt } from '../services/receiptService';

export const useReceipts = (user: User | null, householdId: string | null | undefined) => {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReceipts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            let query = supabase.from('receipts').select(`
                *,
                items:receipt_items(*)
            `).order('date', { ascending: false });

            if (householdId) {
                query = query.eq('household_id', householdId);
            } else {
                query = query.eq('uploader_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setReceipts(data || []);
        } catch (err: any) {
            console.error("Error fetching receipts:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user, householdId]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const updateReceipt = useCallback(async (id: string, updates: Partial<Receipt>) => {
        try {
            const updated = await apiUpdateReceipt(id, updates);
            setReceipts(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
            return true;
        } catch (e: any) {
            console.error("Failed to update receipt:", e);
            setError(e.message);
            return false;
        }
    }, []);

    const deleteReceipt = useCallback(async (id: string) => {
        const previousReceipts = [...receipts];
        // 1. Optimistic Update
        setReceipts(prev => prev.filter(r => r.id !== id));
        setError(null);

        try {
            // 2. Server Request
            await apiDeleteReceipt(id);
            return true;
        } catch (e: any) {
            // 3. Rollback on error
            console.error("Failed to delete receipt, rolling back UI:", e);
            setReceipts(previousReceipts);
            setError(e.message || "Löschen fehlgeschlagen. Bitte prüfe deine Berechtigungen.");
            return false;
        }
    }, [receipts]);

    const getMonthlySpending = useCallback(() => {
        const monthlyData: Record<string, number> = {};
        const now = new Date();
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]}`; 
            monthlyData[key] = 0; 
        }

        receipts.forEach(receipt => {
            const date = new Date(receipt.date);
            const key = monthNames[date.getMonth()];
            if (monthlyData[key] !== undefined) {
                monthlyData[key] += receipt.total_amount;
            }
        });

        return Object.entries(monthlyData).map(([label, value]) => ({ 
            label, 
            value,
            active: label === monthNames[now.getMonth()]
        }));
    }, [receipts]);

    const getCategoryBreakdown = useCallback(() => {
        const catData: Record<string, number> = {};
        
        receipts.forEach(receipt => {
            if (receipt.items) {
                receipt.items.forEach(item => {
                    const cat = item.category || 'other';
                    const amount = (item.price || 0) * (item.quantity || 1);
                    catData[cat] = (catData[cat] || 0) + amount;
                });
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
    }, [receipts]);

    return {
        receipts,
        isLoading,
        error,
        refreshReceipts: fetchReceipts,
        updateReceipt,
        deleteReceipt,
        getMonthlySpending,
        getCategoryBreakdown
    };
};
