
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' | 'error' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'success':
                navigator.vibrate([10, 30, 10]);
                break;
            case 'warning':
                navigator.vibrate(50);
                break;
            case 'error':
                navigator.vibrate([50, 50, 50, 50]);
                break;
        }
    }
};
