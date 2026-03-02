
import { useFoodFormState, UseFoodFormStateProps } from './foodForm/useFoodFormState';
import { useFoodFormHandlers } from './foodForm/useFoodFormHandlers';
import { useFoodFormScanner } from './foodForm/useFoodFormScanner';
import { useFoodFormSubmit } from './foodForm/useFoodFormSubmit';
import { FoodItem } from '../types';

interface UseFoodFormLogicProps extends UseFoodFormStateProps {
  onSaveItem: (item: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) => void;
  onCancel: () => void;
}

export const useFoodFormLogic = ({ initialData, initialItemType = 'product', onSaveItem, startMode = 'none' }: UseFoodFormLogicProps) => {
  const state = useFoodFormState({ initialData, initialItemType, startMode });
  
  const handlers = useFoodFormHandlers(state);
  const scanner = useFoodFormScanner(state, handlers.handleFindNearby);
  const submit = useFoodFormSubmit(state, onSaveItem);

  return {
    formState: state.formState,
    formSetters: state.formSetters,
    uiState: state.uiState,
    uiSetters: state.uiSetters,
    actions: {
      ...handlers,
      ...scanner,
      ...submit
    },
    fileInputRef: state.fileInputRef
  };
};
