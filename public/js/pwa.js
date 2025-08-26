/**
 * EchoTune AI PWA Client Manager
 * 
 * Handles PWA features including service worker registration, push notifications,
 * background sync, and offline capabilities on the client side.
 * 
 * Part of PWA workstream - Phase 2.3 Advanced Features
 */

class EchoTunePWA {
    constructor() {
        this.serviceWorker = null;
        this.pushSubscription = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.config = {
            swPath: '/sw.js',
            pushServerKey: null, // Will be fetched from server
            enablePush: true,
            enableSync: true,
            enableOffline: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('[PWA] Initializing EchoTune PWA features');
        
        // Check PWA support
        if (!this.checkPWASupport()) {
            console.warn('[PWA] PWA features not fully supported');
            return;
        }
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize push notifications
        if (this.config.enablePush) {
            await this.initializePushNotifications();
        }
        
        // Setup background sync
        if (this.config.enableSync) {
            this.initializeBackgroundSync();
        }
        
        // Handle offline capabilities
        if (this.config.enableOffline) {
            this.initializeOfflineSupport();
        }
        
        console.log('[PWA] PWA initialization complete');
    }
    
    checkPWASupport() {
        const checks = {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notification: 'Notification' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            indexedDB: 'indexedDB' in window
        };
        
        console.log('[PWA] Feature support:', checks);
        
        return checks.serviceWorker && checks.indexedDB;
    }
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Workers not supported');
        }
        
