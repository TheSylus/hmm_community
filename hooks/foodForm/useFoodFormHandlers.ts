import { useCallback } from 'react';
import { FoodFormStateReturn } from './useFoodFormState';
import { findNearbyRestaurants } from '../../services/geminiService';
import { useTranslation } from '../../i18n/index';

export const useFoodFormHandlers = (state: FoodFormStateReturn) => {
  const { formSetters, uiSetters, fileInputRef } = state;
  const { t } = useTranslation();

  const handleFindNearby = useCallback(() => {
    uiSetters.setLocationError(null);
    uiSetters.setNearbyRestaurants([]);
    uiSetters.setIsFindingRestaurants(true);

    if (!navigator.geolocation) {
      uiSetters.setLocationError(t('form.error.geolocationUnsupported'));
      uiSetters.setIsFindingRestaurants(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const restaurants = await findNearbyRestaurants(latitude, longitude);
          if (restaurants.length > 0) {
              uiSetters.setNearbyRestaurants(restaurants);
          } else {
              uiSetters.setLocationError(t('form.error.findRestaurants'));
          }
        } catch (err) {
          uiSetters.setLocationError(t('form.error.findRestaurants'));
          console.error(err);
        } finally {
          uiSetters.setIsFindingRestaurants(false);
        }
      },
      (error) => {
        uiSetters.setLocationError(t('form.error.geolocationPermission'));
        console.error(error);
        uiSetters.setIsFindingRestaurants(false);
      },
      { timeout: 10000 }
    );
  }, [t, uiSetters]);

  const handleSelectRestaurant = useCallback((restaurantIndex: number) => {
      const selected = state.uiState.nearbyRestaurants[restaurantIndex];
      if(selected) {
          formSetters.setRestaurantName(selected.name);
          if (selected.cuisine) {
              formSetters.setCuisineType(selected.cuisine);
          }
          uiSetters.setNearbyRestaurants([]); 
      }
  }, [state.uiState.nearbyRestaurants, formSetters, uiSetters]);

  const handleDietaryChange = useCallback((key: keyof FoodFormStateReturn['formState']['dietary']) => {
    formSetters.setDietary(prev => ({...prev, [key]: !prev[key]}));
  }, [formSetters]);

  const removeImage = useCallback(() => {
    formSetters.setImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, [formSetters, fileInputRef]);

  return {
    handleFindNearby,
    handleSelectRestaurant,
    handleDietaryChange,
    removeImage
  };
};
