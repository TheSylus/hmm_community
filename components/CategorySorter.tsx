import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GroceryCategory } from '../types';
import { useTranslation } from '../i18n/index';
import { ArrowsUpDownIcon, CheckCircleIcon } from './Icons';
import { triggerHaptic } from '../utils/haptics';

interface CategorySorterProps {
    categories: GroceryCategory[];
    onCategoriesChange: (newCategories: GroceryCategory[]) => void;
    onClose: () => void;
    categoryIconMap: Record<GroceryCategory, React.FC<{ className?: string }>>;
    categoryColorMap: Record<GroceryCategory, string>;
}

export const CategorySorter: React.FC<CategorySorterProps> = ({
    categories,
    onCategoriesChange,
    onClose,
    categoryIconMap,
    categoryColorMap
}) => {
    const { t } = useTranslation();

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const startIndex = result.source.index;
        const endIndex = result.destination.index;

        if (startIndex === endIndex) return;

        triggerHaptic('light');

        const newCategories = Array.from(categories);
        const [removed] = newCategories.splice(startIndex, 1);
        newCategories.splice(endIndex, 0, removed);

        onCategoriesChange(newCategories);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowsUpDownIcon className="w-5 h-5 text-indigo-500" />
                    {t('shoppingList.sortCategories') || 'Sort Categories'}
                </h3>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
                >
                    <CheckCircleIcon className="w-5 h-5" />
                    {t('common.done') || 'Done'}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                    {t('shoppingList.sortCategoriesHelp') || 'Drag and drop to reorder categories. This order will be used in your shopping list and inventory.'}
                </p>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="categories-list">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2"
                            >
                                {categories.map((cat, index) => {
                                    const Icon = categoryIconMap[cat];
                                    const catColorStyle = categoryColorMap[cat];
                                    
                                    return (
                                        <Draggable key={cat} draggableId={cat} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border ${
                                                        snapshot.isDragging 
                                                            ? 'border-indigo-500 shadow-lg scale-[1.02] z-10' 
                                                            : 'border-gray-200 dark:border-gray-700 shadow-sm'
                                                    } transition-all`}
                                                    style={provided.draggableProps.style}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                                                            <ArrowsUpDownIcon className="w-5 h-5" />
                                                        </div>
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${catColorStyle.replace('border', 'border-0')}`}>
                                                            <Icon className="w-5 h-5" />
                                                            <span className="font-bold uppercase tracking-wider text-sm">
                                                                {t(`category.${cat}`)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
};
