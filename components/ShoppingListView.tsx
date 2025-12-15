
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
  // We reuse the internal logic of the modal but render it without the overlay backdrop
  // Since ShoppingListModal has its own internal state (expanded items, shopping mode),
  // we can just render it. 
  // However, the original modal has a fixed position overlay. 
  // Ideally, we would refactor ShoppingListModal to be a 'dumb' content component + a 'smart' wrapper.
  // For this prompt's constraints, let's wrap it in a div that overrides the fixed positioning 
  // if possible, OR (cleaner) we modify ShoppingListModal to accept a 'mode' prop.
  
  // Actually, looking at ShoppingListModal.tsx, it has a fixed overlay at the root.
  // We should modify ShoppingListModal.tsx to be flexible.
  // But since I cannot modify ShoppingListModal in this specific file change block (it's a new file),
  // I will re-implement the view here by composing the inner parts, OR (easier for now):
  // Render the Modal but hack the styles? No.
  
  // Best approach: Use the existing Modal component but pass a prop to disable the overlay behavior.
  // Since I can't change the Modal's props in *this* file operation (I'm creating a new file),
  // I will assume I can edit ShoppingListModal.tsx in a separate change block (which I will).
  
  return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 pb-24">
          <ShoppingListModal 
            {...props} 
            onClose={() => {}} // No-op for view mode
            // We will add a prop 'isPageMode' to ShoppingListModal next
            // @ts-ignore
            isPageMode={true} 
          />
      </div>
  );
};
