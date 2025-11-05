import React, { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { FoodItem, FoodItemType, NutriScore } from '../types';
import { BoundingBox, analyzeFoodImage, analyzeIngredientsImage, hasValidApiKey, findNearbyRestaurants } from '../services/geminiService';
import { fetchProductFromOpenFoodFacts, searchProductByNameFromOpenFoodFacts } from '../services/openFoodFactsService';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';
import { StarIcon, SparklesIcon, CameraIcon, PlusCircleIcon, XMarkIcon, DocumentTextIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, BarcodeIcon, MicrophoneIcon, SpinnerIcon, MapPinIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { translateTexts } from '../services/translationService';

// Add type definitions for the Web Speech API for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FoodItemFormProps {
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
  initialData?: FoodItem | null;
  itemType: FoodItemType;
}

const nutriScoreOptions: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData, itemType }) => {
  const { t, language } = useTranslation();
  const { isAiEnabled, isBarcodeScannerEnabled, isOffSearchEnabled } = useAppSettings();
  
  const isEditing = !!initialData;
  const [apiKeyValid, setApiKeyValid] = useState(false);

  useEffect(() => {
    setApiKeyValid(hasValidApiKey());
  }, []);
  
  const isAiAvailable = isAiEnabled && apiKeyValid;

  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  // Product-specific
  const [nutriScore, setNutriScore] = useState<NutriScore | ''>('');
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


  // UI/Flow state
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

  const resetFormState = useCallback(() => {
    setName('');
    setRating(0);
    setNotes('');
    setImage(null);
    setNutriScore('');
    setPurchaseLocation('');
    setTags('');
    setIsPublic(false);
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
      setIsPublic(initialData.isPublic || false);
      
      if(initialData.itemType === 'product') {
        setNutriScore(initialData.nutriScore || '');
        setPurchaseLocation(initialData.purchaseLocation || '');
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

  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedFields([]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

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

  useEffect(() => {
    // Automatically search for restaurants when adding a new dish
    if (itemType === 'dish' && !isEditing && isAiAvailable) {
      handleFindNearby();
    }
  }, [itemType, isEditing, isAiAvailable, handleFindNearby]);


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
      // Non-critical error, do not show to user
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
  
    // For dishes, or if AI is disabled, just open the cropper
    if (itemType === 'dish' || !isAiAvailable) {
      setUncroppedImage(imageDataUrl);
      setSuggestedCrop(null);
      setIsCropperOpen(true);
      return;
    }
  
    // Logic for products with AI enabled
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

        // Step 1: Analyze image with AI
        const aiResult = await analyzeFoodImage(imageDataUrl);
        
        // Step 2: Fetch supplementary data from Open Food Facts
        let offResult: Partial<FoodItem> = {};
        if (aiResult.name && isOffSearchEnabled) {
            try {
                setAnalysisProgress(prev => ({ ...prev, message: t('form.aiProgress.searchingDatabase') }));
                offResult = await searchProductByNameFromOpenFoodFacts(aiResult.name);
            } catch (offError) {
                console.warn("Could not fetch supplementary data from Open Food Facts:", offError);
                // Non-critical error, proceed with AI data only
            }
        }
        
        if(progressInterval) clearInterval(progressInterval);
        setAnalysisProgress({ active: true, message: t('form.aiProgress.complete') });
        
        // Step 3: Merge AI and OFF results
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

        // Step 4: Translate if necessary
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
        
        // Step 5: Set form state
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
    setScanMode('main'); // File upload is always for the main image
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

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || rating === 0) {
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
      isPublic,
    };

    if (itemType === 'product') {
        onSaveItem({
          ...commonData,
          nutriScore: nutriScore || undefined,
          purchaseLocation: purchaseLocation || undefined,
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
  }, [name, rating, t, notes, image, tags, itemType, onSaveItem, nutriScore, purchaseLocation, ingredients, allergens, dietary, restaurantName, cuisineType, price, isPublic]);

  const removeImage = useCallback(() => {
    setImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, []);
  
  return (
    <>
      <style>{`
        .highlight-ai {
          animation: highlight-ai-anim 2.5s ease-out;
        }
        @keyframes highlight-ai-anim {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
          25% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .dark .highlight-ai {
            animation-name: highlight-ai-anim-dark;
        }
        @keyframes highlight-ai-anim-dark {
          0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
          25% { box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            {isEditing ? t('form.editTitle') : t('form.addNewButton')}
        </h2>

        <div className="space-y-6">

            {/* ACTION BUTTONS & PREVIEW */}
            <div className="space-y-4">
                <div className={`grid grid-cols-2 ${isBarcodeScannerEnabled && itemType === 'product' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
                    {isBarcodeScannerEnabled && itemType === 'product' && (
                        <button type="button" onClick={() => setIsBarcodeScannerOpen(true)} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-sky-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                            <BarcodeIcon className="w-5 h-5" />
                            <span>{t('form.button.scanBarcode')}</span>
                        </button>
                    )}
                    <button type="button" onClick={handleScanMainImage} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-indigo-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                        <CameraIcon className="w-5 h-5" />
                        <span>{itemType === 'product' ? t('form.button.scanNew') : t('form.button.takePhoto')}</span>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-gray-400 dark:disabled:bg-gray-500 text-sm" disabled={isLoading || analysisProgress.active}>
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>{t('form.button.upload')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => setIsSpeechModalOpen(true)} className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-teal-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                        <MicrophoneIcon className="w-5 h-5" />
                        <span>{t('form.button.dictate')}</span>
                    </button>
                </div>
                
                {/* Status indicators and Image Preview */}
                <div className="min-h-[1rem]">
                    {analysisProgress.active && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                            <p className="text-sm font-medium text-center">{analysisProgress.message}</p>
                        </div>
                    )}
                    {isLoading && !analysisProgress.active && (
                         <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                            <SpinnerIcon className="w-5 h-5" />
                            <p className="text-sm font-medium">Loading...</p>
                         </div>
                    )}
                    {image && !analysisProgress.active && !isLoading && (
                        <div className="relative w-28 h-28 rounded-lg overflow-hidden group shadow-md">
                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100"
                                aria-label={t('form.image.removeAria')}
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN FORM FIELDS */}
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={itemType === 'product' ? t('form.placeholder.name') : t('form.placeholder.dishName')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${highlightedFields.includes('name') ? 'highlight-ai' : ''} ${isNameSearchLoading ? 'pr-10' : ''}`}
                    />
                    {isNameSearchLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <SpinnerIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>

                {itemType === 'dish' && (
                  <>
                    <div>
                      <div className="relative">
                        <input
                            type="text"
                            placeholder={t('form.placeholder.restaurant')}
                            value={restaurantName}
                            onChange={e => {
                                setRestaurantName(e.target.value);
                                if (nearbyRestaurants.length > 0) {
                                    setNearbyRestaurants([]);
                                }
                            }}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 pr-12"
                        />
                         {isAiAvailable && (
                            <button
                                type="button"
                                onClick={handleFindNearby}
                                disabled={isFindingRestaurants}
                                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                                aria-label={t('form.button.findNearby.aria')}
                            >
                                {isFindingRestaurants ? (
                                <SpinnerIcon className="w-5 h-5" />
                                ) : (
                                <MapPinIcon className="w-5 h-5" />
                                )}
                            </button>
                         )}
                      </div>
                      {isFindingRestaurants && !locationError && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.findRestaurants.loading')}</p>}
                      {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
                      {nearbyRestaurants.length > 0 && (
                        <div className="mt-2">
                            <label htmlFor="restaurant-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.label.selectRestaurant')}</label>
                            <select
                            id="restaurant-select"
                            onChange={(e) => {
                                if (e.target.value) {
                                  const selected = nearbyRestaurants[parseInt(e.target.value, 10)];
                                  if(selected) {
                                      setRestaurantName(selected.name);
                                      if (selected.cuisine) {
                                          setCuisineType(selected.cuisine);
                                      }
                                      setNearbyRestaurants([]); 
                                  }
                                }
                            }}
                            className="w-full mt-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                            >
                            <option value="">{t('form.placeholder.selectRestaurant')}</option>
                            {nearbyRestaurants.map((r, i) => (
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
                            value={cuisineType}
                            onChange={e => setCuisineType(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                        />
                         <input
                            type="number"
                            placeholder={t('form.placeholder.price')}
                            value={price}
                            onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            step="0.01"
                            className="w-full sm:w-1/3 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                        />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-4">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">{t('form.label.rating')}</label>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                className="text-gray-400 dark:text-gray-600 hover:text-yellow-400 transition"
                                aria-label={t(star > 1 ? 'form.aria.ratePlural' : 'form.aria.rate', { star })}
                            >
                                <StarIcon className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : ''}`} filled={rating >= star} />
                            </button>
                        ))}
                    </div>
                </div>
                <textarea
                    placeholder={t('form.placeholder.notes')}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={itemType === 'product' ? 3 : 5}
                    className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                />
                <input
                    type="text"
                    placeholder={t('form.placeholder.tags')}
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${highlightedFields.includes('tags') ? 'highlight-ai' : ''}`}
                />
                
                {itemType === 'product' && (
                    <input
                        type="text"
                        placeholder={t('form.placeholder.purchaseLocation')}
                        value={purchaseLocation}
                        onChange={e => setPurchaseLocation(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                    />
                )}

                {itemType === 'product' && (
                  <>
                    <div className={`p-2 rounded-md transition-shadow ${highlightedFields.includes('nutriScore') ? 'highlight-ai' : ''}`}>
                        <div className="flex items-center gap-4">
                            <label className="text-gray-700 dark:text-gray-300 font-medium shrink-0">{t('form.label.nutriScore')}</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {nutriScoreOptions.map(score => (
                                    <button
                                        type="button"
                                        key={score}
                                        onClick={() => setNutriScore(current => current === score ? '' : score)}
                                        className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center transition-transform transform ${nutriScoreColors[score]} ${nutriScore === score ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'}`}
                                        aria-pressed={nutriScore === score}
                                        aria-label={t('form.aria.selectNutriScore', { score })}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Ingredients and Dietary Section */}
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('form.ingredients.title')}</h3>
                            {isAiAvailable && image && (
                                <button
                                    type="button"
                                    onClick={handleScanIngredients}
                                    disabled={isIngredientsLoading}
                                    className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1.5 px-3 rounded-md transition disabled:opacity-50"
                                >
                                    <DocumentTextIcon className="w-4 h-4" />
                                    <span>{t('form.button.scanIngredients')}</span>
                                </button>
                            )}
                        </div>
                        {isIngredientsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span>{t('form.ingredients.loading')}</span>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-2">
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('form.dietary.title')}:</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => handleDietaryChange('isLactoseFree')} aria-pressed={dietary.isLactoseFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isLactoseFree ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent text-blue-600 dark:text-blue-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <LactoseFreeIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.lactoseFree')}</span>
                                        </button>
                                        <button type="button" onClick={() => handleDietaryChange('isVegan')} aria-pressed={dietary.isVegan} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isVegan ? 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <VeganIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.vegan')}</span>
                                        </button>
                                        <button type="button" onClick={() => handleDietaryChange('isGlutenFree')} aria-pressed={dietary.isGlutenFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isGlutenFree ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <GlutenFreeIcon className="w-7 h-7" />
                                            <span className="text-xs font-semibold">{t('form.dietary.glutenFree')}</span>
                                        </button>
                                    </div>
                                </div>
                                {allergens.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 mt-3">{t('form.allergens.title')}:</h4>
                                        <AllergenDisplay allergens={allergens} />
                                    </div>
                                )}
                                {ingredients.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 mt-3">{t('form.ingredients.ingredientsList')}:</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 italic leading-snug">{ingredients.join(', ')}</p>
                                    </div>
                                )}
                                {ingredients.length === 0 && (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('form.ingredients.placeholder')}</p>
                                )}
                            </div>
                        )}
                    </div>
                  </>
                )}
            </div>
        </div>
        
        {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md text-sm mt-4">{error}</p>}
        
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <label htmlFor="share-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg cursor-pointer transition hover:bg-gray-200 dark:hover:bg-gray-700">
                <div className="max-w-[75%] pr-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{t('form.share.title')}</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('form.share.description')}</p>
                </div>
                <div className="relative">
                    <input id="share-toggle" type="checkbox" className="sr-only peer" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
                </div>
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
                >
                {t('form.button.cancel')}
                </button>
                <button
                type="submit"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors text-lg disabled:bg-green-400 dark:disabled:bg-gray-600"
                disabled={isLoading || analysisProgress.active || isIngredientsLoading || !name || rating === 0}
                >
                <PlusCircleIcon className="w-6 h-6" />
                {isEditing ? t('form.button.update') : t('form.button.save')}
                </button>
            </div>
        </div>
      </form>

      {isCameraOpen && <CameraCapture onCapture={handleImageFromCamera} onClose={() => setIsCameraOpen(false)} />}
      {isBarcodeScannerOpen && <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setIsBarcodeScannerOpen(false)} />}
      {isSpeechModalOpen && <SpeechInputModal onDictate={handleDictationResult} onClose={() => setIsSpeechModalOpen(false)} />}
      {isCropperOpen && uncroppedImage && <ImageCropper imageUrl={uncroppedImage} suggestedCrop={suggestedCrop} onCrop={handleCropComplete} onCancel={handleCropCancel} />}
    </>
  );
};