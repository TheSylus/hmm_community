import React, { useState, useCallback } from 'react';
import { FoodItem, ShoppingList } from '../types';
import { useTranslation } from '../i18n';

interface AddToListModalProps {
    item: FoodItem;
    lists: ShoppingList[];
    onAdd: (listId: string, quantity: number) => void;
    onClose: () => void;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({ item, lists, onAdd, onClose }) => {
    const { t } = useTranslation();
    const [selectedList, setSelectedList] = useState<string>(lists[0]?.id || '');
    const [quantity, setQuantity] = useState(1);
    
    const handleAdd = useCallback(() => {
        if(selectedList && quantity > 0) {
            onAdd(selectedList, quantity);
        }
    }, [selectedList, quantity, onAdd]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('addToListModal.title', { itemName: item.name })}</h2>
                
                {lists.length > 0 ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="list-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('addToListModal.selectList')}
                            </label>
                            <select 
                                id="list-select"
                                value={selectedList} 
                                onChange={e => setSelectedList(e.target.value)} 
                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                            >
                                {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('addToListModal.quantity')}
                            </label>
                            <input 
                                id="quantity-input"
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10)))} 
                                min="1" 
                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2" 
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 my-4 text-center bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">{t('addToListModal.noLists')}</p>
                )}
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors">
                        {t('addToListModal.button.cancel')}
                    </button>
                    <button 
                        onClick={handleAdd} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600"
                        disabled={lists.length === 0}
                    >
                        {t('addToListModal.button.add')}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};