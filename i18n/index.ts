import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type Language = 'en' | 'de';

const translations: Record<Language, any> = {
  en: {
    header: {
      title: "Food Memory Tracker",
      shoppingListAria: "Open shopping list",
      searchPlaceholder: "Search by name or notes...",
      filter: {
        all: "All Ratings",
        liked: "Liked (4+ Stars)",
        disliked: "Disliked (1-2 Stars)",
        type: {
          all: "All Types",
          products: "Products",
          dishes: "Dishes",
        },
      },
      sort: {
        dateDesc: "Date (Newest First)",
        dateAsc: "Date (Oldest First)",
        ratingDesc: "Rating (Highest First)",
        ratingAsc: "Rating (Lowest First)",
        nameAsc: "Name (A-Z)",
        nameDesc: "Name (Z-A)",
      },
    },
    navigation: {
        dashboard: "Dashboard",
        myList: "My List",
        discover: "Discover",
        groups: "Groups",
    },
    form: {
      addNewButton: 'Add New Item',
      editTitle: 'Edit Item',
      button: {
        scanBarcode: "Scan Barcode",
        scanNew: "Scan Product",
        takePhoto: "Take Photo",
        upload: "Upload",
        dictate: "Dictate",
        scanIngredients: "Scan Ingredients",
        findNearby: {
            aria: "Find nearby restaurants"
        },
        cancel: 'Cancel',
        save: 'Save Item',
        update: 'Update Item',
      },
      placeholder: {
        name: 'Product Name (e.g., "Organic Oat Milk")',
        dishName: 'Dish Name (e.g., "Margherita Pizza")',
        restaurant: "Restaurant Name",
        selectRestaurant: "Or select a nearby suggestion...",
        cuisine: "Cuisine Type (e.g., 'Italian')",
        price: "Price",
        notes: 'Your notes, memories, or why you liked/disliked it...',
        tags: 'Tags, separated by commas (e.g., "snack, sweet, vegan")',
        purchaseLocation: 'Purchase Location (e.g., "Whole Foods")',
      },
      label: {
        rating: 'Rating',
        nutriScore: 'Nutri-Score',
        selectRestaurant: 'Nearby Suggestions:',
      },
      image: {
        removeAria: 'Remove image',
      },
      error: {
        nameAndRating: 'Please provide a name and a rating (at least one star).',
        genericAiError: "Could not analyze image with AI. Please try again or enter details manually.",
        ingredientsAiError: "Could not analyze ingredients list with AI.",
        barcodeError: "Could not fetch product data for this barcode.",
        offSearchDisabled: "Food database search is disabled in settings.",
        geolocationUnsupported: "Geolocation is not supported by your browser.",
        geolocationPermission: "Could not get location. Please enable location permissions.",
        findRestaurants: "Could not find nearby restaurants.",
      },
      aiProgress: {
        readingName: "Reading product name...",
        findingScore: "Looking for Nutri-Score...",
        generatingTags: "Generating smart tags...",
        searchingDatabase: "Checking food database...",
        locatingProduct: "Locating product in image...",
        complete: "Analysis complete!",
      },
      findRestaurants: {
        loading: "Getting your location to find restaurants..."
      },
      ingredients: {
        title: "Ingredients & Dietary Info",
        loading: "Analyzing ingredients...",
        ingredientsList: "Ingredients",
        placeholder: "No ingredients data. Scan the ingredients list using the button above.",
      },
      dietary: {
        title: "Dietary Properties",
        lactoseFree: "Lactose-Free",
        vegan: "Vegan",
        glutenFree: "Gluten-Free",
      },
      allergens: {
        title: "Detected Allergens",
      },
      aria: {
        rate: 'Rate {{star}} star',
        ratePlural: 'Rate {{star}} stars',
        selectNutriScore: "Select Nutri-Score {{score}}",
      },
      share: {
        title: "Sharing",
        private: "Private",
        privateDesc: "Only you can see this item.",
        community: "Community",
        communityDesc: "Visible to everyone in the Discover tab.",
        group: "Share with a Group",
        groupDesc: "Visible only to members of the selected group.",
        selectGroup: "Select a group..."
      }
    },
    list: {
      empty: {
        title: "Your list is empty",
        description: "Add a new item to start tracking your food memories.",
      },
      filteredEmpty: {
        title: "No Matching Items",
        description: "Try adjusting your search or filter settings.",
        resetButton: "Reset Filters"
      }
    },
    dashboard: {
        welcome: "What have you tried today?",
        recentlyAdded: "Recently Added",
        topRated: "Your Top Rated",
        viewAll: "View All",
        empty: {
            title: "Welcome to Your Food Tracker!",
            description: "Keep a diary of everything you eat and drink. Never forget a favorite again."
        }
    },
    discover: {
        title: "Discover",
        loading: "Loading community submissions...",
        empty: {
            title: "Nothing to discover yet",
            description: "Be the first to share an item with the community!"
        }
    },
    groups: {
        title: "My Groups",
        newListPlaceholder: "New group name...",
        createButton: "Create",
        empty: "You haven't joined any groups yet. Create one to get started!",
        members: "{{count}} member",
        members_plural: "{{count}} members"
    },
    settings: {
      title: "Settings",
      closeAria: "Close settings",
      language: {
        title: "Language",
      },
      theme: {
        title: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      ai: {
        title: "AI Features (Gemini)",
        description: "Enable image analysis, smart search, and automatic translations.",
      },
      barcodeScanner: {
        title: "Barcode Scanner",
        description: "Enable the barcode scanner for quick product entry.",
      },
      offSearch: {
          title: "Food Database Search",
          description: "Use the Open Food Facts database to supplement product data from barcodes or name searches."
      },
      session: {
        title: "Session",
        loggedInAs: "Logged in as:",
        logout: "Log Out",
      },
      button: {
        done: "Done",
      },
      apiKeyTest: {
        placeholder: "Enter your Gemini API Key here",
        button: "Test & Save",
        status: {
            testing: "Testing key...",
            success: "API Key is valid and has been saved!",
            error: {
                invalidKey: {
                    start: "This API key is not valid. Please ",
                    linkText: "get a valid key from Google AI Studio",
                    end: " and try again."
                },
                generic: "Test failed: {{message}}"
            }
        }
      }
    },
    camera: {
      title: "Take Photo",
      error: {
        permission: "Camera access was denied. Please enable it in your browser settings.",
        default: "Could not start the camera. Please check permissions.",
      },
      captureButton: "Capture",
    },
    barcodeScanner: {
        title: "Scan Barcode",
        description: "Center the product's barcode inside the frame.",
        error: {
            permission: "Camera access is required for the barcode scanner."
        }
    },
    speechModal: {
        title: "Dictate Product Name",
        description: "Start speaking and the name will appear below.",
        listening: "Listening...",
    },
    cropper: {
      title: "Crop Image",
      description: "Adjust the selection to focus on the product.",
      button: {
        cancel: "Cancel",
        confirm: "Confirm",
      },
    },
    card: {
      productTooltip: "Product",
      dishTooltip: "Dish",
      publicTooltip: "Public",
      privateTooltip: "Private",
      groupTooltip: "Shared with Group",
      lactoseFreeTooltip: "Lactose-Free",
      veganTooltip: "Vegan",
      glutenFreeTooltip: "Gluten-Free",
      editAria: "Edit {{name}}",
      deleteAria: "Delete {{name}}",
      shareAria: "Share {{name}}",
      dishAt: "at {{restaurant}}",
    },
    share: {
        title: "Share '{{name}}'",
        text: "I rated '{{name}}' {{rating}}/5 stars on my Food Memory Tracker!",
        text_unrated: "Check out '{{name}}' on my Food Memory Tracker!",
    },
    allergen: {
        gluten: "Contains Gluten",
        dairy: "Contains Dairy",
        peanuts: "Contains Peanuts",
        tree_nuts: "Contains Tree Nuts",
        soy: "Contains Soy",
        eggs: "Contains Eggs",
        fish: "Contains Fish",
        shellfish: "Contains Shellfish",
    },
    filterPanel: {
        title: "Filter & Sort",
        aiSearchTitle: "AI Smart Search",
        search: "Search by Name / Notes",
        filterByType: "Filter by Type",
        filterByRating: "Filter by Rating",
        sortBy: "Sort By",
        reset: "Reset",
        apply: "Apply Filters"
    },
    conversationalSearch: {
        placeholder: "e.g., 'snacks I liked that were vegan'",
        buttonAria: "Perform AI search",
        tooltip: "Powered by Gemini"
    },
    modal: {
        image: {
            closeAria: "Close enlarged image"
        },
        shared: {
            close: "Close"
        },
        duplicate: {
          title: "Duplicate Item?",
          description: "You've already saved an item with a similar name ('{{itemName}}'). Would you still like to add this new one?",
          button: {
            goBack: "Go Back & Edit",
            addAnyway: "Add Anyway"
          }
        }
    },
    detail: {
        notesTitle: "Notes",
        tagsTitle: "Tags",
        dietaryTitle: "Dietary Properties",
        allergensTitle: "Allergens",
        ingredientsTitle: "Ingredients",
        status: "Status",
        statusPublic: "Public",
        statusPrivate: "Private",
        commentsTitle: "Comments",
        noComments: "Be the first to comment.",
        addCommentPlaceholder: "Add a comment...",
        sendComment: "Send"
    },
    shoppingList: {
        title: "Shopping List",
        uncategorized: "Uncategorized",
        empty: "This list is empty. Add items from your collection!",
        clear: "Clear Checked Items",
        removeAria: "Remove {{name}} from list",
        toggleDetailsAria: "Toggle details",
        collaboration: {
            members: "Members",
            you: "You",
            someone: "Someone",
            addedBy: "Added by {{name}}",
            checkedBy: "Checked by {{name}}",
        },
        share: {
            inviteButton: "Invite Members",
            linkCopied: "Invite link copied!",
            copyFailed: "Could not copy link."
        },
        manage: {
            buttonTitle: "Manage list",
        },
        delete: {
            button: "Delete List",
            confirm: "Are you sure you want to delete the list '{{listName}}'? This cannot be undone."
        },
        leave: {
            button: "Leave List",
            confirm: "Are you sure you want to leave the list '{{listName}}'?"
        },
        tab: {
            checklist: "Checklist",
            feed: "Group Feed"
        },
        feed: {
            empty: "No one has shared anything with this group yet."
        }
    },
    group: {
        addAria: "Add {{name}} to a shopping list"
    },
    offline: {
        message: "You are currently offline. Some features may be limited."
    },
    apiKeyBanner: {
      text: "Unlock AI features by adding your Gemini API key.",
      button: "Add Key"
    },
    apiKeyModal: {
        title: "Enable AI Features",
        description: "To use features like image analysis and smart search, you need a Google Gemini API key. It's free and easy to get.",
        button: {
            testAndSave: "Test & Save Key"
        },
        link: {
            whereToGet: "Get your API key from Google AI Studio"
        }
    }
  },
  de: {
    header: {
      title: "Food Memory Tracker",
      shoppingListAria: "Einkaufsliste öffnen",
      searchPlaceholder: "Suche nach Name oder Notizen...",
      filter: {
        all: "Alle Bewertungen",
        liked: "Gemocht (4+ Sterne)",
        disliked: "Nicht gemocht (1-2 Sterne)",
        type: {
          all: "Alle Typen",
          products: "Produkte",
          dishes: "Gerichte",
        },
      },
      sort: {
        dateDesc: "Datum (Neueste zuerst)",
        dateAsc: "Datum (Älteste zuerst)",
        ratingDesc: "Bewertung (Höchste zuerst)",
        ratingAsc: "Bewertung (Niedrigste zuerst)",
        nameAsc: "Name (A-Z)",
        nameDesc: "Name (Z-A)",
      },
    },
    navigation: {
        dashboard: "Dashboard",
        myList: "Meine Liste",
        discover: "Entdecken",
        groups: "Gruppen",
    },
    form: {
      addNewButton: 'Neuen Eintrag hinzufügen',
      editTitle: 'Eintrag bearbeiten',
      button: {
        scanBarcode: "Barcode scannen",
        scanNew: "Produkt scannen",
        takePhoto: "Foto machen",
        upload: "Hochladen",
        dictate: "Diktieren",
        scanIngredients: "Zutaten scannen",
        findNearby: {
            aria: "Restaurants in der Nähe finden"
        },
        cancel: 'Abbrechen',
        save: 'Eintrag speichern',
        update: 'Aktualisieren',
      },
      placeholder: {
        name: 'Produktname (z.B. "Bio Hafermilch")',
        dishName: 'Gerichtsname (z.B. "Pizza Margherita")',
        restaurant: "Restaurantname",
        selectRestaurant: "Oder wähle einen Vorschlag...",
        cuisine: "Küchenart (z.B. 'Italienisch')",
        price: "Preis",
        notes: 'Deine Notizen, Erinnerungen oder warum es dir geschmeckt/nicht geschmeckt hat...',
        tags: 'Tags, durch Kommas getrennt (z.B. "Snack, süß, vegan")',
        purchaseLocation: 'Gekauft bei (z.B. "Lidl")',
      },
      label: {
        rating: 'Bewertung',
        nutriScore: 'Nutri-Score',
        selectRestaurant: 'Vorschläge in der Nähe:',
      },
      image: {
        removeAria: 'Bild entfernen',
      },
      error: {
        nameAndRating: 'Bitte gib einen Namen und eine Bewertung (mindestens ein Stern) an.',
        genericAiError: "Bild konnte nicht mit KI analysiert werden. Bitte versuche es erneut oder gib die Details manuell ein.",
        ingredientsAiError: "Zutatenliste konnte nicht mit KI analysiert werden.",
        barcodeError: "Produktdaten für diesen Barcode konnten nicht gefunden werden.",
        offSearchDisabled: "Lebensmittel-Datenbanksuche ist in den Einstellungen deaktiviert.",
        geolocationUnsupported: "Standortbestimmung wird von deinem Browser nicht unterstützt.",
        geolocationPermission: "Standort konnte nicht abgerufen werden. Bitte Standortfreigabe aktivieren.",
        findRestaurants: "Konnten keine Restaurants in der Nähe finden.",
      },
      aiProgress: {
        readingName: "Lese Produktnamen...",
        findingScore: "Suche nach Nutri-Score...",
        generatingTags: "Generiere Smart-Tags...",
        searchingDatabase: "Prüfe Lebensmittel-Datenbank...",
        locatingProduct: "Lokalisiere Produkt im Bild...",
        complete: "Analyse abgeschlossen!",
      },
      findRestaurants: {
          loading: "Rufe deinen Standort ab, um Restaurants zu finden..."
      },
      ingredients: {
        title: "Zutaten & Ernährungsinfos",
        loading: "Analysiere Zutaten...",
        ingredientsList: "Zutaten",
        placeholder: "Keine Zutatendaten. Scanne die Zutatenliste mit dem Button oben.",
      },
      dietary: {
        title: "Ernährungseigenschaften",
        lactoseFree: "Laktosefrei",
        vegan: "Vegan",
        glutenFree: "Glutenfrei",
      },
      allergens: {
        title: "Erkannte Allergene",
      },
      aria: {
        rate: 'Bewerte {{star}} Stern',
        ratePlural: 'Bewerte {{star}} Sterne',
        selectNutriScore: "Wähle Nutri-Score {{score}}",
      },
       share: {
        title: "Teilen",
        private: "Privat",
        privateDesc: "Nur du kannst diesen Eintrag sehen.",
        community: "Community",
        communityDesc: "Für alle im Entdecken-Tab sichtbar.",
        group: "Mit einer Gruppe teilen",
        groupDesc: "Nur für Mitglieder der gewählten Gruppe sichtbar.",
        selectGroup: "Wähle eine Gruppe..."
      }
    },
    list: {
      empty: {
        title: "Deine Liste ist leer",
        description: "Füge einen neuen Eintrag hinzu, um deine Essenserinnerungen zu speichern.",
      },
      filteredEmpty: {
        title: "Keine passenden Einträge",
        description: "Versuche, deine Such- oder Filtereinstellungen anzupassen.",
        resetButton: "Filter zurücksetzen"
      }
    },
    dashboard: {
        welcome: "Was hast du heute probiert?",
        recentlyAdded: "Kürzlich hinzugefügt",
        topRated: "Deine Favoriten",
        viewAll: "Alle ansehen",
        empty: {
            title: "Willkommen beim Food Tracker!",
            description: "Führe ein Tagebuch über alles, was du isst und trinkst. Vergiss nie wieder einen Favoriten."
        }
    },
    discover: {
        title: "Entdecken",
        loading: "Lade Community-Beiträge...",
        empty: {
            title: "Noch nichts zu entdecken",
            description: "Sei der Erste, der einen Eintrag mit der Community teilt!"
        }
    },
    groups: {
        title: "Meine Gruppen",
        newListPlaceholder: "Name der neuen Gruppe...",
        createButton: "Erstellen",
        empty: "Du bist noch in keiner Gruppe. Erstelle eine, um loszulegen!",
        members: "{{count}} Mitglied",
        members_plural: "{{count}} Mitglieder"
    },
    settings: {
      title: "Einstellungen",
      closeAria: "Einstellungen schließen",
      language: {
        title: "Sprache",
      },
      theme: {
        title: "Design",
        light: "Hell",
        dark: "Dunkel",
        system: "System",
      },
      ai: {
        title: "KI-Funktionen (Gemini)",
        description: "Aktiviere Bildanalyse, intelligente Suche und automatische Übersetzungen.",
      },
      barcodeScanner: {
        title: "Barcode-Scanner",
        description: "Aktiviere den Barcode-Scanner für eine schnelle Produkteingabe.",
      },
      offSearch: {
          title: "Lebensmittel-Datenbanksuche",
          description: "Nutze die Open Food Facts-Datenbank, um Produktdaten von Barcodes oder Namenssuchen zu ergänzen."
      },
      session: {
        title: "Sitzung",
        loggedInAs: "Angemeldet als:",
        logout: "Abmelden",
      },
      button: {
        done: "Fertig",
      },
      apiKeyTest: {
        placeholder: "Gib hier deinen Gemini API-Schlüssel ein",
        button: "Testen & Speichern",
        status: {
            testing: "Schlüssel wird getestet...",
            success: "API-Schlüssel ist gültig und wurde gespeichert!",
            error: {
                invalidKey: {
                    start: "Dieser API-Schlüssel ist ungültig. Bitte ",
                    linkText: "hole dir einen gültigen Schlüssel vom Google AI Studio",
                    end: " und versuche es erneut."
                },
                generic: "Test fehlgeschlagen: {{message}}"
            }
        }
      }
    },
    camera: {
      title: "Foto aufnehmen",
      error: {
        permission: "Kamerazugriff wurde verweigert. Bitte aktiviere ihn in deinen Browsereinstellungen.",
        default: "Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.",
      },
      captureButton: "Aufnehmen",
    },
    barcodeScanner: {
        title: "Barcode scannen",
        description: "Zentriere den Barcode des Produkts im Rahmen.",
        error: {
            permission: "Kamerazugriff wird für den Barcode-Scanner benötigt."
        }
    },
    speechModal: {
        title: "Produktnamen diktieren",
        description: "Sprich einfach los und der Name erscheint unten.",
        listening: "Höre zu...",
    },
    cropper: {
      title: "Bild zuschneiden",
      description: "Passe die Auswahl an, um das Produkt zu fokussieren.",
      button: {
        cancel: "Abbrechen",
        confirm: "Bestätigen",
      },
    },
    card: {
      productTooltip: "Produkt",
      dishTooltip: "Gericht",
      publicTooltip: "Öffentlich",
      privateTooltip: "Privat",
      groupTooltip: "Mit Gruppe geteilt",
      lactoseFreeTooltip: "Laktosefrei",
      veganTooltip: "Vegan",
      glutenFreeTooltip: "Glutenfrei",
      editAria: "{{name}} bearbeiten",
      deleteAria: "{{name}} löschen",
      shareAria: "{{name}} teilen",
      dishAt: "bei {{restaurant}}",
    },
    share: {
        title: "'{{name}}' teilen",
        text: "Ich habe '{{name}}' mit {{rating}}/5 Sternen in meinem Food Memory Tracker bewertet!",
        text_unrated: "Schau dir '{{name}}' in meinem Food Memory Tracker an!",
    },
    allergen: {
        gluten: "Enthält Gluten",
        dairy: "Enthält Milchprodukte",
        peanuts: "Enthält Erdnüsse",
        tree_nuts: "Enthält Schalenfrüchte",
        soy: "Enthält Soja",
        eggs: "Enthält Eier",
        fish: "Enthält Fisch",
        shellfish: "Enthält Schalentiere",
    },
    filterPanel: {
        title: "Filtern & Sortieren",
        aiSearchTitle: "KI Smart-Suche",
        search: "Suche nach Name / Notizen",
        filterByType: "Nach Typ filtern",
        filterByRating: "Nach Bewertung filtern",
        sortBy: "Sortieren nach",
        reset: "Zurücksetzen",
        apply: "Anwenden"
    },
    conversationalSearch: {
        placeholder: "z.B. 'Snacks, die ich mochte und die vegan waren'",
        buttonAria: "KI-Suche durchführen",
        tooltip: "Unterstützt durch Gemini"
    },
    modal: {
        image: {
            closeAria: "Vergrößertes Bild schließen"
        },
        shared: {
            close: "Schließen"
        },
        duplicate: {
          title: "Doppelter Eintrag?",
          description: "Du hast bereits einen Eintrag mit einem ähnlichen Namen ('{{itemName}}') gespeichert. Möchtest du diesen neuen trotzdem hinzufügen?",
          button: {
            goBack: "Zurück & Bearbeiten",
            addAnyway: "Trotzdem hinzufügen"
          }
        }
    },
    detail: {
        notesTitle: "Notizen",
        tagsTitle: "Tags",
        dietaryTitle: "Ernährungseigenschaften",
        allergensTitle: "Allergene",
        ingredientsTitle: "Zutaten",
        status: "Status",
        statusPublic: "Öffentlich",
        statusPrivate: "Privat",
        commentsTitle: "Kommentare",
        noComments: "Sei der Erste, der einen Kommentar schreibt.",
        addCommentPlaceholder: "Einen Kommentar hinzufügen...",
        sendComment: "Senden"
    },
    shoppingList: {
        title: "Einkaufsliste",
        uncategorized: "Unkategorisiert",
        empty: "Diese Liste ist leer. Füge Artikel aus deiner Sammlung hinzu!",
        clear: "Abgehakte Artikel entfernen",
        removeAria: "{{name}} von der Liste entfernen",
        toggleDetailsAria: "Details umschalten",
        collaboration: {
            members: "Mitglieder",
            you: "Du",
            someone: "Jemand",
            addedBy: "Von {{name}} hinzugefügt",
            checkedBy: "Von {{name}} abgehakt",
        },
        share: {
            inviteButton: "Mitglieder einladen",
            linkCopied: "Einladungslink kopiert!",
            copyFailed: "Link konnte nicht kopiert werden."
        },
        manage: {
            buttonTitle: "Liste verwalten",
        },
        delete: {
            button: "Liste löschen",
            confirm: "Bist du sicher, dass du die Liste '{{listName}}' löschen möchtest? Dies kann nicht rückgängig gemacht werden."
        },
        leave: {
            button: "Liste verlassen",
            confirm: "Bist du sicher, dass du die Liste '{{listName}}' verlassen möchtest?"
        },
        tab: {
            checklist: "Checkliste",
            feed: "Gruppen-Feed"
        },
        feed: {
            empty: "Noch hat niemand etwas mit dieser Gruppe geteilt."
        }
    },
    group: {
        addAria: "{{name}} zu einer Einkaufsliste hinzufügen"
    },
    offline: {
        message: "Du bist derzeit offline. Einige Funktionen sind möglicherweise eingeschränkt."
    },
    apiKeyBanner: {
      text: "Schalte KI-Funktionen frei, indem du deinen Gemini API-Schlüssel hinzufügst.",
      button: "Schlüssel hinzufügen"
    },
    apiKeyModal: {
        title: "KI-Funktionen aktivieren",
        description: "Um Funktionen wie Bildanalyse und intelligente Suche zu nutzen, benötigst du einen Google Gemini API-Schlüssel. Er ist kostenlos und einfach zu bekommen.",
        button: {
            testAndSave: "Schlüssel testen & speichern"
        },
        link: {
            whereToGet: "Hole dir deinen API-Schlüssel vom Google AI Studio"
        }
    }
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number | undefined }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// FIX: Fixed the translate function to correctly handle pluralization rules.
// The new implementation uses Intl.PluralRules to determine the correct plural
// category ('one' or 'other') for a given count and then constructs the
// appropriate key (e.g., "key_plural") to look up in the translation JSON.
// This ensures grammatically correct translations for dynamic counts.
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'de') {
      return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de') return 'de';
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key: string, options?: { [key: string]: string | number | undefined }) => {
    const langTranslations = translations[language] || translations.en;
    let translationKey = key;

    if (options && typeof options.count === 'number') {
        const pluralRules = new Intl.PluralRules(language);
        const pluralCategory = pluralRules.select(options.count);
        if (pluralCategory !== 'one') {
            const pluralKey = `${key}_plural`;
            const pluralTranslation = key.split('.').reduce((obj, keyPart, index, arr) => {
                if (index === arr.length - 1) {
                    return obj && obj[pluralKey];
                }
                return obj && obj[keyPart];
            }, langTranslations);
            if (pluralTranslation) {
                translationKey = pluralKey;
            }
        }
    }

    let translation = translationKey.split('.').reduce((obj, keyPart) => obj && obj[keyPart], langTranslations);
    
    if (!translation) {
      translation = key.split('.').reduce((obj, keyPart) => obj && obj[keyPart], translations.en);
    }
    
    if (typeof translation !== 'string') {
      return key;
    }

    let result = translation;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        const value = options[optionKey];
        if (value !== undefined) {
          result = result.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(value));
        }
      });
    }

    return result;
  }, [language]);


  const value = { language, setLanguage, t };

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
};