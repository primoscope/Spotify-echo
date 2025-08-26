/**
 * EchoTune AI Service Worker
 * 
 * Implements PWA offline capabilities, push notifications, and background sync
 * Part of PWA workstream - Phase 2.3 Advanced Features
 */

const CACHE_NAME = 'echotune-v1.2.0';
const STATIC_CACHE_NAME = 'echotune-static-v1.2.0';
const API_CACHE_NAME = 'echotune-api-v1.2.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/modern-index.html',
  '/dashboard/',
  '/js/app.js',
  '/js/recommendations.js',
  '/js/chat.js',
  '/styles/main.css',
  '/styles/modern.css',
  '/chart.min.js',
  '/favicon.ico'
];

// API endpoints to cache with strategies
const API_CACHE_PATTERNS = {
  '/api/recommendations': { strategy: 'networkFirst', ttl: 300000 }, // 5 minutes
  '/api/user/profile': { strategy: 'cacheFirst', ttl: 3600000 }, // 1 hour  
  '/api/tracks/search': { strategy: 'networkFirst', ttl: 600000 }, // 10 minutes
  '/api/experiments/flags': { strategy: 'networkFirst', ttl: 60000 } // 1 minute
};

// Background sync tasks queue
let syncQueue = [];
const SYNC_QUEUE_NAME = 'echotune-background-sync';

// Push notification setup
const PUSH_ENDPOINT = '/api/push/subscribe';

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1.2.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Initialize background sync queue
      initializeBackgroundSync(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v1.2.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim(),
      
      // Set up background sync
      setupBackgroundSync()
    ])
  );
});

/**
 * Fetch Event Handler with Caching Strategies
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests with appropriate caching strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }
  
  // Default network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback to offline page for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html') || caches.match('/index.html');
      }
      throw new Error('Network unavailable');
    })
  );
});

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = { 
        title: 'EchoTune AI',
        body: event.data.text() || 'New music recommendations available!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      };
    }
  }
  
  const notificationOptions = {
    body: notificationData.body || 'New music recommendations available!',
    icon: notificationData.icon || '/favicon.ico',
    badge: notificationData.badge || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now(),
      ...notificationData.data
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'EchoTune AI',
      notificationOptions
    )
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Background Sync Handler
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processBackgroundSync());
  }
});

/**
 * Message Handler for Communication with Main Thread
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'QUEUE_SYNC':
      queueBackgroundSync(event.data.payload);
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        status: getCacheStatus()
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(event.data.cacheType).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

/**
 * Handle API Requests with Caching Strategies
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pattern = findCachePattern(url.pathname);
  
  if (!pattern) {
    // No caching strategy defined, use network-only
    return fetch(request);
  }
  
  const cache = await caches.open(API_CACHE_NAME);
  
  switch (pattern.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cache, pattern.ttl);
      
    case 'networkFirst':
      return networkFirst(request, cache, pattern.ttl);
      
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache, pattern.ttl);
      
    default:
      return fetch(request);
  }
}

/**
 * Cache-First Strategy
 */
async function cacheFirst(request, cache, ttl) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse; // Return stale cache as fallback
    }
    throw error;
  }
}

/**
 * Network-First Strategy
 */
async function networkFirst(request, cache, ttl) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse, ttl)) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Stale-While-Revalidate Strategy
 */
async function staleWhileRevalidate(request, cache, ttl) {
  const cachedResponse = await cache.match(request);
  
  // Always fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    fetchPromise.catch(() => {}); // Ignore background fetch errors
    return cachedResponse;
  }
  
  // Return network response if no cache or expired
  return fetchPromise;
}

/**
 * Handle Static Assets
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

/**
 * Initialize Background Sync
 */
async function initializeBackgroundSync() {
  try {
    // Load sync queue from IndexedDB
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    request.onsuccess = () => {
      syncQueue = request.result || [];
      console.log('[SW] Loaded', syncQueue.length, 'items from sync queue');
    };
  } catch (error) {
    console.error('[SW] Failed to initialize background sync:', error);
  }
}

/**
 * Setup Background Sync Registration
 */
