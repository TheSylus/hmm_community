
import React, { useState } from 'react';
import { useTranslation } from '../i18n/index';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon, SpinnerIcon, PlusCircleIcon, UserGroupIcon, DocumentTextIcon } from './Icons';
import { Household, UserProfile } from '../types';
import { StoreLogo } from './StoreLogo';

interface SettingsModalProps {
  onClose: () => void;
  household: Household | null;
  householdMembers: UserProfile[];
  onHouseholdCreate: (name: string) => Promise<void>;
  onHouseholdLeave: () => Promise<void>;
  onHouseholdDelete: () => Promise<void>;
  error?: string | null;
}

const HouseholdManager: React.FC<Omit<SettingsModalProps, 'onClose'>> = ({ household, householdMembers, onHouseholdCreate, onHouseholdLeave, onHouseholdDelete, error }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [newHouseholdName, setNewHouseholdName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

    const handleCreate = async () => {
        if (!newHouseholdName.trim()) return;
        setIsCreating(true);
        await onHouseholdCreate(newHouseholdName.trim());
        setIsCreating(false);
        setNewHouseholdName('');
    };

    const handleShareInvite = async () => {
        if (!household) return;
        setShareStatus('copying');
        const inviteUrl = `${window.location.origin}${window.location.pathname}?join_household=${household.id}`;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setShareStatus('copied');
            setTimeout(() => setShareStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy share link:', err);
            alert('Could not copy link.');
            setShareStatus('idle');
        }
    };
    
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').split(' ');
        if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
            return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (household) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('settings.household.title')}: <span className="text-indigo-600 dark:text-indigo-400">{household.name}</span></h3>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono select-all">ID: {household.id}</p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                            <UserGroupIcon className="w-4 h-4" />
                            {t('settings.household.manage.activeMembers')}
                        </h4>
                        <div className="flex flex-col gap-2">
                            {householdMembers.length > 0 ? householdMembers.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 ring-2 ring-white dark:ring-gray-800 shrink-0">
                                        {getInitials(member.display_name)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                        {member.id === user?.id ? `${member.display_name} (${t('shoppingList.collaboration.you')})` : member.display_name}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">Loading members...</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <button onClick={handleShareInvite} disabled={shareStatus !== 'idle'} className="w-full text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                            {shareStatus === 'copied' ? t('settings.household.manage.linkCopied') : t('settings.household.manage.invite')}
                        </button>
                        <button onClick={onHouseholdLeave} className="w-full text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md transition-colors">
                            {t('settings.household.manage.leave')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.household.title')}</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('family.noHousehold.description')}</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                        placeholder={t('settings.household.create.placeholder')}
                        className="flex-grow w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                        disabled={isCreating}
                    />
                    <button onClick={handleCreate} disabled={isCreating || !newHouseholdName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600 flex items-center justify-center">
                        {isCreating ? <SpinnerIcon className="w-5 h-5" /> : t('settings.household.create.button')}
                    </button>
                </div>
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-300 break-words">
                         {error.split('`').map((part, i) => 
                            i % 2 === 1 ? <code key={i} className="block my-1 p-1.5 bg-white dark:bg-black/50 rounded font-mono text-xs border border-red-200 dark:border-red-900 select-all">{part}</code> : <span key={i}>{part}</span>
                         )}
                    </div>
                )}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('settings.household.join.description')}</p>
            </div>
        </div>
    );
};

