
import { useCallback } from 'react';
import { FoodItem } from '../types';
import { User } from '@supabase/supabase-js';
import * as foodItemService from '../services/foodItemService';
import { supabase } from '../services/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Keys for caching
const KEYS = {
    personal: (userId: string) => ['foodItems', 'personal', userId],
    family: (householdId?: string | null) => ['foodItems', 'family', householdId],
};

export const useFoodData = (user: User | null, householdId?: string | null) => {
  const queryClient = useQueryClient();

  // --- QUERIES (Read) ---

  const { data: foodItems = [], isLoading: isLoadingPersonal, error: errorPersonal } = useQuery({
      queryKey: KEYS.personal(user?.id || ''),
      queryFn: () => foodItemService.fetchUserFoodItems(user!.id),
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2 mins
  });

  const { data: familyFoodItems = [], isLoading: isLoadingFamily } = useQuery({
      queryKey: KEYS.family(householdId),
      queryFn: () => foodItemService.fetchFamilyFavorites(),
      enabled: !!householdId,
      staleTime: 1000 * 60 * 2,
  });

  // --- MUTATIONS (Write) ---

  const saveMutation = useMutation({
      mutationFn: async ({ itemData, existingId }: { itemData: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>, existingId?: string }) => {
          if (!user) throw new Error("No user");
          
          let imageUrl = itemData.image;
          // Handle Image Upload
          if (imageUrl && imageUrl.startsWith('data:image')) {
              const mimeType = imageUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
              const blob = base64ToBlob(imageUrl, mimeType);
              const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
              const { error: uploadError } = await supabase.storage.from('food-images').upload(fileName, blob, { contentType: mimeType });
              if (uploadError) throw uploadError;
              const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(fileName);
              imageUrl = urlData.publicUrl;
          }

          if (existingId) {
              return await foodItemService.updateFoodItem(existingId, itemData, user.id, imageUrl);
          } else {
              return await foodItemService.createFoodItem(itemData, user.id, imageUrl);
          }
      },
      onMutate: async ({ itemData, existingId }) => {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: KEYS.personal(user?.id || '') });
          
          // Snapshot previous value
          const previousItems = queryClient.getQueryData<FoodItem[]>(KEYS.personal(user?.id || ''));

          // Optimistic Update
          queryClient.setQueryData<FoodItem[]>(KEYS.personal(user?.id || ''), (old) => {
              if (!old) return [];
              const optimisticItem = {
                  ...itemData,
                  id: existingId || `temp_${Date.now()}`,
                  user_id: user!.id,
                  created_at: new Date().toISOString(),
                  image: itemData.image // Use base64 temporarily
              } as FoodItem;

              if (existingId) {
                  return old.map(item => item.id === existingId ? { ...item, ...optimisticItem } : item);
              } else {
                  return [optimisticItem, ...old];
              }
          });

          return { previousItems };
      },
      onError: (err, newTodo, context) => {
          console.error("Save failed", err);
          if (context?.previousItems) {
              queryClient.setQueryData(KEYS.personal(user?.id || ''), context.previousItems);
          }
      },
      onSettled: () => {
          queryClient.invalidateQueries({ queryKey: KEYS.personal(user?.id || '') });
          if (householdId) queryClient.invalidateQueries({ queryKey: KEYS.family(householdId) });
      }
  });

  const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
          await foodItemService.deleteFoodItem(id);
      },
      onMutate: async (id) => {
          await queryClient.cancelQueries({ queryKey: KEYS.personal(user?.id || '') });
          const previousItems = queryClient.getQueryData<FoodItem[]>(KEYS.personal(user?.id || ''));
          
          queryClient.setQueryData<FoodItem[]>(KEYS.personal(user?.id || ''), (old) => {
              return old ? old.filter(item => item.id !== id) : [];
          });
          
          return { previousItems };
      },
      onError: (err, id, context) => {
          if (context?.previousItems) {
              queryClient.setQueryData(KEYS.personal(user?.id || ''), context.previousItems);
          }
      },
      onSettled: () => {
          queryClient.invalidateQueries({ queryKey: KEYS.personal(user?.id || '') });
          if (householdId) queryClient.invalidateQueries({ queryKey: KEYS.family(householdId) });
      }
  });

  const bulkSaveMutation = useMutation({
      mutationFn: async (items: (Omit<FoodItem, 'id' | 'user_id' | 'created_at'>)[]) => {
          if (!user) throw new Error("No user");
          return await foodItemService.createFoodItemsBulk(items, user.id);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: KEYS.personal(user?.id || '') });
          if (householdId) queryClient.invalidateQueries({ queryKey: KEYS.family(householdId) });
      }
  });

  // Wrapper functions to match old interface
  const saveItem = useCallback((itemData: any, existingId?: string) => saveMutation.mutateAsync({ itemData, existingId }).then(() => true).catch(() => false), [saveMutation]);
  const deleteItem = useCallback((id: string) => deleteMutation.mutateAsync(id), [deleteMutation]);
  const saveItemsBulk = useCallback((items: any[]) => bulkSaveMutation.mutateAsync(items).then(() => true).catch(() => false), [bulkSaveMutation]);
  
  const refreshData = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: KEYS.personal(user?.id || '') });
      if(householdId) queryClient.invalidateQueries({ queryKey: KEYS.family(householdId) });
  }, [queryClient, user, householdId]);

  return {
    foodItems,
    familyFoodItems,
    isLoading: isLoadingPersonal || isLoadingFamily,
    error: errorPersonal ? (errorPersonal as Error).message : null,
    saveItem,
    saveItemsBulk,
    deleteItem,
    refreshData
  };
};
