import React from 'react';
import { ShoppingListModal } from './ShoppingListModal';
import { ShoppingList, UserProfile, Household } from '../types';
import { User } from '@supabase/supabase-js';
import { HydratedShoppingListItem } from '../App';

// Reuse types from Modal for now
interface ShoppingListViewProps {
  allLists: ShoppingList[];
  activeListId: string | null;
  listData: HydratedShoppingListItem[];
  household: Household | null;
  householdMembers: UserProfile[];
  currentUser: User | null;
  onRemove: (shoppingListItemId: string) => void;
  onClear: () => void;
  onToggleChecked: (shoppingListItemId: string, isChecked: boolean) => void;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateQuantity: (shoppingListItemId: string, newQuantity: number) => void;
  onSmartAdd: (input: string) => Promise<void>;
  isSmartAddLoading: boolean;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = (props) => {
  return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 pb-24">
          <ShoppingListModal 
            {...props} 
            onClose={() => {}} // No-op for view mode
            isPageMode={true} 
          />
      </div>
  );
};