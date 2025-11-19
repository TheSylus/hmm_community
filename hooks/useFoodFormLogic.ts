import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FoodItem, FoodItemType, NutriScore } from '../types';
import { analyzeFoodImage, analyzeIngredientsImage, hasValidApiKey, findNearbyRestaurants, BoundingBox } from '../services/geminiService';
import { fetchProductFromOpenFoodFacts, searchProductByNameFromOpenFoodFacts } from '../services/openFoodFactsService';
import { translateTexts } from '../services/translationService';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface UseFoodFormLogicProps {
  initialData?: FoodItem | null;
  itemType: FoodItemType;
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
}

export const useFoodFormLogic = ({ initialData, itemType, onSaveItem, onCancel }: UseFoodFormLogicProps) => {
  const { t, language } = useTranslation();
  const { isAiEnabled, isOffSearchEnabled } = useAppSettings();
  const [apiKeyValid, setApiKeyValid] = useState(false);

  useEffect(() => {
    setApiKeyValid(hasValidApiKey());
  }, []);

  const isAiAvailable = isAiEnabled && apiKeyValid;

  // --- Form State ---
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [isFamilyFavorite, setIsFamilyFavorite] = useState(false);
  
  // Product-specific
  const [nutriScore, setNutriScore] = useState<NutriScore | ''>('');
  const [purchaseLocation, setPurchaseLocation] = useState(''); // Kept as string for comma-separated input
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietary, setDietary] = useState({
    isLactoseFree: false,
    isVegan: false,
    isGlutenFree: false,
  });
  
  // Dish-specific
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [isFindingRestaurants, setIsFindingRestaurants] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<{name: string, cuisine?: string}[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // --- UI/Flow State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);
  const [isNameSearchLoading, setIsNameSearchLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'main' | 'ingredients'>('main');
  const [uncroppedImage, setUncroppedImage] = useState<string | null>(null);
  const [suggestedCrop, setSuggestedCrop] = useState<BoundingBox | null | undefined>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ active: false, message: '' });
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [isIngredientsLoading, setIngredientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  const resetFormState = useCallback(() => {
    setName('');
    setRating(0);
    setNotes('');
    setImage(null);
    setNutriScore('');
    setPurchaseLocation('');
    setTags('');
    setIsFamilyFavorite(false);
    setIngredients([]);
    setAllergens([]);
    setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
    setRestaurantName('');
    setCuisineType('');
    setPrice('');
    setError(null);
    setIsLoading(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRating(initialData.rating);
      setNotes(initialData.notes || '');
      setImage(initialData.image || null);
      setTags(initialData.tags?.join(', ') || '');
      setIsFamilyFavorite(initialData.isFamilyFavorite || false);
      
      if(initialData.itemType === 'product') {
        setNutriScore(initialData.nutriScore || '');
        setPurchaseLocation(initialData.purchaseLocation?.join(', ') || '');
        setIngredients(initialData.ingredients || []);
        setAllergens(initialData.allergens || []);
        setDietary({
          isLactoseFree: initialData.isLactoseFree || false,
          isVegan: initialData.isVegan || false,
          isGlutenFree: initialData.isGlutenFree || false,
        });
      } else {
        setRestaurantName(initialData.restaurantName || '');
        setCuisineType(initialData.cuisineType || '');
        setPrice(initialData.price ?? '');
      }
    } else {
      resetFormState();
    }
  }, [initialData, resetFormState]);

  // Remove highlights after delay
  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedFields([]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  // --- Logic Handlers ---

  const handleFindNearby = useCallback(() => {
    setLocationError(null);
    setNearbyRestaurants([]);
    setIsFindingRestaurants(true);

    if (!navigator.geolocation) {
      setLocationError(t('form.error.geolocationUnsupported'));
      setIsFindingRestaurants(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const restaurants = await findNearbyRestaurants(latitude, longitude);
          if (restaurants.length > 0) {
              setNearbyRestaurants(restaurants);
          } else {
              setLocationError(t('form.error.findRestaurants'));
          }
        } catch (err) {
          setLocationError(t('form.error.findRestaurants'));
          console.error(err);
        } finally {
          setIsFindingRestaurants(false);
        }
      },
      (error) => {
        setLocationError(t('form.error.geolocationPermission'));
        console.error(error);
        setIsFindingRestaurants(false);
      },
      { timeout: 10000 }
    );
  }, [t]);

  // Auto-find restaurants for new dishes
  // MOVED: This useEffect must be AFTER handleFindNearby is defined
  useEffect(() => {
    const isEditing = !!initialData;
    if (itemType === 'dish' && !isEditing && isAiAvailable) {
      handleFindNearby();
    }
  }, [itemType, initialData, isAiAvailable, handleFindNearby]);


  const handleScanMainImage = useCallback(() => {
    setScanMode('main');
    setIsCameraOpen(true);
  }, []);

  const handleScanIngredients = useCallback(() => {
    setScanMode('ingredients');
    setIsCameraOpen(true);
  }, []);

  const processSpokenProductName = useCallback(async (productName: string) => {
    if (!productName || !isOffSearchEnabled || itemType === 'dish') return;
    
    setIsNameSearchLoading(true);
    setError(null);
    try {
      const offResult = await searchProductByNameFromOpenFoodFacts(productName);
      
      let mergedData = {
          tags: offResult.tags || [],
          nutriScore: (offResult.nutriScore || '') as NutriScore | '',
          ingredients: offResult.ingredients || [],
          allergens: offResult.allergens || [],
          isLactoseFree: offResult.isLactoseFree || false,
          isVegan: offResult.isVegan || false,
          isGlutenFree: offResult.isGlutenFree || false,
      };

      const newHighlightedFields: string[] = [];
      if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
      if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');

      if (language !== 'en' && (mergedData.tags.length > 0 || mergedData.ingredients.length > 0 || mergedData.allergens.length > 0)) {
          const textsToTranslate = [...mergedData.tags, ...mergedData.ingredients, ...mergedData.allergens];
          try {
              const translated = await translateTexts(textsToTranslate, language);
              let i = 0;
              mergedData.tags = translated.slice(i, i + mergedData.tags.length);
              i += mergedData.tags.length;
              mergedData.ingredients = translated.slice(i, i + mergedData.ingredients.length);
              i += mergedData.ingredients.length;
              mergedData.allergens = translated.slice(i, i + mergedData.allergens.length);
          } catch (e) {
              console.error("Failed to translate OFF results for form", e);
          }
      }

      setTags(current => (current ? `${current}, ` : '') + mergedData.tags.join(', '));
      setNutriScore(current => current || mergedData.nutriScore);
      setIngredients(current => [...current, ...mergedData.ingredients]);
      setAllergens(current => [...current, ...mergedData.allergens]);
      setDietary(current => ({
          isLactoseFree: current.isLactoseFree || mergedData.isLactoseFree,
          isVegan: current.isVegan || mergedData.isVegan,
          isGlutenFree: current.isGlutenFree || mergedData.isGlutenFree,
      }));
      setHighlightedFields(newHighlightedFields);
    } catch (e) {
      console.error("Error searching by product name:", e);
    } finally {
      setIsNameSearchLoading(false);
    }
  }, [isOffSearchEnabled, itemType, language]);

  const handleDictationResult = useCallback((transcript: string) => {
    setIsSpeechModalOpen(false);
    if (transcript) {
      setName(transcript);
      if (itemType === 'product') {
        processSpokenProductName(transcript);
      }
    }
  }, [itemType, processSpokenProductName]);

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    setIsBarcodeScannerOpen(false);
    setError(null);

    if (!isOffSearchEnabled) {
      setError(t('form.error.offSearchDisabled'));
      return;
    }

    setIsLoading(true);
    try {
      const productData = await fetchProductFromOpenFoodFacts(barcode);
      
      let finalName = productData.name || '';
      let finalTags = productData.tags || [];
      let finalIngredients = productData.ingredients || [];
      let finalAllergens = productData.allergens || [];

      if (language !== 'en' && isAiAvailable) {
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

      setName(finalName);
      setTags(finalTags.join(', '));
      setNutriScore((productData.nutriScore?.toUpperCase() as NutriScore) || '');
      setImage(productData.image || null);
      setIngredients(finalIngredients);
      setAllergens(finalAllergens);
      setDietary({
        isLactoseFree: productData.isLactoseFree || false,
        isVegan: productData.isVegan || false,
        isGlutenFree: productData.isGlutenFree || false,
      });

    } catch(e) {
       console.error(e);
       const errorMessage = e instanceof Error ? e.message : t('form.error.barcodeError');
       setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [isOffSearchEnabled, t, language, isAiAvailable]);

  const textsNeedTranslation = useCallback((data: {name:string, tags:string[], ingredients:string[], allergens:string[]}) => {
    return data.name || data.tags.length > 0 || data.ingredients.length > 0 || data.allergens.length > 0;
  }, []);

  const handleImageFromCamera = useCallback(async (imageDataUrl: string) => {
    setIsCameraOpen(false);
    setError(null);
  
    if (itemType === 'dish' || !isAiAvailable) {
      setUncroppedImage(imageDataUrl);
      setSuggestedCrop(null);
      setIsCropperOpen(true);
      return;
    }
  
    if (scanMode === 'main') {
      let progressInterval: number | undefined;
      try {
        const progressMessages = [
            t('form.aiProgress.readingName'),
            t('form.aiProgress.findingScore'),
            t('form.aiProgress.generatingTags'),
            ...(isOffSearchEnabled ? [t('form.aiProgress.searchingDatabase')] : []),
            t('form.aiProgress.locatingProduct')
        ];
        setAnalysisProgress({ active: true, message: progressMessages[0] });
        let messageIndex = 0;
        progressInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            setAnalysisProgress(prev => ({ ...prev, message: progressMessages[messageIndex] }));
        }, 1500);

        const aiResult = await analyzeFoodImage(imageDataUrl);
        
        let offResult: Partial<FoodItem> = {};
        if (aiResult.name && isOffSearchEnabled) {
            try {
                setAnalysisProgress(prev => ({ ...prev, message: t('form.aiProgress.searchingDatabase') }));
                offResult = await searchProductByNameFromOpenFoodFacts(aiResult.name);
            } catch (offError) {
                console.warn("Could not fetch supplementary data from Open Food Facts:", offError);
            }
        }
        
        if(progressInterval) clearInterval(progressInterval);
        setAnalysisProgress({ active: true, message: t('form.aiProgress.complete') });
        
        const combinedTags = new Set([...(aiResult.tags || []), ...(offResult.tags || [])]);

        let mergedData = {
            name: aiResult.name || '',
            tags: Array.from(combinedTags),
            nutriScore: (aiResult.nutriScore || offResult.nutriScore || '') as NutriScore | '',
            ingredients: offResult.ingredients || [],
            allergens: offResult.allergens || [],
            isLactoseFree: offResult.isLactoseFree || false,
            isVegan: offResult.isVegan || false,
            isGlutenFree: offResult.isGlutenFree || false,
        };
        
        const newHighlightedFields: string[] = [];
        if (mergedData.name) newHighlightedFields.push('name');
        if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
        if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');

        if (language !== 'en' && textsNeedTranslation(mergedData)) {
            const textsToTranslate = [
                mergedData.name, ...mergedData.tags, ...mergedData.ingredients, ...mergedData.allergens
            ];
            
            try {
                const translated = await translateTexts(textsToTranslate, language);
                if (translated.length === textsToTranslate.length) {
                    let i = 0;
                    mergedData.name = translated[i++];
                    mergedData.tags = translated.slice(i, i + mergedData.tags.length);
                    i += mergedData.tags.length;
                    mergedData.ingredients = translated.slice(i, i + mergedData.ingredients.length);
                    i += mergedData.ingredients.length;
                    mergedData.allergens = translated.slice(i, i + mergedData.allergens.length);
                }
            } catch (e) {
                console.error("Failed to translate merged AI/OFF results for form", e);
            }
        }
        
        setName(mergedData.name);
        setTags(mergedData.tags.join(', '));
        setNutriScore(mergedData.nutriScore);
        setIngredients(mergedData.ingredients);
        setAllergens(mergedData.allergens);
        setDietary({
            isLactoseFree: mergedData.isLactoseFree,
            isVegan: mergedData.isVegan,
            isGlutenFree: mergedData.isGlutenFree,
        });

        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(aiResult.boundingBox);
        setIsCropperOpen(true);
        setHighlightedFields(newHighlightedFields);

      } catch (e) {
        if(progressInterval) clearInterval(progressInterval);
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.genericAiError');
        setError(errorMessage);
        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(null);
        setIsCropperOpen(true);
      } finally {
         setTimeout(() => setAnalysisProgress({ active: false, message: '' }), 500);
      }
    } else { // scanMode === 'ingredients'
      setIngredientsLoading(true);
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

        setIngredients(finalIngredients);
        setAllergens(finalAllergens);
        setDietary({
            isLactoseFree: result.isLactoseFree,
            isVegan: result.isVegan,
            isGlutenFree: result.isGlutenFree,
        });
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.ingredientsAiError');
        setError(errorMessage);
      } finally {
        setIngredientsLoading(false);
      }
    }
  }, [itemType, isAiAvailable, scanMode, t, isOffSearchEnabled, language, textsNeedTranslation]);

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    setImage(croppedImageUrl);
    setIsCropperOpen(false);
    setUncroppedImage(null);
    setSuggestedCrop(null);
  }, []);
  
  const handleCropCancel = useCallback(() => {
    if (uncroppedImage) setImage(uncroppedImage);
    setIsCropperOpen(false);
    setUncroppedImage(null);
    setSuggestedCrop(null);
  }, [uncroppedImage]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setScanMode('main');
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageFromCamera(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [handleImageFromCamera]);

  const handleDietaryChange = useCallback((key: keyof typeof dietary) => {
    setDietary(prev => ({...prev, [key]: !prev[key]}));
  }, []);

  const removeImage = useCallback(() => {
    setImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError(t('form.error.nameAndRating'));
      return;
    }
    if (rating === 0) {
      setError(t('form.error.nameAndRating'));
      return;
    }

    const commonData = {
      name,
      rating,
      notes: notes || undefined,
      image: image || undefined,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      itemType,
      isFamilyFavorite,
    };

    if (itemType === 'product') {
        onSaveItem({
          ...commonData,
          nutriScore: nutriScore || undefined,
          // Parse purchaseLocation string into array
          purchaseLocation: purchaseLocation ? purchaseLocation.split(',').map(loc => loc.trim()).filter(Boolean) : undefined,
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
          isLactoseFree: dietary.isLactoseFree,
          isVegan: dietary.isVegan,
          isGlutenFree: dietary.isGlutenFree,
        });
    } else { // itemType === 'dish'
        onSaveItem({
          ...commonData,
          restaurantName: restaurantName || undefined,
          cuisineType: cuisineType || undefined,
          price: price !== '' ? Number(price) : undefined,
        });
    }
  }, [name, rating, t, notes, image, tags, itemType, onSaveItem, nutriScore, purchaseLocation, ingredients, allergens, dietary, restaurantName, cuisineType, price, isFamilyFavorite]);

  const handleSelectRestaurant = useCallback((restaurantIndex: number) => {
      const selected = nearbyRestaurants[restaurantIndex];
      if(selected) {
          setRestaurantName(selected.name);
          if (selected.cuisine) {
              setCuisineType(selected.cuisine);
          }
          setNearbyRestaurants([]); 
      }
  }, [nearbyRestaurants]);

  return {
    formState: {
      name, rating, notes, image, tags, isFamilyFavorite,
      nutriScore, purchaseLocation, ingredients, allergens, dietary,
      restaurantName, cuisineType, price
    },
    formSetters: {
      setName, setRating, setNotes, setImage, setTags, setIsFamilyFavorite,
      setNutriScore, setPurchaseLocation, setRestaurantName, setCuisineType, setPrice
    },
    uiState: {
      isCameraOpen, isBarcodeScannerOpen, isSpeechModalOpen, isNameSearchLoading,
      isCropperOpen, uncroppedImage, suggestedCrop, isLoading, analysisProgress,
      highlightedFields, isIngredientsLoading, error, isFindingRestaurants,
      nearbyRestaurants, locationError, isAiAvailable
    },
    uiSetters: {
      setIsCameraOpen, setIsBarcodeScannerOpen, setIsSpeechModalOpen, setIsCropperOpen, setError
    },
    actions: {
      handleScanMainImage, handleScanIngredients, handleBarcodeScanned,
      handleImageFromCamera, handleDictationResult, handleCropComplete,
      handleCropCancel, handleFileChange, handleDietaryChange, handleFindNearby,
      handleSelectRestaurant, removeImage, handleSubmit
    },
    fileInputRef
  };
};