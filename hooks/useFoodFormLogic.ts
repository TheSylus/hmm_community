
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FoodItem, FoodItemType, NutriScore, GroceryCategory } from '../types';
import { analyzeFoodImage, analyzeIngredientsImage, hasValidApiKey, findNearbyRestaurants, BoundingBox } from '../services/geminiService';
import { fetchProductFromOpenFoodFacts, searchProductByNameFromOpenFoodFacts } from '../services/openFoodFactsService';
import { translateTexts } from '../services/translationService';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface UseFoodFormLogicProps {
  initialData?: FoodItem | null;
  initialItemType?: FoodItemType;
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
  startMode?: 'barcode' | 'camera' | 'none';
}

export const useFoodFormLogic = ({ initialData, initialItemType = 'product', onSaveItem, onCancel, startMode = 'none' }: UseFoodFormLogicProps) => {
  const { t, language } = useTranslation();
  const { isAiEnabled, isOffSearchEnabled } = useAppSettings();
  const [apiKeyValid, setApiKeyValid] = useState(false);

  useEffect(() => {
    setApiKeyValid(hasValidApiKey());
  }, []);

  const isAiAvailable = isAiEnabled && apiKeyValid;

  // --- Form State ---
  const [itemType, setItemType] = useState<FoodItemType>(initialItemType);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [isFamilyFavorite, setIsFamilyFavorite] = useState(false);
  const [category, setCategory] = useState<GroceryCategory>('other');
  
  // Product-specific
  const [nutriScore, setNutriScore] = useState<NutriScore | ''>('');
  const [calories, setCalories] = useState<number | ''>(''); // New State
  const [purchaseLocation, setPurchaseLocation] = useState('');
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
  
  const [autoExpandDetails, setAutoExpandDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  const resetFormState = useCallback(() => {
    setItemType(initialItemType);
    setName('');
    setRating(0);
    setNotes('');
    setImage(null);
    setNutriScore('');
    setCalories('');
    setPurchaseLocation('');
    setTags('');
    setIsFamilyFavorite(false);
    setIngredients([]);
    setAllergens([]);
    setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
    setRestaurantName('');
    setCuisineType('');
    setPrice('');
    setCategory(initialItemType === 'drugstore' ? 'personal_care' : (initialItemType === 'dish' ? 'restaurant_food' : 'other'));
    setError(null);
    setIsLoading(false);
    setAutoExpandDetails(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, [initialItemType]);

  useEffect(() => {
    if (initialData) {
      setItemType(initialData.itemType);
      setName(initialData.name);
      setRating(initialData.rating);
      setNotes(initialData.notes || '');
      setImage(initialData.image || null);
      setTags(initialData.tags?.join(', ') || '');
      setIsFamilyFavorite(initialData.isFamilyFavorite || false);
      setCategory(initialData.category || (initialData.itemType === 'drugstore' ? 'personal_care' : (initialData.itemType === 'dish' ? 'restaurant_food' : 'other')));
      
      if(initialData.itemType === 'product' || initialData.itemType === 'drugstore') {
        setNutriScore(initialData.nutriScore || '');
        setCalories(initialData.calories !== undefined && initialData.calories !== null ? initialData.calories : '');
        setPurchaseLocation(initialData.purchaseLocation?.join(', ') || '');
        setIngredients(initialData.ingredients || []);
        setAllergens(initialData.allergens || []);
        setDietary({
          isLactoseFree: initialData.isLactoseFree || false,
          isVegan: initialData.isVegan || false,
          isGlutenFree: initialData.isGlutenFree || false,
        });
        if (initialData.nutriScore || (initialData.purchaseLocation?.length || 0) > 0 || initialData.isVegan || (initialData.calories !== undefined && initialData.calories !== null)) {
            setAutoExpandDetails(true);
        }
      } else {
        setRestaurantName(initialData.restaurantName || '');
        setCuisineType(initialData.cuisineType || '');
        setPrice(initialData.price ?? '');
      }
    } else {
      resetFormState();
    }
  }, [initialData, resetFormState]);

  useEffect(() => {
      if (initialData) return; 
      
      if (startMode === 'barcode') {
          setIsBarcodeScannerOpen(true);
      } else if (startMode === 'camera') {
          setScanMode('main');
          setIsCameraOpen(true);
      }
  }, [startMode, initialData]);

  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedFields([]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  useEffect(() => {
      if (category === 'restaurant_food') {
          setItemType('dish');
      } else if (category === 'personal_care' || category === 'household') {
          setItemType('drugstore');
      } else {
          setItemType('product');
      }
  }, [category]);

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

  const handleScanMainImage = useCallback(() => {
    setScanMode('main');
    setIsCameraOpen(true);
  }, []);

  const handleScanIngredients = useCallback(() => {
    setScanMode('ingredients');
    setIsCameraOpen(true);
  }, []);

  const processSpokenProductName = useCallback(async (productName: string) => {
    if (!productName || !isOffSearchEnabled) return;
    
    setIsNameSearchLoading(true);
    setError(null);
    try {
      const offResult = await searchProductByNameFromOpenFoodFacts(productName, language);
      
      let mergedData = {
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

      setTags(current => (current ? `${current}, ` : '') + mergedData.tags.join(', '));
      // For spoken/merged data, we prefer keeping existing data if the new data is empty, but generally overwrite if new data exists
      setNutriScore(current => mergedData.nutriScore || current);
      setCalories(current => (mergedData.calories !== undefined && mergedData.calories !== null) ? mergedData.calories : current);
      setIngredients(current => mergedData.ingredients.length > 0 ? mergedData.ingredients : current);
      setAllergens(current => mergedData.allergens.length > 0 ? mergedData.allergens : current);
      setDietary(current => ({
          isLactoseFree: current.isLactoseFree || mergedData.isLactoseFree,
          isVegan: current.isVegan || mergedData.isVegan,
          isGlutenFree: current.isGlutenFree || mergedData.isGlutenFree,
      }));
      setHighlightedFields(newHighlightedFields);
      if (mergedData.tags.length > 0 || mergedData.nutriScore || mergedData.calories !== undefined) setAutoExpandDetails(true);

    } catch (e) {
      console.error("Error searching by product name:", e);
    } finally {
      setIsNameSearchLoading(false);
    }
  }, [isOffSearchEnabled, language]);

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
      setCalories(productData.calories !== undefined && productData.calories !== null ? productData.calories : '');
      setPurchaseLocation(productData.purchaseLocation?.join(', ') || '');
      setImage(productData.image || null);
      setIngredients(finalIngredients);
      setAllergens(finalAllergens);
      setDietary({
        isLactoseFree: productData.isLactoseFree || false,
        isVegan: productData.isVegan || false,
        isGlutenFree: productData.isGlutenFree || false,
      });
      
      if (productData.itemType === 'drugstore') {
          setItemType('drugstore');
          setCategory('personal_care');
      } else {
          setItemType('product');
          setCategory('other'); 
      }
      
      setAutoExpandDetails(true);

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
  
    if (!isAiAvailable) {
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
            t('form.aiProgress.locatingProduct')
        ];
        
        setAnalysisProgress({ active: true, message: progressMessages[0] });
        let messageIndex = 0;
        progressInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            setAnalysisProgress(prev => ({ ...prev, message: progressMessages[messageIndex] }));
        }, 1500);

        const aiResult = await analyzeFoodImage(imageDataUrl);
        
        if(progressInterval) clearInterval(progressInterval);
        
        let mergedData = {
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
        
        // Resetting state with new image data - STRICT OVERWRITE
        setName(mergedData.name);
        setTags(mergedData.tags.join(', '));
        setNutriScore(mergedData.nutriScore);
        
        // Critical Fix: Explicitly reset potentially stale data from previous scans
        setCalories('');
        setIngredients([]);
        setAllergens([]);
        setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
        
        if (aiResult.itemType === 'dish' || aiResult.itemType === 'drugstore' || aiResult.itemType === 'product') {
             if (aiResult.itemType === 'dish') {
                 setCategory('restaurant_food');
             } else if (aiResult.category) {
                 setCategory(aiResult.category);
             } else if (aiResult.itemType === 'drugstore') {
                 setCategory('personal_care');
             } else {
                 setCategory('other');
             }
        }
        
        const newHighlightedFields: string[] = [];
        if (mergedData.name) newHighlightedFields.push('name');
        if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
        if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');
        if (aiResult.category) newHighlightedFields.push('category');
        setHighlightedFields(newHighlightedFields);
        
        if (mergedData.nutriScore || mergedData.tags.length > 0) setAutoExpandDetails(true);

        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(aiResult.boundingBox);
        setIsCropperOpen(true);
        setIsLoading(false);

        if (aiResult.itemType === 'dish') {
            handleFindNearby();
        } else if (mergedData.name && isOffSearchEnabled) {
            setAnalysisProgress({ active: true, message: t('form.aiProgress.searchingDatabase') });
            
            try {
                const offResult = await searchProductByNameFromOpenFoodFacts(mergedData.name, language);
                
                // Merge tags (keep visual tags, add DB tags)
                setTags(prev => {
                    const existing = prev ? prev.split(',').map(s => s.trim()) : [];
                    const newTags = offResult.tags || [];
                    const combined = Array.from(new Set([...existing, ...newTags]));
                    return combined.join(', ');
                });
                
                // CRITICAL FIX: Strictly overwrite metadata with database results.
                // If the database returns undefined, we want to respect that (or use our cleared state), 
                // NOT fall back to 'prev' state which might be from a different product.
                setNutriScore((offResult.nutriScore as NutriScore) || '');
                setCalories((offResult.calories !== undefined && offResult.calories !== null) ? offResult.calories : '');
                setIngredients(offResult.ingredients || []);
                setAllergens(offResult.allergens || []);
                setDietary({
                    isLactoseFree: !!offResult.isLactoseFree,
                    isVegan: !!offResult.isVegan,
                    isGlutenFree: !!offResult.isGlutenFree,
                });
                
                setHighlightedFields(prev => {
                    const next = [...prev];
                    if (offResult.nutriScore && !prev.includes('nutriScore')) next.push('nutriScore');
                    if (offResult.calories !== undefined && !prev.includes('calories')) next.push('calories');
                    if ((offResult.tags?.length || 0) > 0 && !prev.includes('tags')) next.push('tags');
                    return next;
                });
                
                setAutoExpandDetails(true);

            } catch (offError) {
                console.warn("Could not fetch supplementary data from Open Food Facts:", offError);
            } finally {
                setAnalysisProgress({ active: false, message: '' });
            }
        } else {
             setAnalysisProgress({ active: false, message: '' });
        }

      } catch (e) {
        if(progressInterval) clearInterval(progressInterval);
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.genericAiError');
        setError(errorMessage);
        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(null);
        setIsCropperOpen(true);
        setAnalysisProgress({ active: false, message: '' });
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
        setAutoExpandDetails(true);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.ingredientsAiError');
        setError(errorMessage);
      } finally {
        setIngredientsLoading(false);
      }
    }
  }, [isAiAvailable, scanMode, t, isOffSearchEnabled, language, textsNeedTranslation, handleFindNearby]);

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
      category,
      isFamilyFavorite,
    };

    if (itemType === 'product' || itemType === 'drugstore') {
        onSaveItem({
          ...commonData,
          nutriScore: nutriScore || undefined,
          calories: calories !== '' ? Number(calories) : undefined,
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
  }, [name, rating, t, notes, image, tags, itemType, category, onSaveItem, nutriScore, calories, purchaseLocation, ingredients, allergens, dietary, restaurantName, cuisineType, price, isFamilyFavorite]);

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
      name, rating, notes, image, tags, isFamilyFavorite, category,
      nutriScore, calories, purchaseLocation, ingredients, allergens, dietary,
      restaurantName, cuisineType, price, itemType
    },
    formSetters: {
      setName, setRating, setNotes, setImage, setTags, setIsFamilyFavorite, setCategory,
      setNutriScore, setCalories, setPurchaseLocation, setIngredients, setAllergens, setRestaurantName, setCuisineType, setPrice, setItemType, setAutoExpandDetails
    },
    uiState: {
      isCameraOpen, isBarcodeScannerOpen, isSpeechModalOpen, isNameSearchLoading,
      isCropperOpen, uncroppedImage, suggestedCrop, isLoading, analysisProgress,
      highlightedFields, isIngredientsLoading, error, isFindingRestaurants,
      nearbyRestaurants, locationError, isAiAvailable, scanMode, autoExpandDetails
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
