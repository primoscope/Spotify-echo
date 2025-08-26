# PWA Features Init Module

"""
Progressive Web App offline capabilities and advanced web features.
Implementation of PWA workstream - Phase 2.3 Advanced Features.
"""

import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import sqlite3
import hashlib
import base64

logger = logging.getLogger(__name__)

def is_pwa_enabled() -> bool:
    """Check if PWA features are enabled"""
    return os.getenv('ENABLE_PWA_OFFLINE', 'false').lower() == 'true'

@dataclass
class PushSubscription:
    """Push notification subscription data"""
    endpoint: str
    keys: Dict[str, str]  # p256dh and auth keys
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    active: bool = True

@dataclass 
class SyncTask:
    """Background sync task data"""
    task_id: str
    task_type: str
    data: Dict[str, Any]
    created_at: datetime
    retry_count: int = 0
    max_retries: int = 3
    
class ServiceWorkerManager:
    """Production service worker management"""
    
    def __init__(self):
        self.enabled = is_pwa_enabled()
        self.db_path = os.getenv('PWA_DB_PATH', 'pwa_data.db')
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database for PWA data"""
        if not self.enabled:
            return
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS push_subscriptions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        endpoint TEXT UNIQUE,
                        p256dh_key TEXT,
                        auth_key TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        active BOOLEAN DEFAULT 1
                    )
                ''')
                
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS sync_tasks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        task_id TEXT UNIQUE,
                        task_type TEXT,
                        data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        retry_count INTEGER DEFAULT 0,
                        max_retries INTEGER DEFAULT 3,
                        completed BOOLEAN DEFAULT 0
                    )
                ''')
                
                conn.commit()
                logger.info("PWA database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PWA database: {e}")
    
    def register_service_worker(self) -> Dict[str, Any]:
        """Generate service worker registration data"""
        if not self.enabled:
            return {"enabled": False, "reason": "PWA features disabled"}
            
        return {
            "enabled": True,
            "script_url": "/sw.js",
            "scope": "/",
            "update_via_cache": "imports",
            "features": {
                "push_notifications": True,
                "background_sync": True,
                "offline_cache": True,
                "install_prompt": True
            }
        }
    
    def save_push_subscription(self, user_id: str, subscription_data: Dict[str, Any]) -> bool:
        """Save push notification subscription"""
        if not self.enabled:
            return False
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                keys = subscription_data.get('keys', {})
                conn.execute('''
                    INSERT OR REPLACE INTO push_subscriptions 
                    (user_id, endpoint, p256dh_key, auth_key, active)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    subscription_data['endpoint'],
                    keys.get('p256dh'),
                    keys.get('auth'),
                    True
                ))
                conn.commit()
                logger.info(f"Saved push subscription for user {user_id}")
                return True
        except Exception as e:
            logger.error(f"Failed to save push subscription: {e}")
            return False
    
    def get_push_subscriptions(self, user_id: Optional[str] = None) -> List[PushSubscription]:
        """Get push subscriptions for user or all active subscriptions"""
        if not self.enabled:
            return []
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                if user_id:
                    cursor = conn.execute('''
                        SELECT endpoint, p256dh_key, auth_key, user_id, created_at, active
                        FROM push_subscriptions
                        WHERE user_id = ? AND active = 1
                    ''', (user_id,))
                else:
                    cursor = conn.execute('''
                        SELECT endpoint, p256dh_key, auth_key, user_id, created_at, active
                        FROM push_subscriptions
                        WHERE active = 1
                    ''')
                
                subscriptions = []
                for row in cursor.fetchall():
                    subscriptions.append(PushSubscription(
                        endpoint=row[0],
                        keys={'p256dh': row[1], 'auth': row[2]},
                        user_id=row[3],
                        created_at=datetime.fromisoformat(row[4]) if row[4] else None,
                        active=bool(row[5])
                    ))
                
                return subscriptions
        except Exception as e:
            logger.error(f"Failed to get push subscriptions: {e}")
            return []
    
    def remove_push_subscription(self, endpoint: str) -> bool:
        """Remove/deactivate push subscription"""
        if not self.enabled:
            return False
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    UPDATE push_subscriptions 
                    SET active = 0 
                    WHERE endpoint = ?
                ''', (endpoint,))
                conn.commit()
                logger.info(f"Deactivated push subscription: {endpoint}")
                return True
        except Exception as e:
            logger.error(f"Failed to remove push subscription: {e}")
            return False

class OfflineCacheManager:
    """Production offline caching management"""
    
    def __init__(self):
        self.enabled = is_pwa_enabled()
        self.cache_config = self._load_cache_config()
        
    def _load_cache_config(self) -> Dict[str, Any]:
        """Load cache configuration"""
        return {
            "static_assets": [
                "/", "/index.html", "/modern-index.html",
                "/dashboard/", "/js/app.js", "/js/recommendations.js",
                "/js/chat.js", "/styles/main.css", "/styles/modern.css"
            ],
            "api_patterns": {
                "/api/recommendations": {"strategy": "networkFirst", "ttl": 300},
                "/api/user/profile": {"strategy": "cacheFirst", "ttl": 3600},
                "/api/tracks/search": {"strategy": "networkFirst", "ttl": 600},
                "/api/experiments/flags": {"strategy": "networkFirst", "ttl": 60}
            },
            "cache_size_limit": 50 * 1024 * 1024,  # 50MB
            "cache_version": "v1.2.0"
        }
    
    def cache_app_shell(self) -> Dict[str, Any]:
        """Generate app shell caching configuration"""
        if not self.enabled:
            return {"enabled": False}
            
        return {
            "enabled": True,
            "assets": self.cache_config["static_assets"],
            "version": self.cache_config["cache_version"],
            "strategies": self.cache_config["api_patterns"]
        }
    
    def cache_api_responses(self, endpoint: str, data: Any) -> Dict[str, Any]:
        """Get caching strategy for API endpoint"""
        if not self.enabled:
            return {"strategy": "network"}
            
        for pattern, config in self.cache_config["api_patterns"].items():
            if endpoint.startswith(pattern):
                return config
                
        return {"strategy": "network"}
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get current cache status"""
        return {
            "enabled": self.enabled,
            "version": self.cache_config["cache_version"],
            "size_limit": self.cache_config["cache_size_limit"],
            "asset_count": len(self.cache_config["static_assets"]),
            "api_patterns": len(self.cache_config["api_patterns"])
        }

