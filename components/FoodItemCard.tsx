// FIX: Implemented the FoodItemCard component to display food item summaries, resolving module errors.
import React from 'react';
import { FoodItem, NutriScore, Like, CommentWithProfile } from '../types';
import { useTranslation } from '../i18n/index';
import { useTranslatedItem } from '../hooks/useTranslatedItem';
import { StarIcon, PencilIcon, TrashIcon, EyeIcon, ShoppingCartIcon, GlobeAltIcon, LockClosedIcon, ChatBubbleBottomCenterTextIcon, HeartIcon } from './Icons';

interface FoodItemCardProps {
    item: FoodItem;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onViewDetails: (item: FoodItem) => void;
    onAddToShoppingList: (item: FoodItem) => void;
    isPreview?: boolean;
    likes?: Like[];
    comments?: CommentWithProfile[];
}

const nutriScoreColors: Record<NutriScore, string> = {
    A: 'bg-green-600', B: 'bg-lime-600', C: 'bg-yellow-500', D: 'bg-orange-500', E: 'bg-red-600',
};

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onViewDetails, onAddToShoppingList, isPreview = false, likes = [], comments = [] }) => {
    const { t } = useTranslation();
    const displayItem = useTranslatedItem(item);
    
    if (!displayItem) return null; // Or a loading skeleton

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
            {displayItem.image && (
                <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => onViewDetails(displayItem)}>
                    <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{displayItem.name}</h3>
                        {displayItem.item_type === 'product' && displayItem.nutri_score && (
                            <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0 ${nutriScoreColors[displayItem.nutri_score]}`}>
                                {displayItem.nutri_score}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center my-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon key={star} className={`w-5 h-5 ${displayItem.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={displayItem.rating >= star} />
                        ))}
                    </div>
                     <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {displayItem.is_public ? <GlobeAltIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                        <span>{t(displayItem.is_public ? 'detail.statusPublic' : 'detail.statusPrivate')}</span>
                    </div>
                </div>
                
                {isPreview && (likes.length > 0 || comments.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <HeartIcon className="w-4 h-4 text-red-500" filled />
                            <span>{likes.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                            <span>{comments.length}</span>
                        </div>
                    </div>
                )}
                
                {!isPreview && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between gap-2">
                         <button onClick={() => onViewDetails(displayItem)} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition" title="View Details"><EyeIcon className="w-5 h-5"/></button>
                         <button onClick={() => onAddToShoppingList(displayItem)} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition" title={t('card.addToShoppingListTooltip')}><ShoppingCartIcon className="w-5 h-5"/></button>
                         <div className="flex-grow"></div>
                         <button onClick={() => onEdit(displayItem.id)} className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition" title="Edit"><PencilIcon className="w-5 h-5"/></button>
                         <button onClick={() => onDelete(displayItem.id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                )}
            </div>
        </div>
    );
};