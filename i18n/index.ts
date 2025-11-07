import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

type Language = 'en' | 'de';

const translations = {
  en: {
    header: {
      title: 'Food Memories',
      shoppingListAria: 'Open Shopping List',
      searchPlaceholder: 'Search by name, tag, notes...',
      filter: {
        button: 'Filters & Sort',
        all: 'All',
        liked: 'Liked (4+ Stars)',
        disliked: 'Disliked (1-2 Stars)',
        type: {
          all: 'All Types',
          products: 'Products',
          dishes: 'Dishes',
        },
        active: {
          search: `Search: "{term}"`,
          aiSearch: `AI Search: "{term}"`,
          type: {
            product: 'Type: Product',
            dish: 'Type: Dish',
          },
          rating: {
            liked: 'Rating: Liked',
            disliked: 'Rating: Disliked',
          },
        },
        clearAll: 'Clear All Filters',
      },
      sort: {
        dateDesc: 'Date (Newest)',
        dateAsc: 'Date (Oldest)',
        ratingDesc: 'Rating (High to Low)',
        ratingAsc: 'Rating (Low to High)',
        nameAsc: 'Name (A-Z)',
        nameDesc: 'Name (Z-A)',
      },
    },
    footer: {
      text: 'Track your favorite foods and never forget a great meal.',
    },
    nav: {
      myItems: 'My Items',
      family: 'Family',
    },
    form: {
      editTitle: 'Edit Item',
      addNewButton: 'Add New Item',
      error: {
        nameAndRating: 'Please provide a name and a rating.',
        geolocationUnsupported: 'Geolocation is not supported by your browser.',
        findRestaurants: 'Could not find nearby restaurants.',
        geolocationPermission: 'Permission to access location was denied.',
        offSearchDisabled: 'Open Food Facts search is disabled in settings.',
        barcodeError: 'Could not find product for this barcode.',
        genericAiError: 'Could not analyze image with AI.',
        ingredientsAiError: 'Could not analyze ingredients with AI.',
      },
      button: {
        scanBarcode: 'Scan Barcode',
        scanNew: 'Scan Product',
        takePhoto: 'Take Photo',
        upload: 'Upload',
        dictate: 'Dictate Name',
        findNearby: {
          aria: 'Find nearby restaurants',
        },
        scanIngredients: 'Scan Ingredients',
        cancel: 'Cancel',
        update: 'Update Item',
        save: 'Save Item',
      },
      image: {
        removeAria: 'Remove image',
      },
      placeholder: {
        name: 'Product Name (e.g., Organic Whole Milk)',
        dishName: 'Dish Name (e.g., Margherita Pizza)',
        restaurant: 'Restaurant Name',
        selectRestaurant: '--- Select a suggestion ---',
        cuisine: 'Cuisine (e.g., Italian)',
        price: 'Price',
        notes: 'Your notes, memories, or pairing ideas...',
        tags: 'Tags (comma-separated, e.g., snack, sweet, treat)',
        purchaseLocation: 'Purchase Location (e.g., Whole Foods)',
      },
      label: {
        rating: 'Rating:',
        nutriScore: 'Nutri-Score:',
        selectRestaurant: 'Suggestions:',
      },
      aria: {
        rate: 'Rate {star} star',
        ratePlural: 'Rate {star} stars',
        selectNutriScore: 'Select Nutri-Score {score}',
      },
      findRestaurants: {
        loading: 'Finding restaurants near you...',
      },
      aiProgress: {
        readingName: 'Reading product name...',
        findingScore: 'Looking for Nutri-Score...',
        generatingTags: 'Generating smart tags...',
        searchingDatabase: 'Checking food database...',
        locatingProduct: 'Locating product in image...',
        complete: 'Analysis complete!',
      },
      ingredients: {
        title: 'Ingredients & Dietary',
        loading: 'Analyzing ingredients...',
        ingredientsList: 'Ingredients',
        placeholder: 'Scan the ingredients list from the product image to populate.',
      },
      dietary: {
        title: 'Dietary Info',
        lactoseFree: 'Lactose-Free',
        vegan: 'Vegan',
        glutenFree: 'Gluten-Free',
      },
      allergens: {
        title: 'Allergens',
      },
      familyFavorite: {
        title: 'Family Favorite',
        description: 'Visible to everyone in your household.',
      },
    },
    card: {
      lactoseFreeTooltip: 'Lactose-Free',
      veganTooltip: 'Vegan',
      glutenFreeTooltip: 'Gluten-Free',
      dishTooltip: 'Dish',
      productTooltip: 'Product',
      familyFavoriteTooltip: 'Family Favorite',
      privateTooltip: 'Private Item',
      editAria: 'Edit {name}',
      deleteAria: 'Delete {name}',
      dishAt: 'at {restaurant}',
    },
    list: {
      empty: {
        title: 'No Items Found',
        description: 'Try adjusting your filters or adding a new item.',
      },
    },
    shoppingList: {
      title: 'Shopping List',
      defaultListName: 'Groceries',
      joinSuccess: 'Successfully joined household: {householdName}!',
      addedToast: 'Added {name} to shopping list.',
      addedAnotherToast: 'Added another {name} to the list.',
      addAria: 'Add {name} to shopping list',
      empty: 'Your shopping list is empty.',
      clearCompleted: 'Clear Completed',
      addedBy: 'Added by',
      checkedBy: 'Checked by',
      you: 'You',
      newItemPlaceholder: 'Add new item...',
      createListPlaceholder: 'New list name...',
      createList: 'Create',
      deleteListConfirm: 'Are you sure you want to delete the list "{listName}"?',
    },
    offline: {
      message: "You are currently offline. Some features may be limited.",
      syncComplete: 'Offline changes have been synced!',
    },
    conversationalSearch: {
      error: 'AI search failed. Please try a different query.',
      resultsTitle: 'AI Search Results',
      clear: 'Clear',
      placeholder: 'Ask about your food... "what was that spicy dish?"',
      buttonAria: 'Perform AI search',
      tooltip: 'Use AI to search your items',
    },
    modal: {
      itemType: {
        title: 'What are you adding?',
        product: 'Product',
        dish: 'Dish',
      },
      shared: {
        title: 'Shared Item',
        description: 'Someone shared a food item with you. Would you like to add it to your list?',
        summaryNotice: 'Note: Ingredients and allergens are AI-generated summaries and may not be complete.',
        close: 'Close',
        addToList: 'Add to My Items',
      },
      image: {
        closeAria: 'Close image viewer',
      },
      duplicate: {
        title: 'Duplicate Item?',
        description: 'You already have items named "{itemName}". Do you still want to add this one?',
        button: {
          goBack: 'Go Back & Edit',
          addAnyway: 'Add Anyway',
        },
      },
    },
    camera: {
      error: {
        permission: 'Camera access was denied. Please enable it in your browser settings.',
        generic: 'Could not access the camera.',
      },
      title: 'Scan Product',
      captureButton: 'Capture',
    },
    cropper: {
      title: 'Crop Image',
      description: 'Drag to adjust the crop for the best thumbnail.',
      button: {
        cancel: 'Cancel',
        confirm: 'Confirm Crop',
      },
    },
    settings: {
      title: 'Settings',
      closeAria: 'Close settings',
      household: {
        title: 'Household',
        manage: {
          invite: 'Copy Invite Link',
          linkCopied: 'Link Copied!',
          leave: 'Leave Household',
          leaveConfirm: 'Are you sure you want to leave this household?',
          deleteConfirm: 'Are you sure you want to permanently delete this household for everyone? This cannot be undone.',
        },
        create: {
          placeholder: 'Your household name...',
          button: 'Create',
        },
        join: {
          description: 'Or join a household using an invite link.',
        },
      },
      language: {
        title: 'Language',
      },
      theme: {
        title: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      offSearch: {
        title: 'Food Database Search',
        description: 'Enhance AI scans with data from the Open Food Facts database.',
      },
      barcodeScanner: {
        title: 'Barcode Scanner',
        description: 'Enable barcode scanning to quickly add products.',
      },
      ai: {
        title: 'AI-Powered Features',
        description: 'Enable image analysis and smart search (requires a Gemini API key).',
      },
      apiKeyTest: {
        status: {
            testing: 'Verifying key...',
            success: 'API Key is valid and working!',
            error: {
                invalidKey: {
                    start: 'API key is not valid. Please get a new key from ',
                    linkText: 'Google AI Studio',
                    end: ' and try again.',
                },
                generic: 'Test failed: {message}',
            },
        },
        placeholder: 'Enter your Google Gemini API Key',
        button: 'Test & Save Key',
      },
      session: {
        title: 'Session',
        loggedInAs: 'Logged in as',
        logout: 'Log Out',
      },
      button: {
        done: 'Done',
      },
    },
    apiKeyModal: {
        title: 'Welcome to Food Memories',
        description: 'To enable AI features like image analysis and smart search, please provide your Google Gemini API key. This key is stored securely in your browser.',
        button: {
            testAndSave: 'Test & Save Key',
        },
        link: {
            whereToGet: "Don't have a key? Get one from Google AI Studio.",
        },
    },
    allergen: {
        gluten: 'Contains Gluten',
        dairy: 'Contains Dairy',
        peanuts: 'Contains Peanuts',
        tree_nuts: 'Contains Tree Nuts',
        soy: 'Contains Soy',
        eggs: 'Contains Eggs',
        fish: 'Contains Fish',
        shellfish: 'Contains Shellfish',
    },
    barcodeScanner: {
        error: {
            permission: 'Camera access is required for barcode scanning.',
        },
        title: 'Scan Barcode',
        description: 'Center the barcode in the frame.',
    },
    apiKeyBanner: {
        text: 'AI features are disabled. Please set your Gemini API key to enable them.',
        button: 'Open Settings',
    },
    detail: {
        notesTitle: 'Notes & Memories',
        tagsTitle: 'Tags',
        dietaryTitle: 'Dietary Information',
        allergensTitle: 'Potential Allergens',
        ingredientsTitle: 'Ingredients',
        status: 'Status',
        statusFamilyFavorite: 'Family Favorite',
        statusPrivate: 'Private',
    },
    speechModal: {
        title: 'Dictate Name',
        description: 'Speak the name of the food item clearly.',
        listening: 'Listening...',
    },
    dashboard: {
        empty: {
            title: 'Welcome!',
            description: "You haven't saved any food memories yet. Let's add your first one!",
        },
        welcome: 'Welcome Back!',
        recentlyAdded: 'Recently Added',
        viewAll: 'View All',
        topRated: 'Your Top Rated',
    },
    filterPanel: {
        title: 'Filter & Sort',
        aiSearchTitle: 'Smart Search (AI)',
        search: 'Search by Keyword',
        filterByType: 'Filter by Type',
        filterByRating: 'Filter by Rating',
        sortBy: 'Sort By',
        reset: 'Reset',
        apply: 'Apply Filters',
    },
    auth: {
        magicLinkSuccess: 'Check your email for the login link!',
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Password',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        toggle: {
            signIn: 'Already have an account? Sign In',
            signUp: "Don't have an account? Sign Up",
        },
    },
    discover: {
        loading: 'Loading community favorites...',
        title: 'Discover',
        empty: {
            title: 'Nothing to discover yet.',
            description: 'Check back later to see what others are sharing.',
        },
    },
    family: {
        loading: "Loading your household's favorites...",
        noHousehold: {
            title: 'No Household Found',
            description: 'Create a household in Settings to share items with family.',
        },
    },
    household: {
        error: {
            rls: {
                insert: 'You may already be a member of a household. Please leave your current one before creating a new one.'
            },
            generic: 'Could not create household: {message}'
        }
    }
  },
  de: {
    header: {
        title: 'Essenserinnerungen',
        shoppingListAria: 'Einkaufsliste öffnen',
        searchPlaceholder: 'Suche nach Name, Tag, Notizen...',
        filter: {
          button: 'Filter & Sortierung',
          all: 'Alle',
          liked: 'Favoriten (4+ Sterne)',
          disliked: 'Nicht gemocht (1-2 Sterne)',
          type: {
            all: 'Alle Arten',
            products: 'Produkte',
            dishes: 'Gerichte',
          },
          active: {
            search: `Suche: "{term}"`,
            aiSearch: `KI-Suche: "{term}"`,
            type: {
              product: 'Typ: Produkt',
              dish: 'Typ: Gericht',
            },
            rating: {
              liked: 'Bewertung: Favoriten',
              disliked: 'Bewertung: Nicht gemocht',
            },
          },
          clearAll: 'Alle Filter löschen',
        },
        sort: {
            dateDesc: 'Datum (Neueste)',
            dateAsc: 'Datum (Älteste)',
            ratingDesc: 'Bewertung (Hoch > Niedrig)',
            ratingAsc: 'Bewertung (Niedrig > Hoch)',
            nameAsc: 'Name (A-Z)',
            nameDesc: 'Name (Z-A)',
        },
    },
    footer: {
        text: 'Verfolge deine Lieblingsspeisen und vergiss nie wieder ein tolles Gericht.',
    },
    nav: {
        myItems: 'Meine Einträge',
        family: 'Familie',
    },
    form: {
        editTitle: 'Eintrag bearbeiten',
        addNewButton: 'Neuen Eintrag hinzufügen',
        error: {
            nameAndRating: 'Bitte gib einen Namen und eine Bewertung an.',
            geolocationUnsupported: 'Geolokalisierung wird von Ihrem Browser nicht unterstützt.',
            findRestaurants: 'Konnten keine Restaurants in der Nähe finden.',
            geolocationPermission: 'Die Erlaubnis zum Zugriff auf den Standort wurde verweigert.',
            offSearchDisabled: 'Open Food Facts-Suche ist in den Einstellungen deaktiviert.',
            barcodeError: 'Konnte kein Produkt für diesen Barcode finden.',
            genericAiError: 'Bild konnte nicht mit KI analysiert werden.',
            ingredientsAiError: 'Zutatenliste konnte nicht mit KI analysiert werden.',
        },
        button: {
            scanBarcode: 'Barcode scannen',
            scanNew: 'Produkt scannen',
            takePhoto: 'Foto aufnehmen',
            upload: 'Hochladen',
            dictate: 'Namen diktieren',
            findNearby: {
                aria: 'Restaurants in der Nähe finden',
            },
            scanIngredients: 'Zutaten scannen',
            cancel: 'Abbrechen',
            update: 'Eintrag aktualisieren',
            save: 'Eintrag speichern',
        },
        image: {
            removeAria: 'Bild entfernen',
        },
        placeholder: {
            name: 'Produktname (z.B. Bio-Vollmilch)',
            dishName: 'Gerichtsname (z.B. Pizza Margherita)',
            restaurant: 'Restaurantname',
            selectRestaurant: '--- Vorschlag auswählen ---',
            cuisine: 'Küche (z.B. Italienisch)',
            price: 'Preis',
            notes: 'Deine Notizen, Erinnerungen oder Ideen...',
            tags: 'Tags (kommagetrennt, z.B. Snack, süß)',
            purchaseLocation: 'Einkaufsort (z.B. Edeka)',
        },
        label: {
            rating: 'Bewertung:',
            nutriScore: 'Nutri-Score:',
            selectRestaurant: 'Vorschläge:',
        },
        aria: {
            rate: 'Bewerte mit {star} Stern',
            ratePlural: 'Bewerte mit {star} Sternen',
            selectNutriScore: 'Wähle Nutri-Score {score}',
        },
        findRestaurants: {
            loading: 'Suche Restaurants in deiner Nähe...',
        },
        aiProgress: {
            readingName: 'Lese Produktnamen...',
            findingScore: 'Suche nach Nutri-Score...',
            generatingTags: 'Erstelle Smart-Tags...',
            searchingDatabase: 'Prüfe Lebensmitteldatenbank...',
            locatingProduct: 'Lokalisiere Produkt im Bild...',
            complete: 'Analyse abgeschlossen!',
        },
        ingredients: {
            title: 'Zutaten & Ernährung',
            loading: 'Analysiere Zutaten...',
            ingredientsList: 'Zutaten',
            placeholder: 'Scanne die Zutatenliste vom Produktbild, um sie auszufüllen.',
        },
        dietary: {
            title: 'Ernährungsinfos',
            lactoseFree: 'Laktosefrei',
            vegan: 'Vegan',
            glutenFree: 'Glutenfrei',
        },
        allergens: {
            title: 'Allergene',
        },
        familyFavorite: {
            title: 'Familienfavorit',
            description: 'Für alle in deinem Haushalt sichtbar.',
        },
    },
    card: {
        lactoseFreeTooltip: 'Laktosefrei',
        veganTooltip: 'Vegan',
        glutenFreeTooltip: 'Glutenfrei',
        dishTooltip: 'Gericht',
        productTooltip: 'Produkt',
        familyFavoriteTooltip: 'Familienfavorit',
        privateTooltip: 'Privater Eintrag',
        editAria: '{name} bearbeiten',
        deleteAria: '{name} löschen',
        dishAt: 'bei {restaurant}',
    },
    list: {
        empty: {
            title: 'Keine Einträge gefunden',
            description: 'Versuche, deine Filter anzupassen oder einen neuen Eintrag hinzuzufügen.',
        },
    },
    shoppingList: {
        title: 'Einkaufsliste',
        defaultListName: 'Einkäufe',
        joinSuccess: 'Erfolgreich dem Haushalt beigetreten: {householdName}!',
        addedToast: '{name} zur Einkaufsliste hinzugefügt.',
        addedAnotherToast: 'Noch ein(e) {name} zur Liste hinzugefügt.',
        addAria: '{name} zur Einkaufsliste hinzufügen',
        empty: 'Deine Einkaufsliste ist leer.',
        clearCompleted: 'Erledigte entfernen',
        addedBy: 'Hinzugefügt von',
        checkedBy: 'Abgehakt von',
        you: 'Dir',
        newItemPlaceholder: 'Neuen Artikel hinzufügen...',
        createListPlaceholder: 'Name der neuen Liste...',
        createList: 'Erstellen',
        deleteListConfirm: 'Bist du sicher, dass du die Liste "{listName}" löschen möchtest?',
    },
    offline: {
        message: 'Du bist derzeit offline. Einige Funktionen sind möglicherweise eingeschränkt.',
        syncComplete: 'Offline-Änderungen wurden synchronisiert!',
    },
    conversationalSearch: {
        error: 'KI-Suche fehlgeschlagen. Bitte versuche eine andere Anfrage.',
        resultsTitle: 'KI-Suchergebnisse',
        clear: 'Löschen',
        placeholder: 'Frag nach deinem Essen... "was war das scharfe Gericht?"',
        buttonAria: 'KI-Suche durchführen',
        tooltip: 'Nutze KI, um deine Einträge zu durchsuchen',
    },
    modal: {
        itemType: {
            title: 'Was fügst du hinzu?',
            product: 'Produkt',
            dish: 'Gericht',
        },
        shared: {
            title: 'Geteilter Eintrag',
            description: 'Jemand hat einen Eintrag mit dir geteilt. Möchtest du ihn zu deiner Liste hinzufügen?',
            summaryNotice: 'Hinweis: Zutaten und Allergene sind KI-generierte Zusammenfassungen und möglicherweise unvollständig.',
            close: 'Schließen',
            addToList: 'Zu meinen Einträgen',
        },
        image: {
            closeAria: 'Bildansicht schließen',
        },
        duplicate: {
            title: 'Doppelter Eintrag?',
            description: 'Du hast bereits Einträge mit dem Namen "{itemName}". Möchtest du diesen trotzdem hinzufügen?',
            button: {
                goBack: 'Zurück & Bearbeiten',
                addAnyway: 'Trotzdem hinzufügen',
            },
        },
    },
    camera: {
        error: {
            permission: 'Kamerazugriff wurde verweigert. Bitte in den Browsereinstellungen aktivieren.',
            generic: 'Konnte nicht auf die Kamera zugreifen.',
        },
        title: 'Produkt scannen',
        captureButton: 'Aufnehmen',
    },
    cropper: {
        title: 'Bild zuschneiden',
        description: 'Passe den Ausschnitt für das beste Vorschaubild an.',
        button: {
            cancel: 'Abbrechen',
            confirm: 'Zuschnitt bestätigen',
        },
    },
    settings: {
        title: 'Einstellungen',
        closeAria: 'Einstellungen schließen',
        household: {
            title: 'Haushalt',
            manage: {
                invite: 'Einladungslink kopieren',
                linkCopied: 'Link kopiert!',
                leave: 'Haushalt verlassen',
                leaveConfirm: 'Bist du sicher, dass du diesen Haushalt verlassen möchtest?',
                deleteConfirm: 'Möchtest du diesen Haushalt wirklich für alle endgültig löschen? Dies kann nicht rückgängig gemacht werden.',
            },
            create: {
                placeholder: 'Name deines Haushalts...',
                button: 'Erstellen',
            },
            join: {
                description: 'Oder trete einem Haushalt mit einem Einladungslink bei.',
            },
        },
        language: {
            title: 'Sprache',
        },
        theme: {
            title: 'Design',
            light: 'Hell',
            dark: 'Dunkel',
            system: 'System',
        },
        offSearch: {
            title: 'Lebensmittel-Db-Suche',
            description: 'Erweitere KI-Scans mit Daten aus der Open Food Facts-Datenbank.',
        },
        barcodeScanner: {
            title: 'Barcode-Scanner',
            description: 'Aktiviere das Scannen von Barcodes, um Produkte schnell hinzuzufügen.',
        },
        ai: {
            title: 'KI-Funktionen',
            description: 'Aktiviere Bildanalyse und intelligente Suche (benötigt einen Gemini API-Schlüssel).',
        },
        apiKeyTest: {
            status: {
                testing: 'Überprüfe Schlüssel...',
                success: 'API-Schlüssel ist gültig und funktioniert!',
                error: {
                    invalidKey: {
                        start: 'API-Schlüssel ist ungültig. Bitte erhalte einen neuen Schlüssel vom ',
                        linkText: 'Google AI Studio',
                        end: ' und versuche es erneut.',
                    },
                    generic: 'Test fehlgeschlagen: {message}',
                },
            },
            placeholder: 'Gib deinen Google Gemini API-Schlüssel ein',
            button: 'Schlüssel testen & speichern',
        },
        session: {
            title: 'Sitzung',
            loggedInAs: 'Angemeldet als',
            logout: 'Abmelden',
        },
        button: {
            done: 'Fertig',
        },
    },
    apiKeyModal: {
        title: 'Willkommen bei Food Memories',
        description: 'Um KI-Funktionen wie Bildanalyse und intelligente Suche zu aktivieren, gib bitte deinen Google Gemini API-Schlüssel an. Dieser wird sicher in deinem Browser gespeichert.',
        button: {
            testAndSave: 'Schlüssel testen & speichern',
        },
        link: {
            whereToGet: 'Keinen Schlüssel? Erhalte einen im Google AI Studio.',
        },
    },
    allergen: {
        gluten: 'Enthält Gluten',
        dairy: 'Enthält Milchprodukte',
        peanuts: 'Enthält Erdnüsse',
        tree_nuts: 'Enthält Schalenfrüchte',
        soy: 'Enthält Soja',
        eggs: 'Enthält Eier',
        fish: 'Enthält Fisch',
        shellfish: 'Enthält Schalentiere',
    },
    barcodeScanner: {
        error: {
            permission: 'Kamerazugriff wird für das Scannen von Barcodes benötigt.',
        },
        title: 'Barcode scannen',
        description: 'Zentriere den Barcode im Rahmen.',
    },
    apiKeyBanner: {
        text: 'KI-Funktionen sind deaktiviert. Bitte lege deinen Gemini API-Schlüssel fest, um sie zu aktivieren.',
        button: 'Einstellungen öffnen',
    },
    detail: {
        notesTitle: 'Notizen & Erinnerungen',
        tagsTitle: 'Tags',
        dietaryTitle: 'Ernährungsinformationen',
        allergensTitle: 'Mögliche Allergene',
        ingredientsTitle: 'Zutaten',
        status: 'Status',
        statusFamilyFavorite: 'Familienfavorit',
        statusPrivate: 'Privat',
    },
    speechModal: {
        title: 'Namen diktieren',
        description: 'Sprich den Namen des Lebensmittels deutlich aus.',
        listening: 'Höre zu...',
    },
    dashboard: {
        empty: {
            title: 'Willkommen!',
            description: 'Du hast noch keine Essenserinnerungen gespeichert. Lass uns deine erste hinzufügen!',
        },
        welcome: 'Willkommen zurück!',
        recentlyAdded: 'Zuletzt hinzugefügt',
        viewAll: 'Alle anzeigen',
        topRated: 'Deine Favoriten',
    },
    filterPanel: {
        title: 'Filtern & Sortieren',
        aiSearchTitle: 'Intelligente Suche (KI)',
        search: 'Stichwortsuche',
        filterByType: 'Nach Typ filtern',
        filterByRating: 'Nach Bewertung filtern',
        sortBy: 'Sortieren nach',
        reset: 'Zurücksetzen',
        apply: 'Filter anwenden',
    },
    auth: {
        magicLinkSuccess: 'Überprüfe deine E-Mails für den Anmelde-Link!',
        emailPlaceholder: 'E-Mail',
        passwordPlaceholder: 'Passwort',
        signUp: 'Registrieren',
        signIn: 'Anmelden',
        toggle: {
            signIn: 'Hast du bereits ein Konto? Anmelden',
            signUp: 'Kein Konto? Registrieren',
        },
    },
    discover: {
        loading: 'Lade Community-Favoriten...',
        title: 'Entdecken',
        empty: {
            title: 'Noch nichts zu entdecken.',
            description: 'Schau später wieder vorbei, um zu sehen, was andere teilen.',
        },
    },
    family: {
        loading: 'Lade die Favoriten deines Haushalts...',
        noHousehold: {
            title: 'Kein Haushalt gefunden',
            description: 'Erstelle einen Haushalt in den Einstellungen, um Einträge mit der Familie zu teilen.',
        },
    },
    household: {
        error: {
            rls: {
                insert: 'Du bist möglicherweise bereits Mitglied eines Haushalts. Bitte verlasse deinen aktuellen, bevor du einen neuen erstellst.'
            },
            generic: 'Haushalt konnte nicht erstellt werden: {message}'
        }
    }
  },
};

// Helper to get a nested property from an object
const get = (obj: any, path: string, defaultValue = '') => {
  const result = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return result || defaultValue;
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang === 'en' || savedLang === 'de') ? savedLang : 'en';
  });
  
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string>) => {
    let translation = get(translations[language], key, key);
    if (replacements) {
      Object.entries(replacements).forEach(([rKey, value]) => {
        translation = translation.replace(`{${rKey}}`, value);
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