        try {
            const registration = await navigator.serviceWorker.register(this.config.swPath, {
                scope: '/',
                updateViaCache: 'imports'
            });
            
            this.serviceWorker = registration;
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                console.log('[PWA] Service worker update found');
                this.handleServiceWorkerUpdate(registration);
            });
            
            // Check for waiting service worker
            if (registration.waiting) {
                this.showUpdateAvailable();
            }
            
            console.log('[PWA] Service worker registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
            throw error;
        }
    }
    
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
            }
        });
    }
    
    showUpdateAvailable() {
        // Show update notification to user
        if (confirm('A new version of EchoTune is available. Update now?')) {
            this.applyUpdate();
        }
    }
    
    applyUpdate() {
        if (this.serviceWorker && this.serviceWorker.waiting) {
            this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
    
    async initializePushNotifications() {
        try {
            // Check permission status
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.log('[PWA] Push notifications permission denied');
                return;
            }
            
            // Get server key for push notifications
            await this.fetchPushServerKey();
            
            // Subscribe to push notifications
            await this.subscribeToPush();
            
            console.log('[PWA] Push notifications initialized');
        } catch (error) {
            console.error('[PWA] Failed to initialize push notifications:', error);
        }
    }
    
    async fetchPushServerKey() {
        try {
            const response = await fetch('/api/push/vapid-key');
            const data = await response.json();
            this.config.pushServerKey = data.publicKey;
        } catch (error) {
            console.error('[PWA] Failed to fetch push server key:', error);
            // Use a fallback or disable push notifications
        }
    }
    
    async subscribeToPush() {
        if (!this.serviceWorker || !this.config.pushServerKey) {
            return;
        }
        
        try {
            const subscription = await this.serviceWorker.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.config.pushServerKey)
            });
            
            this.pushSubscription = subscription;
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            console.log('[PWA] Push notification subscription successful');
            return subscription;
        } catch (error) {
            console.error('[PWA] Push subscription failed:', error);
            throw error;
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            console.log('[PWA] Subscription sent to server successfully');
        } catch (error) {
            console.error('[PWA] Failed to send subscription to server:', error);
            throw error;
        }
    }
    
    async unsubscribeFromPush() {
        if (!this.pushSubscription) {
            return;
        }
        
        try {
            await this.pushSubscription.unsubscribe();
            
            // Notify server
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: this.pushSubscription.endpoint
                })
            });
            
            this.pushSubscription = null;
            console.log('[PWA] Unsubscribed from push notifications');
        } catch (error) {
            console.error('[PWA] Failed to unsubscribe from push notifications:', error);
        }
    }
    
    initializeBackgroundSync() {
        // Handle online/offline events
        window.addEventListener('online', () => {
            console.log('[PWA] Back online, processing sync queue');
            this.isOnline = true;
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('[PWA] Gone offline');
            this.isOnline = false;
        });
        
        // Initialize IndexedDB for offline queue
        this.initializeOfflineDB();
    }
    
    async initializeOfflineDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EchoTuneDB', 1);
            
            request.onerror = () => {
                console.error('[PWA] Failed to open IndexedDB');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.offlineDB = request.result;
                console.log('[PWA] IndexedDB initialized');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('offlineQueue')) {
                    const store = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('cachedData')) {
                    const store = db.createObjectStore('cachedData', { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('expires', 'expires', { unique: false });
                }
            };
        });
    }
    
    async queueOfflineAction(type, data) {
        const action = {
            type,
            data,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };
        
        if (this.isOnline && this.serviceWorker) {
            // If online, send to service worker for background sync
            this.serviceWorker.active.postMessage({
                type: 'QUEUE_SYNC',
                payload: action
            });
        } else {
            // If offline, store in IndexedDB
            await this.storeOfflineAction(action);
        }
    }
    
    async storeOfflineAction(action) {
        if (!this.offlineDB) {
            console.warn('[PWA] IndexedDB not available, action lost:', action);
            return;
        }
        
        try {
            const transaction = this.offlineDB.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');
            await store.add(action);
            
            console.log('[PWA] Action queued offline:', action.type);
        } catch (error) {
            console.error('[PWA] Failed to store offline action:', error);
        }
    }
    
    async processOfflineQueue() {
        if (!this.offlineDB || !this.isOnline) {
            return;
        }
        
        try {
            const transaction = this.offlineDB.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');
            const request = store.getAll();
            
            request.onsuccess = async () => {
                const actions = request.result;
                
                for (const action of actions) {
                    try {
                        await this.processOfflineAction(action);
                        
                        // Remove from queue after successful processing
                        await store.delete(action.id);
                    } catch (error) {
                        console.error('[PWA] Failed to process offline action:', error);
                        
                        // Increment retry count
                        action.retryCount++;
                        if (action.retryCount < 3) {
                            await store.put(action);
                        } else {
                            console.warn('[PWA] Action exceeded retry limit, removing:', action);
                            await store.delete(action.id);
                        }
                    }
                }
            };
        } catch (error) {
            console.error('[PWA] Failed to process offline queue:', error);
        }
    }
    
    async processOfflineAction(action) {
        switch (action.type) {
            case 'feedback_event':
                return this.sendFeedbackEvent(action.data);
            case 'experiment_event':
                return this.sendExperimentEvent(action.data);
            case 'analytics_event':
                return this.sendAnalyticsEvent(action.data);
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    
    async sendFeedbackEvent(data) {
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
    
    async sendExperimentEvent(data) {
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
    
    async sendAnalyticsEvent(data) {
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
    
    initializeOfflineSupport() {
        // Cache critical data in IndexedDB
        this.cacheUserData();
        
        // Setup periodic data sync
        setInterval(() => {
            if (this.isOnline) {
                this.syncCachedData();
            }
        }, 30000); // Every 30 seconds
    }
    
    async cacheUserData() {
        if (!this.offlineDB) return;
        
        try {
            // Cache user profile
            const profileResponse = await fetch('/api/user/profile');
            if (profileResponse.ok) {
                const profile = await profileResponse.json();
                await this.setCachedData('user_profile', profile, 3600000); // 1 hour TTL
            }
            
            // Cache recent recommendations
            const recoResponse = await fetch('/api/recommendations?limit=20');
            if (recoResponse.ok) {
                const recommendations = await recoResponse.json();
                await this.setCachedData('recent_recommendations', recommendations, 1800000); // 30 minutes TTL
            }
        } catch (error) {
            console.error('[PWA] Failed to cache user data:', error);
        }
    }
    
    async setCachedData(key, data, ttl = 3600000) {
        if (!this.offlineDB) return;
        
        const item = {
            key,
            data,
            timestamp: new Date().toISOString(),
            expires: new Date(Date.now() + ttl).toISOString()
        };
        
        try {
            const transaction = this.offlineDB.transaction(['cachedData'], 'readwrite');
            const store = transaction.objectStore('cachedData');
            await store.put(item);
        } catch (error) {
            console.error('[PWA] Failed to cache data:', error);
        }
    }
    
    async getCachedData(key) {
        if (!this.offlineDB) return null;
        
        try {
            const transaction = this.offlineDB.transaction(['cachedData'], 'readonly');
            const store = transaction.objectStore('cachedData');
            const request = store.get(key);
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    const item = request.result;
                    
                    if (!item) {
                        resolve(null);
                        return;
                    }
                    
                    // Check if expired
                    if (new Date(item.expires) < new Date()) {
                        resolve(null);
                        return;
                    }
                    
                    resolve(item.data);
                };
                
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.error('[PWA] Failed to get cached data:', error);
            return null;
        }
    }
    
    async syncCachedData() {
        // Refresh cached data periodically
        await this.cacheUserData();
    }
    
    setupEventListeners() {
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
        }
        
        // Listen for app install prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredPrompt = event;
            this.showInstallPrompt();
        });
        
        // Listen for app install
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App was installed');
            this.deferredPrompt = null;
        });
    }
    
    handleServiceWorkerMessage(event) {
        switch (event.data.type) {
            case 'CACHE_STATUS':
                console.log('[PWA] Cache status:', event.data.status);
                break;
            case 'SYNC_COMPLETE':
                console.log('[PWA] Background sync completed');
                break;
            default:
                console.log('[PWA] Unknown message from service worker:', event.data);
        }
    }
    
    showInstallPrompt() {
        // Show custom install prompt
        const installBanner = document.createElement('div');
        installBanner.id = 'pwa-install-banner';
        installBanner.innerHTML = `
            <div class="install-banner">
                <span>Install EchoTune for a better experience!</span>
                <button id="install-button">Install</button>
                <button id="dismiss-button">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(installBanner);
        
        document.getElementById('install-button').addEventListener('click', () => {
            this.installApp();
        });
        
        document.getElementById('dismiss-button').addEventListener('click', () => {
            installBanner.remove();
        });
    }
    
    async installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        
        const result = await this.deferredPrompt.userChoice;
        console.log('[PWA] Install prompt result:', result.outcome);
        
        this.deferredPrompt = null;
        
        // Remove install banner
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.remove();
        }
    }
    
    // Utility methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    // Public API methods
    async trackFeedback(eventType, itemId, metadata = {}) {
        const feedbackData = {
            event_type: eventType,
            item_id: itemId,
            timestamp: new Date().toISOString(),
            session_id: this.getSessionId(),
            ...metadata
        };
        
        await this.queueOfflineAction('feedback_event', feedbackData);
    }
    
    async trackExperiment(experimentId, variant, event, metadata = {}) {
        const experimentData = {
            experiment_id: experimentId,
            variant,
            event,
            timestamp: new Date().toISOString(),
            session_id: this.getSessionId(),
            ...metadata
        };
        
        await this.queueOfflineAction('experiment_event', experimentData);
    }
    
    async trackAnalytics(eventName, properties = {}) {
        const analyticsData = {
            event: eventName,
            properties: {
                timestamp: new Date().toISOString(),
                session_id: this.getSessionId(),
                user_agent: navigator.userAgent,
                ...properties
            }
        };
        
        await this.queueOfflineAction('analytics_event', analyticsData);
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('echotune_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('echotune_session_id', sessionId);
        }
        return sessionId;
    }
    
    async getCacheStatus() {
        if (!this.serviceWorker) return null;
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.status);
            };
            
            this.serviceWorker.active.postMessage(
                { type: 'GET_CACHE_STATUS' },
                [messageChannel.port2]
            );
        });
    }
    
    async clearCache(cacheType = 'all') {
        if (!this.serviceWorker) return;
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };
            
            this.serviceWorker.active.postMessage(
                { type: 'CLEAR_CACHE', cacheType },
                [messageChannel.port2]
            );
        });
    }
}

// Global PWA instance
window.EchoTunePWA = EchoTunePWA;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.echoTunePWA = new EchoTunePWA();
    });
} else {
    window.echoTunePWA = new EchoTunePWA();
}

export default EchoTunePWA;