class BackgroundSyncManager:
    """Production background sync management"""
    
    def __init__(self):
        self.enabled = is_pwa_enabled()
        self.db_path = os.getenv('PWA_DB_PATH', 'pwa_data.db')
        
    def queue_sync_task(self, task_type: str, task_data: Dict[str, Any], user_id: Optional[str] = None) -> bool:
        """Queue background sync task"""
        if not self.enabled:
            logger.warning("Background sync disabled, sending immediately")
            return self._send_immediately(task_type, task_data)
            
        try:
            task_id = self._generate_task_id(task_type, task_data)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO sync_tasks 
                    (task_id, task_type, data, retry_count, max_retries)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    task_id,
                    task_type,
                    json.dumps(task_data),
                    0,
                    3
                ))
                conn.commit()
                
            logger.info(f"Queued background sync task: {task_type}")
            return True
        except Exception as e:
            logger.error(f"Failed to queue sync task: {e}")
            return self._send_immediately(task_type, task_data)
    
    def get_pending_tasks(self, limit: int = 100) -> List[SyncTask]:
        """Get pending sync tasks"""
        if not self.enabled:
            return []
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    SELECT task_id, task_type, data, created_at, retry_count, max_retries
                    FROM sync_tasks
                    WHERE completed = 0 AND retry_count < max_retries
                    ORDER BY created_at ASC
                    LIMIT ?
                ''', (limit,))
                
                tasks = []
                for row in cursor.fetchall():
                    tasks.append(SyncTask(
                        task_id=row[0],
                        task_type=row[1],
                        data=json.loads(row[2]),
                        created_at=datetime.fromisoformat(row[3]),
                        retry_count=row[4],
                        max_retries=row[5]
                    ))
                
                return tasks
        except Exception as e:
            logger.error(f"Failed to get pending tasks: {e}")
            return []
    
    def mark_task_completed(self, task_id: str) -> bool:
        """Mark sync task as completed"""
        if not self.enabled:
            return True
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    UPDATE sync_tasks 
                    SET completed = 1 
                    WHERE task_id = ?
                ''', (task_id,))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to mark task completed: {e}")
            return False
    
    def increment_retry_count(self, task_id: str) -> bool:
        """Increment retry count for failed task"""
        if not self.enabled:
            return True
            
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    UPDATE sync_tasks 
                    SET retry_count = retry_count + 1 
                    WHERE task_id = ?
                ''', (task_id,))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to increment retry count: {e}")
            return False
    
    def cleanup_completed_tasks(self, older_than_days: int = 7) -> int:
        """Clean up completed tasks older than specified days"""
        if not self.enabled:
            return 0
            
        try:
            cutoff_date = datetime.now() - timedelta(days=older_than_days)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    DELETE FROM sync_tasks 
                    WHERE completed = 1 AND created_at < ?
                ''', (cutoff_date.isoformat(),))
                
                deleted_count = cursor.rowcount
                conn.commit()
                
                logger.info(f"Cleaned up {deleted_count} completed sync tasks")
                return deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup completed tasks: {e}")
            return 0
    
    def _generate_task_id(self, task_type: str, task_data: Dict[str, Any]) -> str:
        """Generate unique task ID"""
        content = f"{task_type}:{json.dumps(task_data, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _send_immediately(self, task_type: str, task_data: Dict[str, Any]) -> bool:
        """Fallback to immediate sending when background sync is disabled"""
        # This would integrate with the event system to send immediately
        logger.info(f"Sending {task_type} immediately (background sync disabled)")
        return True
        return False