async function setupBackgroundSync() {
  try {
    await self.registration.sync.register(SYNC_QUEUE_NAME);
    console.log('[SW] Background sync registered');
  } catch (error) {
    console.error('[SW] Background sync registration failed:', error);
  }
}

/**
 * Queue Background Sync Task
 */
async function queueBackgroundSync(taskData) {
  const task = {
    id: generateTaskId(),
    type: taskData.type,
    data: taskData.data,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 3
  };
  
  syncQueue.push(task);
  
  try {
    // Persist to IndexedDB
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.add(task);
    
    // Register sync event
    await self.registration.sync.register(SYNC_QUEUE_NAME);
    
    console.log('[SW] Queued background sync task:', task.type);
  } catch (error) {
    console.error('[SW] Failed to queue background sync task:', error);
  }
}

/**
 * Process Background Sync Queue
 */
async function processBackgroundSync() {
  console.log('[SW] Processing', syncQueue.length, 'background sync tasks');
  
  const failedTasks = [];
  
  for (const task of syncQueue) {
    try {
      await processTask(task);
      console.log('[SW] Successfully synced task:', task.type);
      
      // Remove from IndexedDB
      await removeTaskFromDB(task.id);
    } catch (error) {
      console.error('[SW] Failed to sync task:', task.type, error);
      
      task.retryCount++;
      if (task.retryCount < task.maxRetries) {
        failedTasks.push(task);
      } else {
        console.error('[SW] Task exceeded max retries, dropping:', task.type);
        await removeTaskFromDB(task.id);
      }
    }
  }
  
  // Update sync queue with failed tasks for retry
  syncQueue = failedTasks;
  
  // Re-register sync if there are failed tasks
  if (failedTasks.length > 0) {
    setTimeout(() => {
      self.registration.sync.register(SYNC_QUEUE_NAME);
    }, 5000); // Retry after 5 seconds
  }
}

/**
 * Process Individual Sync Task
 */
async function processTask(task) {
  switch (task.type) {
    case 'feedback_event':
      return sendFeedbackEvent(task.data);
      
    case 'experiment_event':
      return sendExperimentEvent(task.data);
      
    case 'analytics_event':
      return sendAnalyticsEvent(task.data);
      
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

/**
 * Send Feedback Event
 */
async function sendFeedbackEvent(data) {
  const response = await fetch('/api/events/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send feedback event: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Send Experiment Event
 */
async function sendExperimentEvent(data) {
  const response = await fetch('/api/experiments/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send experiment event: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Send Analytics Event
 */
async function sendAnalyticsEvent(data) {
  const response = await fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send analytics event: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Utility Functions
 */

function findCachePattern(pathname) {
  for (const pattern in API_CACHE_PATTERNS) {
    if (pathname.startsWith(pattern)) {
      return API_CACHE_PATTERNS[pattern];
    }
  }
  return null;
}

function isStaticAsset(pathname) {
  const extensions = ['.js', '.css', '.html', '.ico', '.png', '.jpg', '.svg'];
  return extensions.some(ext => pathname.endsWith(ext)) || 
         STATIC_ASSETS.some(asset => pathname === asset);
}

function isExpired(response, ttl) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  return Date.now() - responseTime > ttl;
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME && name !== API_CACHE_NAME)
      .map(name => caches.delete(name))
  );
}

function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EchoTuneDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function removeTaskFromDB(taskId) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.delete(taskId);
  } catch (error) {
    console.error('[SW] Failed to remove task from DB:', error);
  }
}

function getCacheStatus() {
  return {
    static: STATIC_CACHE_NAME,
    api: API_CACHE_NAME,
    queueSize: syncQueue.length,
    version: '1.2.0'
  };
}

async function clearCache(cacheType) {
  switch (cacheType) {
    case 'static':
      return caches.delete(STATIC_CACHE_NAME);
    case 'api':
      return caches.delete(API_CACHE_NAME);
    case 'all':
      return Promise.all([
        caches.delete(STATIC_CACHE_NAME),
        caches.delete(API_CACHE_NAME)
      ]);
    default:
      return Promise.resolve();
  }
}

console.log('[SW] Service Worker v1.2.0 loaded');