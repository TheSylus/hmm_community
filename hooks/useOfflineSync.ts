
import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { processQueue } from '../services/offlineQueueService';
import { useQueryClient } from '@tanstack/react-query';

export const useOfflineSync = () => {
    const isOnline = useOnlineStatus();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOnline) {
            processQueue().then(() => {
                // Invalidate all queries to ensure UI is in sync with server after processing queue
                queryClient.invalidateQueries();
            });
        }
    }, [isOnline, queryClient]);
};
