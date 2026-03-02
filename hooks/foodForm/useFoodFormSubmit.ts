import { useCallback } from 'react';
import { FoodFormStateReturn } from './useFoodFormState';
import { useTranslation } from '../../i18n/index';
import { FoodItem } from '../../types';

export const useFoodFormSubmit = (state: FoodFormStateReturn, onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void) => {
  const { formState, uiSetters } = state;
  const { t } = useTranslation();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    uiSetters.setError(null);

    if (!formState.name.trim()) {
      uiSetters.setError(t('form.error.nameAndRating'));
      return;
    }
    if (formState.rating === 0) {
      uiSetters.setError(t('form.error.nameAndRating'));
      return;
    }

    const commonData = {
      name: formState.name,
      rating: formState.rating,
      notes: formState.notes || undefined,
      image: formState.image || undefined,
      tags: formState.tags ? formState.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      itemType: formState.itemType,
      category: formState.category || 'other', 
      isFamilyFavorite: formState.isFamilyFavorite,
      price: formState.price !== '' ? Number(formState.price) : undefined,
    };

    if (formState.itemType === 'product' || formState.itemType === 'drugstore') {
        onSaveItem({
          ...commonData,
          nutriScore: formState.nutriScore || undefined,
          calories: formState.calories !== '' ? Number(formState.calories) : undefined,
          purchaseLocation: formState.purchaseLocation ? formState.purchaseLocation.split(',').map(loc => loc.trim()).filter(Boolean) : undefined,
          ingredients: formState.ingredients.length > 0 ? formState.ingredients : undefined,
          allergens: formState.allergens.length > 0 ? formState.allergens : undefined,
          isLactoseFree: formState.dietary.isLactoseFree,
          isVegan: formState.dietary.isVegan,
          isGlutenFree: formState.dietary.isGlutenFree,
        });
    } else { 
        onSaveItem({
          ...commonData,
          restaurantName: formState.restaurantName || undefined,
          cuisineType: formState.cuisineType || undefined,
        });
    }
  }, [formState, t, onSaveItem, uiSetters]);

  return { handleSubmit };
};
