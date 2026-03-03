import { useCallback } from 'react';
import { FoodFormStateReturn } from './useFoodFormState';
import { analyzeFoodImage, analyzeIngredientsImage } from '../../services/geminiService';
import { fetchProductFromOpenDatabase, searchProductByNameFromOpenDatabase } from '../../services/openFoodFactsService';
import { translateTexts } from '../../services/translationService';
import { useTranslation } from '../../i18n/index';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { FoodItemType, NutriScore } from '../../types';

export const useFoodFormScanner = (state: FoodFormStateReturn, handleFindNearby: () => void) => {
  const { formState, formSetters, uiState, uiSetters } = state;
  const { t, language } = useTranslation();
  const { isOffSearchEnabled } = useAppSettings();

  const handleScanMainImage = useCallback(() => {
    uiSetters.setScanMode('main');
    uiSetters.setIsCameraOpen(true);
  }, [uiSetters]);

  const handleScanIngredients = useCallback(() => {
    uiSetters.setScanMode('ingredients');
    uiSetters.setIsCameraOpen(true);
  }, [uiSetters]);

  const processSpokenProductName = useCallback(async (productName: string) => {
    if (!productName || !isOffSearchEnabled) return;
    
    uiSetters.setIsNameSearchLoading(true);
    uiSetters.setAnalysisProgress({ active: true, message: t('form.aiProgress.searchingDatabase') });
    uiSetters.setError(null);
    try {
      const offResult = await searchProductByNameFromOpenDatabase(productName, formState.itemType, language);
      
      const mergedData = {
          tags: offResult.tags || [],
          nutriScore: (offResult.nutriScore || '') as NutriScore | '',
          calories: offResult.calories,
          ingredients: offResult.ingredients || [],
          allergens: offResult.allergens || [],
          isLactoseFree: offResult.isLactoseFree || false,
          isVegan: offResult.isVegan || false,
          isGlutenFree: offResult.isGlutenFree || false,
      };

      const newHighlightedFields: string[] = [];
      if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
      if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');
      if (mergedData.calories !== undefined) newHighlightedFields.push('calories');

      formSetters.setTags(current => (current ? `${current}, ` : '') + mergedData.tags.join(', '));
      formSetters.setNutriScore(current => mergedData.nutriScore || current);
      formSetters.setCalories(current => (mergedData.calories !== undefined && mergedData.calories !== null) ? mergedData.calories : current);
      formSetters.setIngredients(current => mergedData.ingredients.length > 0 ? mergedData.ingredients : current);
      formSetters.setAllergens(current => mergedData.allergens.length > 0 ? mergedData.allergens : current);
      formSetters.setDietary(current => ({
          isLactoseFree: current.isLactoseFree || mergedData.isLactoseFree,
          isVegan: current.isVegan || mergedData.isVegan,
          isGlutenFree: current.isGlutenFree || mergedData.isGlutenFree,
      }));
      uiSetters.setHighlightedFields(newHighlightedFields);
      if (mergedData.tags.length > 0 || mergedData.nutriScore || mergedData.calories !== undefined) formSetters.setAutoExpandDetails(true);

    } catch (e) {
      console.error("Error searching by product name:", e);
    } finally {
      uiSetters.setIsNameSearchLoading(false);
      uiSetters.setAnalysisProgress({ active: false, message: '' });
    }
  }, [isOffSearchEnabled, language, formState.itemType, formSetters, uiSetters, t]);

  const handleDictationResult = useCallback((transcript: string) => {
    uiSetters.setIsSpeechModalOpen(false);
    if (transcript) {
      formSetters.setName(transcript);
      if (formState.itemType === 'product' || formState.itemType === 'drugstore') {
        processSpokenProductName(transcript);
      }
    }
  }, [formState.itemType, processSpokenProductName, formSetters, uiSetters]);

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    uiSetters.setIsBarcodeScannerOpen(false);
    uiSetters.setError(null);

    if (!isOffSearchEnabled) {
      uiSetters.setError(t('form.error.offSearchDisabled'));
      return;
    }

    uiSetters.setIsLoading(true);
    uiSetters.setAnalysisProgress({ active: true, message: t('form.aiProgress.searchingDatabase') });
    try {
      const productData = await fetchProductFromOpenDatabase(barcode);
      
      let finalName = productData.name || '';
      let finalTags = productData.tags || [];
      let finalIngredients = productData.ingredients || [];
      let finalAllergens = productData.allergens || [];

      if (language !== 'en' && uiState.isAiAvailable) {
        uiSetters.setAnalysisProgress({ active: true, message: t('form.aiProgress.translating') || 'Translating...' });
        const textsToTranslate = [finalName, ...finalTags, ...finalIngredients, ...finalAllergens];
        try {
          const translated = await translateTexts(textsToTranslate, language);
          let currentIndex = 0;
          finalName = translated[currentIndex++];
          finalTags = translated.slice(currentIndex, currentIndex + finalTags.length);
          currentIndex += finalTags.length;
          finalIngredients = translated.slice(currentIndex, currentIndex + finalIngredients.length);
          currentIndex += finalIngredients.length;
          finalAllergens = translated.slice(currentIndex, currentIndex + finalAllergens.length);
        } catch (e) {
          console.error("Failed to translate OFF results for form", e);
        }
      }

      formSetters.setName(finalName);
      formSetters.setTags(finalTags.join(', '));
      formSetters.setNutriScore((productData.nutriScore?.toUpperCase() as NutriScore) || '');
      formSetters.setCalories(productData.calories !== undefined && productData.calories !== null ? productData.calories : '');
      formSetters.setPurchaseLocation(productData.purchaseLocation?.join(', ') || '');
      formSetters.setImage(productData.image || null);
      formSetters.setIngredients(finalIngredients);
      formSetters.setAllergens(finalAllergens);
      formSetters.setDietary({
        isLactoseFree: productData.isLactoseFree || false,
        isVegan: productData.isVegan || false,
        isGlutenFree: productData.isGlutenFree || false,
      });
      
      if (productData.itemType === 'drugstore') {
          formSetters.setItemType('drugstore');
          formSetters.setCategory('personal_care');
      } else {
          formSetters.setItemType('product');
          formSetters.setCategory('other'); 
      }
      
      formSetters.setAutoExpandDetails(true);

    } catch(e) {
       console.error(e);
       const errorMessage = e instanceof Error ? e.message : t('form.error.barcodeError');
       uiSetters.setError(errorMessage);
    } finally {
        uiSetters.setIsLoading(false);
        uiSetters.setAnalysisProgress({ active: false, message: '' });
    }
  }, [isOffSearchEnabled, t, language, uiState.isAiAvailable, formSetters, uiSetters]);

  const textsNeedTranslation = useCallback((data: {name:string, tags:string[], ingredients:string[], allergens:string[]}) => {
    return data.name || data.tags.length > 0 || data.ingredients.length > 0 || data.allergens.length > 0;
  }, []);

  const handleImageFromCamera = useCallback(async (imageDataUrl: string) => {
    uiSetters.setIsCameraOpen(false);
    uiSetters.setError(null);
  
    if (!uiState.isAiAvailable) {
      uiSetters.setUncroppedImage(imageDataUrl);
      uiSetters.setSuggestedCrop(null);
      uiSetters.setIsCropperOpen(true);
      return;
    }
  
    if (uiState.scanMode === 'main') {
      let progressInterval: number | undefined;
      try {
        const progressMessages = [
            t('form.aiProgress.readingName'),
            t('form.aiProgress.findingScore'),
            t('form.aiProgress.generatingTags'),
            t('form.aiProgress.locatingProduct')
        ];
        
        uiSetters.setAnalysisProgress({ active: true, message: progressMessages[0] });
        let messageIndex = 0;
        progressInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            uiSetters.setAnalysisProgress(prev => ({ ...prev, message: progressMessages[messageIndex] }));
        }, 1500);

        const aiResult = await analyzeFoodImage(imageDataUrl);
        
        if(progressInterval) clearInterval(progressInterval);
        
        const mergedData = {
            name: aiResult.name || '',
            tags: aiResult.tags || [],
            nutriScore: (aiResult.nutriScore || '') as NutriScore | '',
            ingredients: [] as string[],
            allergens: [] as string[],
            isLactoseFree: false,
            isVegan: false,
            isGlutenFree: false,
        };
        
        if (language !== 'en' && textsNeedTranslation(mergedData)) {
            const textsToTranslate = [
                mergedData.name, ...mergedData.tags
            ];
            try {
                const translated = await translateTexts(textsToTranslate, language);
                if (translated.length === textsToTranslate.length) {
                    let i = 0;
                    mergedData.name = translated[i++];
                    mergedData.tags = translated.slice(i, i + mergedData.tags.length);
                }
            } catch (e) {
                console.error("Failed to translate AI results", e);
            }
        }
        
        formSetters.setName(mergedData.name);
        formSetters.setTags(mergedData.tags.join(', '));
        formSetters.setNutriScore(mergedData.nutriScore);
        
        formSetters.setCalories('');
        formSetters.setIngredients([]);
        formSetters.setAllergens([]);
        formSetters.setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
        
        let currentItemType: FoodItemType = 'product';
        
        if (aiResult.itemType) {
             if (aiResult.itemType === 'dish') {
                 formSetters.setItemType('dish');
                 formSetters.setCategory('restaurant_food');
                 currentItemType = 'dish';
             } else if (aiResult.itemType === 'drugstore') {
                 formSetters.setItemType('drugstore');
                 formSetters.setCategory('personal_care');
                 currentItemType = 'drugstore';
             } else {
                 formSetters.setItemType('product');
                 formSetters.setCategory(aiResult.category || 'other');
                 currentItemType = 'product';
             }
        }
        
        const newHighlightedFields: string[] = [];
        if (mergedData.name) newHighlightedFields.push('name');
        if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
        if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');
        if (aiResult.category) newHighlightedFields.push('category');
        uiSetters.setHighlightedFields(newHighlightedFields);
        
        if (mergedData.nutriScore || mergedData.tags.length > 0) formSetters.setAutoExpandDetails(true);

        uiSetters.setUncroppedImage(aiResult.image || imageDataUrl);
        uiSetters.setSuggestedCrop(aiResult.boundingBox);
        uiSetters.setIsCropperOpen(true);
        uiSetters.setIsLoading(false);

        if (currentItemType === 'dish') {
            handleFindNearby();
        } else if (mergedData.name && isOffSearchEnabled) {
            uiSetters.setAnalysisProgress({ active: true, message: t('form.aiProgress.searchingDatabase') });
            
            try {
                const offResult = await searchProductByNameFromOpenDatabase(mergedData.name, currentItemType, language);
                
                formSetters.setTags(prev => {
                    const existing = prev ? prev.split(',').map(s => s.trim()) : [];
                    const newTags = offResult.tags || [];
                    const combined = Array.from(new Set([...existing, ...newTags]));
                    return combined.join(', ');
                });
                
                formSetters.setNutriScore((offResult.nutriScore as NutriScore) || '');
                formSetters.setCalories((offResult.calories !== undefined && offResult.calories !== null) ? offResult.calories : '');
                formSetters.setIngredients(offResult.ingredients || []);
                formSetters.setAllergens(offResult.allergens || []);
                formSetters.setDietary({
                    isLactoseFree: !!offResult.isLactoseFree,
                    isVegan: !!offResult.isVegan,
                    isGlutenFree: !!offResult.isGlutenFree,
                });
                
                uiSetters.setHighlightedFields(prev => {
                    const next = [...prev];
                    if (offResult.nutriScore && !prev.includes('nutriScore')) next.push('nutriScore');
                    if (offResult.calories !== undefined && !prev.includes('calories')) next.push('calories');
                    if ((offResult.tags?.length || 0) > 0 && !prev.includes('tags')) next.push('tags');
                    return next;
                });
                
                formSetters.setAutoExpandDetails(true);

            } catch (offError) {
                console.warn("Could not fetch supplementary data from Open Database:", offError);
            } finally {
                uiSetters.setAnalysisProgress({ active: false, message: '' });
            }
        } else {
             uiSetters.setAnalysisProgress({ active: false, message: '' });
        }

      } catch (e) {
        if(progressInterval) clearInterval(progressInterval);
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.genericAiError');
        uiSetters.setError(errorMessage);
        uiSetters.setUncroppedImage(imageDataUrl);
        uiSetters.setSuggestedCrop(null);
        uiSetters.setIsCropperOpen(true);
        uiSetters.setAnalysisProgress({ active: false, message: '' });
      } 
    } else { 
      uiSetters.setIngredientsLoading(true);
      try {
        const result = await analyzeIngredientsImage(imageDataUrl);

        let finalIngredients = result.ingredients || [];
        let finalAllergens = result.allergens || [];
        
        if (language !== 'en' && (finalIngredients.length > 0 || finalAllergens.length > 0)) {
            try {
                const textsToTranslate = [...finalIngredients, ...finalAllergens];
                const translated = await translateTexts(textsToTranslate, language);
                if (translated.length === textsToTranslate.length) {
                    finalIngredients = translated.slice(0, finalIngredients.length);
                    finalAllergens = translated.slice(finalIngredients.length);
                }
            } catch(e) {
                console.error("Failed to translate ingredients AI results for form", e);
            }
        }

        formSetters.setIngredients(finalIngredients);
        formSetters.setAllergens(finalAllergens);
        formSetters.setDietary({
            isLactoseFree: result.isLactoseFree,
            isVegan: result.isVegan,
            isGlutenFree: result.isGlutenFree,
        });
        
        if (result.calories !== undefined && result.calories !== null) {
            formSetters.setCalories(result.calories);
            uiSetters.setHighlightedFields(prev => {
                if (!prev.includes('calories')) return [...prev, 'calories'];
                return prev;
            });
        }
        
        formSetters.setAutoExpandDetails(true);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.ingredientsAiError');
        uiSetters.setError(errorMessage);
      } finally {
        uiSetters.setIngredientsLoading(false);
      }
    }
  }, [uiState.isAiAvailable, uiState.scanMode, t, isOffSearchEnabled, language, textsNeedTranslation, handleFindNearby, formSetters, uiSetters]);

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    formSetters.setImage(croppedImageUrl);
    uiSetters.setIsCropperOpen(false);
    uiSetters.setUncroppedImage(null);
    uiSetters.setSuggestedCrop(null);
  }, [formSetters, uiSetters]);
  
  const handleCropCancel = useCallback(() => {
    if (uiState.uncroppedImage) formSetters.setImage(uiState.uncroppedImage);
    uiSetters.setIsCropperOpen(false);
    uiSetters.setUncroppedImage(null);
    uiSetters.setSuggestedCrop(null);
  }, [uiState.uncroppedImage, formSetters, uiSetters]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    uiSetters.setScanMode('main');
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageFromCamera(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [handleImageFromCamera, uiSetters]);

  return {
    handleScanMainImage,
    handleScanIngredients,
    processSpokenProductName,
    handleDictationResult,
    handleBarcodeScanned,
    handleImageFromCamera,
    handleCropComplete,
    handleCropCancel,
    handleFileChange
  };
};
