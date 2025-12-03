
import { useState, useEffect } from 'react';
import { FoodItem } from '../types';
import { useTranslation } from '../i18n/index';
import { translateTexts } from '../services/translationService';

const SOURCE_LANGUAGE = 'en';

// FIX: Made the hook generic to preserve the specific type of the item being passed in.
// This prevents losing properties on extended types like `HydratedShoppingListItem`.
export const useTranslatedItem = <T extends FoodItem>(item: T | null): T | null => {
    const { language } = useTranslation();
    const [translatedItem, setTranslatedItem] = useState(item);

    useEffect(() => {
        let isMounted = true;

        const translateItem = async () => {
            if (!item) {
                if (isMounted) setTranslatedItem(null);
                return;
            }

            if (language === SOURCE_LANGUAGE) {
                if (isMounted) setTranslatedItem(item);
                return;
            }
            
            // Set initial state to the original item to prevent UI jumps on language change
            // We do this immediately so the user sees something while the batch processor runs
            if (isMounted) setTranslatedItem(item);

            const name = item.name || '';
            const tags = item.tags || [];
            
            const textsToTranslate = [name, ...tags];
            
            // If everything is empty, stop.
            if (textsToTranslate.every(text => !text)) return;

            try {
                // The service now handles batching. We just await the result.
                const translatedTexts = await translateTexts(textsToTranslate, language);
                
                if (!isMounted || translatedTexts.length !== textsToTranslate.length) return;

                const newTranslatedItem = { ...item };
                let currentIndex = 0;

                newTranslatedItem.name = translatedTexts[currentIndex++];
                
                if (tags.length > 0) {
                    newTranslatedItem.tags = translatedTexts.slice(currentIndex, currentIndex + tags.length);
                    currentIndex += tags.length;
                }

                if (isMounted) setTranslatedItem(newTranslatedItem);
            } catch (error) {
                console.error("Failed to translate item:", error);
                if (isMounted) setTranslatedItem(item); // Fallback to original item on error
            }
        };

        translateItem();

        return () => { isMounted = false; };
    }, [item, language]);

    return translatedItem;
};
