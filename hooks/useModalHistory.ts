
import { useEffect } from 'react';

/**
 * Hook to manage browser history for modals/overlays.
 * Pushes a state to history when opened, and calls onClose when the user presses Back.
 */
export const useModalHistory = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (isOpen) {
      // Push a new state to the history stack
      const state = { modalOpen: true, timestamp: Date.now() };
      window.history.pushState(state, '');

      const handlePopState = (event: PopStateEvent) => {
        // Prevent default back behavior if necessary (mostly implied by pushing state)
        // Check if the event was triggered by our pushed state or a real back navigation
        // For simple modals, just closing is usually correct.
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // Clean up: If we closed via UI (not back button), the history state is still there.
        // We generally rely on the user navigating forward again or the "Back" action being consumed.
        // Attempting to go back() programmatically here often causes loops or race conditions.
      };
    }
  }, [isOpen, onClose]);
};
