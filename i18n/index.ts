// FIX: Implemented the internationalization (i18n) provider and hook with sample translations to resolve module errors and support multiple languages.
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

type Language = 'en' | 'de';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const en = {
    "header.title": "Food Memory Tracker",
    "form.editTitle": "Edit Entry",
    "form.addNewButton": "Add New Entry",
    "list.empty.title": "No Entries Yet",
    "list.empty.description": "Click 'Add New Entry' to start tracking your food memories!",
    "camera.error.permission": "Camera permission was denied. Please enable it in your browser settings.",
    "camera.error": "Could not access camera.",
    "camera.title": "Capture Image",
    "camera.captureButton": "Capture",
    "cropper.title": "Crop Image",
    "cropper.description": "Adjust the selection to crop the image.",
    "cropper.button.cancel": "Cancel",
    "cropper.button.confirm": "Confirm",
    "modal.image.closeAria": "Close image viewer",
    "modal.duplicate.title": "Duplicate Item?",
    "modal.duplicate.description": "You've already logged an item named \"{itemName}\". Do you want to add another one?",
    "modal.duplicate.button.goBack": "Go Back",
    "modal.duplicate.button.addAnyway": "Add Anyway",
    "settings.title": "Settings",
    "settings.closeAria": "Close settings",
    "settings.language.title": "Language",
    "settings.theme.title": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.offSearch.title": "Food Database Search",
    "settings.offSearch.description": "Enhance product data by searching the Open Food Facts database.",
    "settings.barcodeScanner.title": "Barcode Scanner",
    "settings.barcodeScanner.description": "Enable or disable the barcode scanner button in the form.",
    "settings.ai.title": "AI Features",
    "settings.ai.description": "Enable AI-powered image analysis and conversational search. Requires a Gemini API Key.",
    "settings.session.title": "Session",
    "settings.session.loggedInAs": "Logged in as:",
    "settings.session.logout": "Log Out",
    "settings.button.done": "Done",
    "settings.apiKeyTest.placeholder": "Enter your Gemini API Key...",
    "settings.apiKeyTest.button": "Test & Save Key",
    "settings.apiKeyTest.status.testing": "Testing key...",
    "settings.apiKeyTest.status.success": "API Key is valid and has been saved!",
    "settings.apiKeyTest.status.error.invalidKey.start": "API key not valid. Please ",
    "settings.apiKeyTest.status.error.invalidKey.linkText": "get a valid key from Google AI Studio",
    "settings.apiKeyTest.status.error.invalidKey.end": ".",
    "settings.apiKeyTest.status.error.generic": "Test failed: {message}",
    "apiKeyModal.title": "Enter Your Gemini API Key",
    "apiKeyModal.description": "To use the AI-powered features of this app, you need to provide your own Google Gemini API key. Your key is stored securely in your browser's local storage and is never sent to our servers.",
    "apiKeyModal.button.testAndSave": "Test & Save Key",
    "apiKeyModal.link.whereToGet": "Where can I get an API key?",
    "allergen.gluten": "Gluten",
    "allergen.dairy": "Dairy",
    "allergen.peanuts": "Peanuts",
    "allergen.tree_nuts": "Tree Nuts",
    "allergen.soy": "Soy",
    "allergen.eggs": "Eggs",
    "allergen.fish": "Fish",
    "allergen.shellfish": "Shellfish",
    "barcodeScanner.error.permission": "Camera access is required for barcode scanning. Please grant permission.",
    "barcodeScanner.title": "Scan Barcode",
    "barcodeScanner.description": "Center the barcode in the frame.",
    "apiKeyBanner.text": "Unlock AI features! Add your Gemini API key to automatically analyze food images.",
    "apiKeyBanner.button": "Add API Key",
    "card.lactoseFreeTooltip": "Lactose-Free",
    "card.veganTooltip": "Vegan",
    "card.glutenFreeTooltip": "Gluten-Free",
    "card.dishAt": "at {restaurant}",
    "card.addToShoppingListTooltip": "Add to Shopping List",
    "speechModal.title": "Dictate Product Name",
    "speechModal.description": "Start speaking and we'll transcribe the name for you.",
    "speechModal.listening": "Listening...",
    "conversationalSearch.placeholder": "Search with AI (e.g., 'healthy snacks')",
    "conversationalSearch.buttonAria": "Perform AI search",
    "conversationalSearch.tooltip": "Use AI to search your food items",
    "dashboard.empty.title": "Welcome to Your Food Journal!",
    "dashboard.empty.description": "This is where you'll see your recent and top-rated food memories. Get started by adding your first entry.",
    "dashboard.welcome": "Your Food Dashboard",
    "dashboard.recentlyAdded": "Recently Added",
    "dashboard.viewAll": "View All",
    "dashboard.topRated": "Top Rated",
    "filterPanel.title": "Filter & Sort",
    "filterPanel.aiSearchTitle": "Conversational Search",
    "filterPanel.search": "Search by name, notes, etc.",
    "filterPanel.filterByType": "Filter by Type",
    "filterPanel.filterByRating": "Filter by Rating",
    "filterPanel.sortBy": "Sort By",
    "filterPanel.reset": "Reset",
    "filterPanel.apply": "Apply",
    "header.searchPlaceholder": "Search...",
    "header.filter.type.all": "All Types",
    "header.filter.type.products": "Products",
    "header.filter.type.dishes": "Dishes",
    "header.filter.all": "All Ratings",
    "header.filter.liked": "Liked (4+ Stars)",
    "header.filter.disliked": "Disliked (1-2 Stars)",
    "header.sort.dateDesc": "Date (Newest)",
    "header.sort.dateAsc": "Date (Oldest)",
    "header.sort.ratingDesc": "Rating (High-Low)",
    "header.sort.ratingAsc": "Rating (Low-High)",
    "header.sort.nameAsc": "Name (A-Z)",
    "header.sort.nameDesc": "Name (Z-A)",
    "auth.emailPlaceholder": "Email",
    "auth.passwordPlaceholder": "Password",
    "auth.magicLinkSuccess": "Check your email for the confirmation link!",
    "auth.signUp": "Sign Up",
    "auth.signIn": "Sign In",
    "auth.toggle.signIn": "Already have an account? Sign In",
    "auth.toggle.signUp": "Don't have an account? Sign Up",
    "offline.message": "You are currently offline. Some features may be limited and changes will be synced when you're back online.",
    "discover.loading": "Loading community entries...",
    "discover.title": "Discover",
    "discover.empty.title": "Nothing to Discover Yet",
    "discover.empty.description": "Be the first to share a food memory with the community!",
    "groups.title": "Your Groups",
    "groups.newListPlaceholder": "New group name...",
    "groups.createButton": "Create",
    "groups.empty": "You are not a part of any groups yet. Create one to get started!",
    "groups.members": "{count, plural, =0 {0 members} =1 {1 member} other {# members}}",
    "form.error.geolocationUnsupported": "Geolocation is not supported by your browser.",
    "form.error.findRestaurants": "Could not find nearby restaurants.",
    "form.error.geolocationPermission": "Permission to access location was denied. Please enable it in your browser settings to find nearby restaurants.",
    "form.findRestaurants.loading": "Finding nearby restaurants...",
    "form.label.selectRestaurant": "Or select from nearby:",
    "form.placeholder.selectRestaurant": "Select a restaurant...",
    "form.button.findNearby.aria": "Find nearby restaurants",
    "form.error.offSearchDisabled": "Open Food Facts search is disabled in settings.",
    "form.error.barcodeError": "Could not find product for this barcode.",
    "form.aiProgress.readingName": "Analyzing image for product name...",
    "form.aiProgress.findingScore": "Looking for Nutri-Score...",
    "form.aiProgress.generatingTags": "Generating relevant tags...",
    "form.aiProgress.searchingDatabase": "Cross-referencing food database...",
    "form.aiProgress.locatingProduct": "Locating product in image...",
    "form.aiProgress.complete": "Analysis complete!",
    "form.error.genericAiError": "Could not analyze image with AI.",
    "form.error.ingredientsAiError": "Could not analyze ingredients with AI.",
    "form.error.nameAndRating": "Please provide a name and a rating.",
    "form.image.removeAria": "Remove image",
    "form.placeholder.name": "Product Name (e.g., Organic Whole Milk)",
    "form.placeholder.dishName": "Dish Name (e.g., Margherita Pizza)",
    "form.placeholder.restaurant": "Restaurant Name",
    "form.placeholder.cuisine": "Cuisine Type (e.g., Italian)",
    "form.placeholder.price": "Price",
    "form.label.rating": "Rating",
    "form.aria.rate": "Rate {star} star",
    "form.aria.ratePlural": "Rate {star} stars",
    "form.placeholder.notes": "Notes (e.g., taste, occasion, memories...)",
    "form.placeholder.tags": "Tags (comma-separated, e.g., snack, sweet, treat)",
    "form.placeholder.purchaseLocation": "Where did you get it? (e.g., Whole Foods)",
    "form.label.nutriScore": "Nutri-Score",
    "form.aria.selectNutriScore": "Select Nutri-Score {score}",
    "form.ingredients.title": "Ingredients & Dietary",
    "form.button.scanIngredients": "Scan Ingredients",
    "form.ingredients.loading": "Analyzing ingredients...",
    "form.dietary.title": "Dietary Flags",
    "form.dietary.lactoseFree": "Lactose-Free",
    "form.dietary.vegan": "Vegan",
    "form.dietary.glutenFree": "Gluten-Free",
    "form.allergens.title": "Potential Allergens",
    "form.ingredients.ingredientsList": "Ingredients",
    "form.ingredients.placeholder": "No ingredients data. Use the 'Scan Ingredients' button if you have an image of the list.",
    "form.share.title": "Sharing Options",
    "form.share.private": "Private",
    "form.share.privateDesc": "Only you can see this entry.",
    "form.share.community": "Share with Community",
    "form.share.communityDesc": "Make this entry visible to everyone in the Discover tab.",
    "form.share.group": "Share with Group",
    "form.share.groupDesc": "Share this with members of a specific shopping list.",
    "form.share.selectGroup": "Select a group...",
    "form.button.cancel": "Cancel",
    "form.button.update": "Update Entry",
    "form.button.save": "Save Entry",
    "form.button.scanBarcode": "Scan Code",
    "form.button.scanNew": "Scan Product",
    "form.button.takePhoto": "Take Photo",
    "form.button.upload": "Upload",
    "form.button.dictate": "Dictate",
    "detail.notesTitle": "Notes",
    "detail.tagsTitle": "Tags",
    "detail.dietaryTitle": "Dietary Information",
    "detail.allergensTitle": "Potential Allergens",
    "detail.ingredientsTitle": "Ingredients",
    "detail.status": "Status",
    "detail.statusPublic": "Public",
    "detail.statusPrivate": "Private",
    "addToListModal.title": "Add '{itemName}' to a list",
    "addToListModal.quantity": "Quantity",
    "addToListModal.selectList": "Select a list",
    "addToListModal.noLists": "You don't have any shopping lists yet. Create one in the Groups tab.",
    "addToListModal.button.add": "Add to List",
    "addToListModal.button.cancel": "Cancel",
    "toast.addedToList": "'{itemName}' added to {listName}.",
};

const de: Record<string, string> = { ...en, "header.title": "Essenserinnerungs-Tracker", "form.editTitle": "Eintrag bearbeiten" };

const fullTranslations: Record<Language, Record<string, string>> = { en, de };

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang === 'en' || savedLang === 'de') ? savedLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, options?: Record<string, string | number>) => {
    let translation = fullTranslations[language][key] || key;
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        const regex = new RegExp(`{${k}}`, 'g');
        translation = translation.replace(regex, String(v));
      });
    }
    return translation;
  }, [language]);

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