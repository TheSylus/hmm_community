// --- Service Worker for Offline Functionality ---

// v3: Introducing offline queuing for API mutations.
const APP_SHELL_CACHE_NAME = 'food-memory-tracker-v3-shell'; // For app assets (HTML, JS, CSS)
const DYNAMIC_CACHE_NAME = 'food-memory-tracker-v3-dynamic'; // For API responses (Supabase)

// --- IndexedDB Helpers for Queuing Offline Actions ---
const DB_NAME = 'food-tracker-offline';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

let dbPromise;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true, keyPath: 'id' });
      }
    };
  });
  return dbPromise;
}

async function addToQueue(item) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(item);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getQueue() {
  const db = await openDB();
  return db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
}

async function deleteFromQueue(id) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}
// --- End IndexedDB Helpers ---

self.addEventListener('install', event => {
  console.log('[SW] Install');
  // Pre-caching basic shell is good, but dynamic caching is more robust for assets with hashes.
  // We will cache on the fly in the fetch handler.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  const cacheWhitelist = [APP_SHELL_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http protocols, like chrome-extension://
  if (!url.protocol.startsWith('http')) return;

  // Strategy for Supabase API calls
  if (url.hostname.includes('supabase.co')) {
    if (request.method === 'GET') {
      event.respondWith(networkFirstThenCache(request));
    } else if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
      event.respondWith(handleApiMutation(request));
    }
  } else {
    // Strategy for app assets (cache first)
    event.respondWith(cacheFirst(request));
  }
});

const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(APP_SHELL_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed for app asset:', error);
    // You could return a fallback offline page here if you have one
    throw error;
  }
};

const networkFirstThenCache = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache.', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || Promise.reject(error);
  }
};

const handleApiMutation = async (request) => {
  try {
    // Try to send the request to the network
    const response = await fetch(request.clone());
    console.log('[SW] API mutation successful online.');
    return response;
  } catch (error) {
    // If it fails (we're offline), queue it
    console.log('[SW] API mutation failed, queueing for background sync.');
    await queueRequestForSync(request);
    
    // Return a synthetic success response to the app so the UI updates optimistically
    const syntheticResponse = { success: true, offline: true, message: 'Request queued for sync.' };
    return new Response(JSON.stringify(syntheticResponse), {
      status: 202, // 202 Accepted
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const queueRequestForSync = async (request) => {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  await addToQueue(requestData);

  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-offline-actions');
      console.log('[SW] Background sync registered.');
    } catch (e) {
      console.error('[SW] Background sync registration failed:', e);
    }
  }
};

self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-actions') {
    console.log('[SW] Background sync event triggered.');
    event.waitUntil(processSyncQueue());
  }
});

const processSyncQueue = async () => {
  try {
    const queue = await getQueue();
    console.log('[SW] Processing sync queue with', queue.length, 'items.');

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });

        if (response.ok) {
          console.log('[SW] Successfully synced item:', item.url);
          await deleteFromQueue(item.id);
        } else {
          console.error('[SW] Failed to sync item, server responded with error:', item.url, response.status);
          // If it's a client error (e.g., 401, 403), it's unlikely to succeed later.
          // We'll remove it to prevent a stuck queue.
          if (response.status >= 400 && response.status < 500) {
            console.log('[SW] Deleting unsyncable request from queue.');
            await deleteFromQueue(item.id);
          }
        }
      } catch (error) {
        console.error('[SW] Failed to sync item due to network error:', item.url, error);
        // If there's a network error, break the loop and try again on the next sync event.
        break;
      }
    }

    // Notify clients that sync is complete so they can re-fetch data
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
    console.log('[SW] Sync processing complete.');
  } catch (error) {
      console.error('[SW] Error processing sync queue:', error);
  }
};
