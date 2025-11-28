
import React from 'react';
import { useTranslation } from '../../i18n/index';
import { MapPinIcon, SpinnerIcon } from '../Icons';

interface DishDetailsSectionProps {
  formState: any;
  formSetters: any;
  uiState: any;
  actions: any;
}

export const DishDetailsSection: React.FC<DishDetailsSectionProps> = ({
  formState,
  formSetters,
  uiState,
  actions
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder={t('form.placeholder.restaurant')}
            value={formState.restaurantName}
            onChange={e => {
              formSetters.setRestaurantName(e.target.value);
            }}
            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 pr-12"
          />
          {uiState.isAiAvailable && (
            <button
              type="button"
              onClick={actions.handleFindNearby}
              disabled={uiState.isFindingRestaurants}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
              aria-label={t('form.button.findNearby.aria')}
            >
              {uiState.isFindingRestaurants ? (
                <SpinnerIcon className="w-5 h-5" />
              ) : (
                <MapPinIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {uiState.isFindingRestaurants && !uiState.locationError && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.findRestaurants.loading')}</p>}
        {uiState.locationError && <p className="text-xs text-red-500 mt-1">{uiState.locationError}</p>}
        {uiState.nearbyRestaurants.length > 0 && (
          <div className="mt-2">
            <label htmlFor="restaurant-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.label.selectRestaurant')}</label>
            <select
              id="restaurant-select"
              onChange={(e) => {
                if (e.target.value) {
                  actions.handleSelectRestaurant(parseInt(e.target.value, 10));
                }
              }}
              className="w-full mt-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            >
              <option value="">{t('form.placeholder.selectRestaurant')}</option>
              {uiState.nearbyRestaurants.map((r: any, i: number) => (
                <option key={`${r.name}-${i}`} value={i}>
                  {r.name} {r.cuisine ? `(${r.cuisine})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={t('form.placeholder.cuisine')}
          value={formState.cuisineType}
          onChange={e => formSetters.setCuisineType(e.target.value)}
          className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
        />
        <input
          type="number"
          placeholder={t('form.placeholder.price')}
          value={formState.price}
          onChange={e => formSetters.setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
          step="0.01"
          className="w-full sm:w-1/3 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
        />
      </div>
    </div>
  );
};