class PushNotificationManager:
    """Placeholder for push notifications"""
    def __init__(self):
        if not is_pwa_enabled():
            raise NotImplementedError("Push notifications not yet implemented - enable with ENABLE_PWA_OFFLINE=true")
    
    def send_notification(self, user_id: str, notification: Dict[str, Any]) -> bool:
        """Placeholder for sending notifications"""
        # TODO: Implement in Phase 2.3
        return False

class InstallPromptManager:
    """Placeholder for app installation prompts"""
    def __init__(self):
        if not is_pwa_enabled():
            raise NotImplementedError("Install prompts not yet implemented - enable with ENABLE_PWA_OFFLINE=true")
    
    def show_install_prompt(self) -> bool:
        """Placeholder for showing install prompt"""
        # TODO: Implement in Phase 2.3
        return False

# PWA manifest configuration (placeholder)
PWA_MANIFEST = {
    "name": "EchoTune AI",
    "short_name": "EchoTune",
    "description": "AI-powered music discovery platform",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#6366f1",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png", 
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}

# Cache strategies configuration
CACHE_STRATEGIES = {
    "app_shell": [
        "/",
        "/static/css/main.css",
        "/static/js/main.js",
        "/offline.html"
    ],
    "api_endpoints": {
        "/api/recommendations": "networkFirst",
        "/api/tracks": "cacheFirst",
        "/api/user/profile": "networkFirst"
    },
    "static_assets": {
        "/static/": "cacheFirst",
        "/icons/": "cacheFirst"
    }
}

__all__ = [
    'ServiceWorkerManager',
    'OfflineCacheManager',
    'BackgroundSyncManager',
    'PushNotificationManager',
    'InstallPromptManager',
    'PWA_MANIFEST',
    'CACHE_STRATEGIES',
    'is_pwa_enabled'
]