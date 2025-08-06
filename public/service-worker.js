/**
 * EchoTune AI Service Worker
 * Provides offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'echotune-ai-v2.1.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/modern-index.html',
  '/modern-advanced-settings.html',
  '/chat',
  '/public/js/app.js',
  '/public/js/chat.js',
  '/public/js/player.js',
  '/public/styles/main.css',
  '/public/styles/modern.css',
  '/public/styles/chat.css',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health',
  '/api/settings/status',
  '/api/settings/schema',
  '/api/analytics/overview',
  '/api/providers/status'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('EchoTune AI Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('EchoTune AI Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('EchoTune AI Service Worker: Installed successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('EchoTune AI Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('EchoTune AI Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('echotune-ai-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('EchoTune AI Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('EchoTune AI Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(url)) {
      event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(url)) {
      event.respondWith(handleAPIRequest(request));
    } else if (isNavigationRequest(request)) {
      event.respondWith(handleNavigationRequest(request));
    } else {
      event.respondWith(handleDynamicRequest(request));
    }
  }
});

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return url.pathname.includes('/public/') || 
         url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.ico');
}

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Handle static asset requests - cache first strategy
 */
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('EchoTune AI Service Worker: Static asset error:', error);
    return new Response('Asset unavailable offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle API requests - network first with cache fallback
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for specific endpoints
      if (isCacheableAPI(request.url)) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    // If network fails, try cache
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical APIs
    return createOfflineAPIResponse(request);
    
  } catch (error) {
    console.error('EchoTune AI Service Worker: API request error:', error);
    
    // Try cache first for offline scenarios
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineAPIResponse(request);
  }
}

/**
 * Handle navigation requests - cache first with network fallback
 */
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('EchoTune AI Service Worker: Navigation error:', error);
    
    // Fallback to cached index page
    const cache = await caches.open(STATIC_CACHE);
    const fallback = await cache.match('/') || await cache.match('/index.html');
    
    return fallback || new Response('App unavailable offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Handle dynamic requests - network first
 */
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    return cachedResponse || new Response('Content unavailable offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Check if API endpoint should be cached
 */
function isCacheableAPI(url) {
  return API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Create offline response for API requests
 */
function createOfflineAPIResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/health')) {
    return new Response(JSON.stringify({
      status: 'offline',
      message: 'Service worker active - limited functionality available',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname.includes('/settings/status')) {
    return new Response(JSON.stringify({
      ai_providers: { offline_mode: true },
      database: { status: 'offline', fallback: 'localStorage' },
      features: { basic_chat: true, offline_recommendations: true }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'API unavailable offline',
    message: 'This feature requires internet connection'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('EchoTune AI Service Worker: Push notification received');
  
  let title = 'EchoTune AI';
  let options = {
    body: 'New music recommendations available!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'echotune-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Recommendations',
        icon: '/assets/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/dismiss-icon.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      options.tag = data.tag || options.tag;
    } catch (error) {
      console.error('EchoTune AI Service Worker: Push data parse error:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('EchoTune AI Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('EchoTune AI Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync-recommendations') {
    event.waitUntil(syncRecommendations());
  } else if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * Sync recommendations when back online
 */
async function syncRecommendations() {
  try {
    console.log('EchoTune AI Service Worker: Syncing recommendations...');
    
    // Get any pending recommendation requests from IndexedDB
    const pendingRequests = await getPendingRequests('recommendations');
    
    for (const request of pendingRequests) {
      try {
        await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        
        // Remove from pending after successful sync
        await removePendingRequest('recommendations', request.id);
      } catch (error) {
        console.error('EchoTune AI Service Worker: Recommendation sync failed:', error);
      }
    }
  } catch (error) {
    console.error('EchoTune AI Service Worker: Sync recommendations error:', error);
  }
}

/**
 * Sync analytics when back online
 */
async function syncAnalytics() {
  try {
    console.log('EchoTune AI Service Worker: Syncing analytics...');
    
    const pendingAnalytics = await getPendingRequests('analytics');
    
    for (const analytics of pendingAnalytics) {
      try {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analytics.data)
        });
        
        await removePendingRequest('analytics', analytics.id);
      } catch (error) {
        console.error('EchoTune AI Service Worker: Analytics sync failed:', error);
      }
    }
  } catch (error) {
    console.error('EchoTune AI Service Worker: Sync analytics error:', error);
  }
}

/**
 * Get pending requests from IndexedDB
 */
async function getPendingRequests(type) {
  // Implementation would depend on IndexedDB structure
  // For now, return empty array
  return [];
}

/**
 * Remove pending request from IndexedDB
 */
async function removePendingRequest(type, id) {
  // Implementation would depend on IndexedDB structure
  console.log(`Removing pending ${type} request:`, id);
}

console.log('EchoTune AI Service Worker: Loaded successfully');