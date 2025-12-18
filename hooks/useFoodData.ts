
import { useState, useEffect, useCallback } from 'react';
import { FoodItem } from '../types';
import { User } from '@supabase/supabase-js';
import * as foodItemService from '../services/foodItemService';
import { supabase } from '../services/supabaseClient';

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: mimeType });
};

export const useFoodData = (user: User | null, householdId?: string | null) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [familyFoodItems, setFamilyFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalData = useCallback(async () => {
    if (!user) return;
    try {
      const items = await foodItemService.fetchUserFoodItems(user.id);
      setFoodItems(items);
    } catch (err: any) {
      console.error("Personal data fetch error:", err);
      setError(`Error loading personal data: ${err.message}`);
    }
  }, [user]);

  const fetchFamilyData = useCallback(async () => {
    if (!householdId) {
      setFamilyFoodItems([]);
      return;
    }
    try {
      const items = await foodItemService.fetchFamilyFavorites();
      setFamilyFoodItems(items);
    } catch (err: any) {
      console.error("Family data fetch error:", err);
    }
  }, [householdId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchPersonalData(), fetchFamilyData()]);
      if (mounted) setIsLoading(false);
    };

    if (user) {
      load();
    } else {
      setFoodItems([]);
      setFamilyFoodItems([]);
      setIsLoading(false);
    }

    return () => { mounted = false; };
  }, [user, householdId, fetchPersonalData, fetchFamilyData]);

  const saveItem = useCallback(async (
    itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>,
    existingId?: string
  ): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to save items.");
      return false;
    }
    
    setError(null);
    let imageUrl = itemData.image;
    const originalItems = [...foodItems];
    const tempId = existingId || `temp_${Date.now()}`;

    const optimisticItem: FoodItem = {
      ...itemData,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      image: imageUrl || undefined,
      tags: itemData.tags || [],
    };

    if (existingId) {
      setFoodItems(prev => prev.map(item => item.id === existingId ? optimisticItem : item));
    } else {
      setFoodItems(prev => [optimisticItem, ...prev]);
    }

    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const mimeType = imageUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
        const blob = base64ToBlob(imageUrl, mimeType);
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const { error: uploadError } = await supabase.storage.from('food-images').upload(fileName, blob, { contentType: mimeType });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      } catch (uploadErr: any) {
        console.error("Upload error:", uploadErr);
        setError(`Failed to upload image: ${uploadErr.message}`);
        setFoodItems(originalItems);
        return false;
      }
    }

    try {
      let savedItem: FoodItem;
      if (existingId) {
        savedItem = await foodItemService.updateFoodItem(existingId, itemData, user.id, imageUrl);
        setFoodItems(prev => prev.map(item => item.id === savedItem.id ? savedItem : item));
      } else {
        savedItem = await foodItemService.createFoodItem(itemData, user.id, imageUrl);
        setFoodItems(prev => prev.map(item => item.id === tempId ? savedItem : item));
      }
      if (itemData.isFamilyFavorite && householdId) fetchFamilyData();
      return true;
    } catch (dbErr: any) {
      console.error("Database save error:", dbErr);
      setError(`Failed to save item: ${dbErr.message}`);
      setFoodItems(originalItems);
      return false;
    }
  }, [user, foodItems, householdId, fetchFamilyData]);

  const saveItemsBulk = useCallback(async (
      itemsData: (Omit<FoodItem, 'id' | 'user_id' | 'created_at'>)[]
  ): Promise<boolean> => {
      if (!user || itemsData.length === 0) return false;
      try {
          const savedItems = await foodItemService.createFoodItemsBulk(itemsData, user.id);
          if (savedItems.length > 0) {
              setFoodItems(prev => [...savedItems, ...prev]);
              if(householdId) fetchFamilyData();
              return true;
          }
          return false;
      } catch (e: any) {
          console.error("Bulk save error:", e);
          setError(`Failed to bulk save: ${e.message}`);
          return false;
      }
  }, [user, householdId, fetchFamilyData]);

  const deleteItem = useCallback(async (id: string) => {
    const originalItems = [...foodItems];
    setFoodItems(prev => prev.filter(item => item.id !== id));
    setError(null);
    try {
      await foodItemService.deleteFoodItem(id);
      if (householdId) fetchFamilyData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(`Failed to delete item: ${err.message}`);
      setFoodItems(originalItems);
    }
  }, [foodItems, householdId, fetchFamilyData]);

  return {
    foodItems,
    familyFoodItems,
    isLoading,
    error,
    saveItem,
    saveItemsBulk,
    deleteItem,
    refreshData: fetchPersonalData
  };
};
