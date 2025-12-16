
import React, { useState } from 'react';
import { Receipt } from '../../types';
import { XMarkIcon, TrashIcon, CheckCircleIcon } from '../Icons';

interface ReceiptEditModalProps {
    receipt: Receipt;
    onSave: (id: string, updates: Partial<Receipt>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
}

export const ReceiptEditModal: React.FC<ReceiptEditModalProps> = ({ receipt, onSave, onDelete, onClose }) => {
    const [data, setData] = useState({
        merchant_name: receipt.merchant_name,
        total_amount: receipt.total_amount,
        date: receipt.date.split('T')[0]
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(receipt.id, {
            merchant_name: data.merchant_name,
            total_amount: Number(data.total_amount),
            date: new Date(data.date).toISOString()
        });
        setIsSaving(false);
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm("Soll dieser Beleg wirklich unwiderruflich gelöscht werden?")) {
            setIsSaving(true);
            await onDelete(receipt.id);
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Beleg bearbeiten</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Geschäft</label>
                        <input 
                            type="text" 
                            value={data.merchant_name} 
                            onChange={e => setData({...data, merchant_name: e.target.value})}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-indigo-500 rounded-lg p-2 font-semibold text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Datum</label>
                        <input 
                            type="date" 
                            value={data.date} 
                            onChange={e => setData({...data, date: e.target.value})}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-indigo-500 rounded-lg p-2 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Betrag (€)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={data.total_amount} 
                            onChange={e => setData({...data, total_amount: e.target.valueAsNumber})}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-indigo-500 rounded-lg p-2 text-xl font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
                    <button 
                        onClick={handleDelete}
                        className="px-4 py-2 text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        disabled={isSaving}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                        disabled={isSaving}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};
