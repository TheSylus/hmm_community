
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { SparklesIcon, DocumentTextIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon } from '../Icons';

interface DietarySectionProps {
  formState: any;
  formSetters: any;
  uiState: any;
  actions: any;
  itemType: string;
}

export const DietarySection: React.FC<DietarySectionProps> = ({
  formState,
  formSetters,
  uiState,
  actions,
  itemType
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {itemType === 'drugstore' ? t('form.ingredients.inciList') : t('form.ingredients.title')}
        </h3>
        {uiState.isAiAvailable && formState.image && (
          <button
            type="button"
            onClick={actions.handleScanIngredients}
            disabled={uiState.isIngredientsLoading}
            className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1.5 px-3 rounded-md transition disabled:opacity-50"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>{t('form.button.scanIngredients')}</span>
          </button>
        )}
      </div>
      
      {uiState.isIngredientsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <SparklesIcon className="w-4 h-4 animate-pulse" />
          <span>{t('form.ingredients.loading')}</span>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t(itemType === 'drugstore' ? 'form.attributes.title' : 'form.dietary.title')}:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => actions.handleDietaryChange('isLactoseFree')} aria-pressed={formState.dietary.isLactoseFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isLactoseFree ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent text-blue-600 dark:text-blue-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <LactoseFreeIcon className="w-7 h-7" />
                <span className="text-xs font-semibold">{t('form.dietary.lactoseFree')}</span>
              </button>
              <button type="button" onClick={() => actions.handleDietaryChange('isVegan')} aria-pressed={formState.dietary.isVegan} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isVegan ? 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <VeganIcon className="w-7 h-7" />
                <span className="text-xs font-semibold">{t('form.dietary.vegan')}</span>
              </button>
              <button type="button" onClick={() => actions.handleDietaryChange('isGlutenFree')} aria-pressed={formState.dietary.isGlutenFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${formState.dietary.isGlutenFree ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <GlutenFreeIcon className="w-7 h-7" />
                <span className="text-xs font-semibold">{t('form.dietary.glutenFree')}</span>
              </button>
            </div>
          </div>

          {/* Ingredients Text Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t(itemType === 'drugstore' ? 'form.ingredients.inciList' : 'form.ingredients.ingredientsList')}
            </label>
            <textarea
              value={formState.ingredients?.join(', ')}
              onChange={(e) => formSetters.setIngredients(e.target.value.split(',').map((i: string) => i.trim()).filter(Boolean))}
              placeholder={t('form.ingredients.placeholder')}
              rows={3}
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 text-sm"
            />
          </div>

          {/* Allergens Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('form.allergens.title')}</label>
            <input
              type="text"
              value={formState.allergens?.join(', ')}
              onChange={(e) => formSetters.setAllergens(e.target.value.split(',').map((i: string) => i.trim()).filter(Boolean))}
              placeholder="e.g. Peanuts, Soy"
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
