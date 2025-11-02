import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// FIX: Create a valid i18n/index.ts module with provider, hook, and translations.

type Language = 'en' | 'de';
type Translations = Record<string, string | Record<string, string>>;

const translations: Record<Language, Translations> = {
  en: {
    'header.title': 'Food Memory Tracker',
    'header.searchPlaceholder': 'Search by name, tag, notes...',
    'header.filter.type.all': 'All Types',
    'header.filter.type.products': 'Products',
    'header.filter.type.dishes': 'Dishes',
    'header.filter.all': 'All Ratings',
    'header.filter.liked': 'Liked (4+ Stars)',
    'header.filter.disliked': 'Disliked (1-2 Stars)',
    'header.sort.dateDesc': 'Date (Newest First)',
    'header.sort.dateAsc': 'Date (Oldest First)',
    'header.sort.ratingDesc': 'Rating (High to Low)',
    'header.sort.ratingAsc': 'Rating (Low to High)',
    'header.sort.nameAsc': 'Name (A-Z)',
    'header.sort.nameDesc': 'Name (Z-A)',
    'form.editTitle': 'Edit Entry',
    'form.addNewButton': 'Add New Entry',
    'form.button.scanBarcode': 'Scan Barcode',
    'form.button.scanNew': 'Scan Product',
    'form.button.takePhoto': 'Take Photo',
    'form.button.upload': 'Upload',
    'form.button.dictate': 'Dictate',
    'form.image.removeAria': 'Remove image',
    'form.placeholder.name': 'Product Name (e.g., Organic Granola)',
    'form.placeholder.dishName': 'Dish Name (e.g., Pizza Margherita)',
    'form.placeholder.restaurant': 'Restaurant Name',
    'form.placeholder.cuisine': 'Cuisine Type (e.g., Italian)',
    'form.placeholder.price': 'Price',
    'form.label.rating': 'Rating',
    'form.aria.rate': 'Rate {{star}} star',
    'form.aria.ratePlural': 'Rate {{star}} stars',
    'form.placeholder.notes': 'Notes (e.g., taste, occasion, why you liked/disliked it)',
    'form.placeholder.tags': 'Tags (comma-separated, e.g., snack, sweet, vegan)',
    'form.placeholder.purchaseLocation': 'Purchase Location (e.g., Whole Foods)',
    'form.label.nutriScore': 'Nutri-Score',
    'form.aria.selectNutriScore': 'Select Nutri-Score {{score}}',
    'form.ingredients.title': 'Ingredients & Dietary Info',
    'form.button.scanIngredients': 'Scan Ingredients from Image',
    'form.ingredients.loading': 'Analyzing ingredients...',
    'form.dietary.title': 'Dietary Flags',
    'form.dietary.lactoseFree': 'Lactose-Free',
    'form.dietary.vegan': 'Vegan',
    'form.dietary.glutenFree': 'Gluten-Free',
    'form.allergens.title': 'Allergens',
    'form.ingredients.ingredientsList': 'Ingredients',
    'form.ingredients.placeholder': 'No ingredients listed. Scan the ingredients list to add them.',
    'form.error.nameAndRating': 'Please provide a name and a rating.',
    'form.button.cancel': 'Cancel',
    'form.button.update': 'Update Entry',
    'form.button.save': 'Save Entry',
    'form.aiProgress.readingName': 'Reading product name...',
    'form.aiProgress.findingScore': 'Finding Nutri-Score...',
    'form.aiProgress.generatingTags': 'Generating smart tags...',
    'form.aiProgress.searchingDatabase': 'Cross-referencing database...',
    'form.aiProgress.locatingProduct': 'Locating product in image...',
    'form.aiProgress.complete': 'Analysis complete!',
    'form.error.genericAiError': 'AI analysis failed. Please try again or enter details manually.',
    'form.error.ingredientsAiError': 'Could not analyze ingredients. Please check the image or enter them manually.',
    'form.error.offSearchDisabled': 'Barcode scanning requires the Open Food Facts search feature to be enabled in settings.',
    'form.error.barcodeError': 'Could not find product for this barcode.',
    'form.error.findRestaurants': 'Could not find nearby restaurants.',
    'form.error.geolocationUnsupported': 'Geolocation is not supported by your browser.',
    'form.error.geolocationPermission': 'Could not get location. Please allow location access.',
    'form.findRestaurants.loading': 'Finding nearby restaurants...',

    'list.empty.title': 'No Entries Yet',
    'list.empty.description': 'Start by adding a new food memory!',
    'card.productTooltip': 'Product',
    'card.dishTooltip': 'Dish',
    'card.publicTooltip': 'Public - visible to community',
    'card.privateTooltip': 'Private - only visible to you',
    'card.lactoseFreeTooltip': 'Lactose-Free',
    'card.veganTooltip': 'Vegan',
    'card.glutenFreeTooltip': 'Gluten-Free',
    'card.dishAt': 'at {{restaurant}}',
    'card.shareAria': 'Share {{name}}',
    'card.editAria': 'Edit {{name}}',
    'card.deleteAria': 'Delete {{name}}',
    
    'dashboard.welcome': 'Welcome Back!',
    'dashboard.recentlyAdded': 'Recently Added',
    'dashboard.topRated': 'Top Rated',
    'dashboard.viewAll': 'View All',
    'dashboard.empty.title': 'Your Food Diary is Empty',
    'dashboard.empty.description': 'Track your first food memory to get started.',

    'settings.title': 'Settings',
    'settings.closeAria': 'Close',
    'settings.general': 'General',
    'settings.theme.label': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.language.label': 'Language',
    'settings.features': 'Features',
    'settings.features.ai.label': 'Enable AI Features',
    'settings.features.ai.description': 'Use AI to automatically extract product info from images.',
    'settings.features.barcode.label': 'Enable Barcode Scanner',
    'settings.features.barcode.description': 'Quickly add products by scanning their barcode.',
    'settings.features.off.label': 'Enable Open Food Facts Search',
    'settings.features.off.description': 'Enhance product data with information from the Open Food Facts database.',
    'settings.apiKey.title': 'Gemini API Key',
    'settings.apiKey.description': 'AI features require a Google Gemini API key. Your key is stored securely in your browser.',
    'settings.apiKeyTest.placeholder': 'Enter your API key',
    'settings.apiKeyTest.button': 'Test & Save',
    'settings.apiKeyTest.status.testing': 'Testing key...',
    'settings.apiKeyTest.status.success': 'API Key is valid and saved!',
    'settings.apiKeyTest.status.error.invalidKey.start': 'API key not valid. ',
    'settings.apiKeyTest.status.error.invalidKey.linkText': 'Get a new key here.',
    'settings.apiKeyTest.status.error.invalidKey.end': '',
    'settings.apiKeyTest.status.error.generic': 'Test failed: {{message}}',
  },
  de: {
    // German translations would go here
  },
};

// Helper function to get a nested property from an object
const get = (obj: any, path: string, fallback: string) => {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result === undefined) return fallback;
        result = result[key];
    }
    return result || fallback;
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    // Default to English if saved language is not supported
    return (savedLang === 'de' || savedLang === 'en') ? savedLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string, options?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let text = get(langDict, key, key);
    if (options && typeof text === 'string') {
      Object.entries(options).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  };

  const value = { language, setLanguage, t };

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