const StoreManager: React.FC = () => {
    const { t } = useTranslation();
    const { savedShops, addSavedShop, removeSavedShop } = useAppSettings();
    const [newShop, setNewShop] = useState('');

    const handleAdd = () => {
        if(newShop.trim()) {
            addSavedShop(newShop);
            setNewShop('');
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.shops.title')}</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.shops.description')}</p>
                
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newShop}
                        onChange={(e) => setNewShop(e.target.value)}
                        placeholder={t('settings.shops.placeholder')}
                        className="flex-grow w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} disabled={!newShop.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-gray-600">
                        <PlusCircleIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    {savedShops.map(shop => (
                        <div key={shop} className="flex items-center gap-2 bg-white dark:bg-gray-800 pl-2 pr-1 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                            <StoreLogo name={shop} size="sm" />
                            <span className="text-sm font-medium">{shop}</span>
                            <button onClick={() => removeSavedShop(shop)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const DatabaseManager: React.FC = () => {
    const { t } = useTranslation();
    const [showSql, setShowSql] = useState(false);
    
    // Updated SQL to include Receipts tables AND DELETE POLICIES
    const sqlCode = `
-- 1. Updates für bestehende Tabellen
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS unit_quantity numeric;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS unit_type text;

-- 2. Tabelle: Receipts (Belege)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID REFERENCES auth.users NOT NULL,
  household_id UUID REFERENCES households(id),
  merchant_name TEXT NOT NULL,
  date TIMESTAMPTZ,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabelle: Receipt Items (Positionen)
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id),
  raw_name TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 1,
  total_price NUMERIC DEFAULT 0,
  unit_quantity NUMERIC,
  unit_type TEXT
);

-- 4. Sicherheit (RLS) für Receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Verhindert Fehler beim erneuten Ausführen
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can insert their own receipts" ON receipts;
    DROP POLICY IF EXISTS "Users can view their own receipts" ON receipts;
    DROP POLICY IF EXISTS "Users can view household receipts" ON receipts;
    DROP POLICY IF EXISTS "Users can delete their own receipts" ON receipts;
    DROP POLICY IF EXISTS "Users can update their own receipts" ON receipts;
END $$;

CREATE POLICY "Users can insert their own receipts" ON receipts FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can view their own receipts" ON receipts FOR SELECT USING (auth.uid() = uploader_id);
CREATE POLICY "Users can view household receipts" ON receipts FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete their own receipts" ON receipts FOR DELETE USING (auth.uid() = uploader_id);
CREATE POLICY "Users can update their own receipts" ON receipts FOR UPDATE USING (auth.uid() = uploader_id);

-- 5. Sicherheit (RLS) für Receipt Items
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can insert items for their receipts" ON receipt_items;
    DROP POLICY IF EXISTS "Users can view items of visible receipts" ON receipt_items;
    DROP POLICY IF EXISTS "Users can delete items of their receipts" ON receipt_items;
END $$;

CREATE POLICY "Users can insert items for their receipts" ON receipt_items FOR INSERT WITH CHECK (receipt_id IN (SELECT id FROM receipts WHERE uploader_id = auth.uid()));
CREATE POLICY "Users can view items of visible receipts" ON receipt_items FOR SELECT USING (receipt_id IN (SELECT id FROM receipts));
CREATE POLICY "Users can delete items of their receipts" ON receipt_items FOR DELETE USING (receipt_id IN (SELECT id FROM receipts WHERE uploader_id = auth.uid()));
`.trim();

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.troubleshoot.title')}</h3>
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.troubleshoot.description')}</p>
                
                {!showSql ? (
                    <button onClick={() => setShowSql(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
                        <DocumentTextIcon className="w-4 h-4" />
                        {t('settings.troubleshoot.button')}
                    </button>
                ) : (
                    <div className="mt-2">
                        <code className="block p-3 bg-gray-800 text-gray-200 rounded-md font-mono text-[10px] sm:text-xs select-all overflow-x-auto whitespace-pre h-48 overflow-y-auto">
                            {sqlCode}
                        </code>
                        <p className="text-xs text-gray-500 mt-1">{t('settings.troubleshoot.sqlInstructions')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, household, householdMembers, onHouseholdCreate, onHouseholdLeave, onHouseholdDelete, error }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isAiEnabled, setIsAiEnabled, isBarcodeScannerEnabled, setIsBarcodeScannerEnabled, isOffSearchEnabled, setIsOffSearchEnabled } = useAppSettings();
  const { signOut, user } = useAuth();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 id="settings-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
            <HouseholdManager 
                household={household} 
                householdMembers={householdMembers}
                onHouseholdCreate={onHouseholdCreate} 
                onHouseholdLeave={onHouseholdLeave} 
                onHouseholdDelete={onHouseholdDelete} 
                error={error}
            />
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <StoreManager />
            
            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Database Maintenance (For Category/Calories Update) */}
            <DatabaseManager />

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Language Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.language.title')}</h3>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setLanguage('en')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        English
                    </button>
                    <button onClick={() => setLanguage('de')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'de' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        Deutsch
                    </button>
                </div>
            </div>

            {/* Theme Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.theme.title')}</h3>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'light' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.light')}
                    </button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.dark')}
                    </button>
                    <button onClick={() => setTheme('system')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.system')}
                    </button>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            {/* Food Database Search Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.offSearch.title')}</h3>
              <label htmlFor="off-search-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.offSearch.description')}</span>
                <div className="relative">
                  <input
                    id="off-search-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isOffSearchEnabled}
                    onChange={() => setIsOffSearchEnabled(!isOffSearchEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>
            
            {/* Barcode Scanner Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.barcodeScanner.title')}</h3>
              <label htmlFor="barcode-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.barcodeScanner.description')}</span>
                <div className="relative">
                  <input
                    id="barcode-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isBarcodeScannerEnabled}
                    onChange={() => setIsBarcodeScannerEnabled(!isBarcodeScannerEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>

            {/* AI Feature Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.ai.title')}</h3>
              <label htmlFor="ai-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.ai.description')}</span>
                <div className="relative">
                  <input
                    id="ai-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAiEnabled}
                    onChange={() => setIsAiEnabled(!isAiEnabled)}
                  />
                  <div className={`w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600`}></div>
                </div>
              </label>
            </div>

            {user && (
                <>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.session.title')}</h3>
                    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                           {t('settings.session.loggedInAs')} <span className="font-semibold text-gray-800 dark:text-gray-200">{user.email}</span>
                        </p>
                        <button
                            onClick={signOut}
                            className="w-full sm:w-auto flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors text-sm"
                        >
                            {t('settings.session.logout')}
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 text-center border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button 
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
            >
                {t('settings.button.done')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
