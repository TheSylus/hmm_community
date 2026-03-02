import { useState, useCallback, useRef, useEffect } from 'react';
import { FoodItem, FoodItemType, NutriScore, GroceryCategory } from '../../types';
import { hasValidApiKey, BoundingBox } from '../../services/geminiService';
import { useAppSettings } from '../../contexts/AppSettingsContext';

export interface UseFoodFormStateProps {
  initialData?: FoodItem | null;
  initialItemType?: FoodItemType;
  startMode?: 'barcode' | 'camera' | 'none';
}

export const useFoodFormState = ({ initialData, initialItemType = 'product', startMode = 'none' }: UseFoodFormStateProps) => {
  const { isAiEnabled } = useAppSettings();
  const [apiKeyValid, setApiKeyValid] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setApiKeyValid(hasValidApiKey());
    }, 0);
  }, []);

  const isAiAvailable = isAiEnabled && apiKeyValid;

  // Form State
  const [itemType, setItemType] = useState<FoodItemType>(initialItemType);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [isFamilyFavorite, setIsFamilyFavorite] = useState(true);
  const [category, setCategory] = useState<GroceryCategory>('other');
  
  // Product-specific
  const [nutriScore, setNutriScore] = useState<NutriScore | ''>('');
  const [calories, setCalories] = useState<number | ''>(''); 
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

  // UI/Flow State
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
    setIsFamilyFavorite(true);
    setIngredients([]);
    setAllergens([]);
    setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
    setRestaurantName('');
    setCuisineType('');
    setPrice('');
    
    const defaultCat = initialItemType === 'drugstore' ? 'personal_care' : (initialItemType === 'dish' ? 'restaurant_food' : 'other');
    setCategory(defaultCat);
    
    setError(null);
    setIsLoading(false);
    setAutoExpandDetails(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }, [initialItemType]);

  useEffect(() => {
    setTimeout(() => {
      if (initialData) {
        setItemType(initialData.itemType);
        setName(initialData.name);
        setRating(initialData.rating);
        setNotes(initialData.notes || '');
        setImage(initialData.image || null);
        setTags(initialData.tags?.join(', ') || '');
        setIsFamilyFavorite(initialData.isFamilyFavorite ?? false);
        setPrice(initialData.price ?? '');
        
        if (initialData.category) {
            setCategory(initialData.category);
        } else {
            const fallbackCat = initialData.itemType === 'drugstore' ? 'personal_care' : (initialData.itemType === 'dish' ? 'restaurant_food' : 'other');
            setCategory(fallbackCat);
        }
        
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
        }
      } else {
        resetFormState();
      }
    }, 0);
  }, [initialData, resetFormState]);

  useEffect(() => {
      if (initialData) return; 
      
      setTimeout(() => {
        if (startMode === 'barcode') {
            setIsBarcodeScannerOpen(true);
        } else if (startMode === 'camera') {
            setScanMode('main');
            setIsCameraOpen(true);
        }
      }, 0);
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
    setTimeout(() => {
      if (category === 'restaurant_food') {
          setItemType('dish');
      } else if (category === 'personal_care' || category === 'household') {
          setItemType('drugstore');
      } else {
          setItemType('product');
      }
    }, 0);
  }, [category]);

  return {
    formState: {
      name, rating, notes, image, tags, isFamilyFavorite, category,
      nutriScore, calories, purchaseLocation, ingredients, allergens, dietary,
      restaurantName, cuisineType, price, itemType
    },
    formSetters: {
      setName, setRating, setNotes, setImage, setTags, setIsFamilyFavorite, setCategory,
      setNutriScore, setCalories, setPurchaseLocation, setIngredients, setAllergens, setRestaurantName, setCuisineType, setPrice, setItemType, setAutoExpandDetails, setDietary
    },
    uiState: {
      isCameraOpen, isBarcodeScannerOpen, isSpeechModalOpen, isNameSearchLoading,
      isCropperOpen, uncroppedImage, suggestedCrop, isLoading, analysisProgress,
      highlightedFields, isIngredientsLoading, error, isFindingRestaurants,
      nearbyRestaurants, locationError, isAiAvailable, scanMode, autoExpandDetails
    },
    uiSetters: {
      setIsCameraOpen, setIsBarcodeScannerOpen, setIsSpeechModalOpen, setIsCropperOpen, setError,
      setScanMode, setUncroppedImage, setSuggestedCrop, setIsLoading, setAnalysisProgress,
      setHighlightedFields, setIngredientsLoading, setIsFindingRestaurants, setNearbyRestaurants, setLocationError, setIsNameSearchLoading
    },
    fileInputRef
  };
};

export type FoodFormStateReturn = ReturnType<typeof useFoodFormState>;
