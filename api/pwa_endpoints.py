"""
PWA Push Notification API Endpoints

Handles push notification subscriptions, VAPID key management,
and notification sending for the PWA system.

Part of PWA workstream - Phase 2.3 Advanced Features
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify, current_app
import jwt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
import requests
import base64
from urllib.parse import urlparse

from pwa import ServiceWorkerManager, BackgroundSyncManager, is_pwa_enabled

logger = logging.getLogger(__name__)

# Create blueprint for PWA endpoints
pwa_bp = Blueprint('pwa', __name__, url_prefix='/api')

# Initialize PWA managers
sw_manager = ServiceWorkerManager()
sync_manager = BackgroundSyncManager()

# VAPID keys for push notifications
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY')
VAPID_SUBJECT = os.getenv('VAPID_SUBJECT', 'mailto:support@echotune.ai')

@pwa_bp.route('/push/vapid-key', methods=['GET'])
def get_vapid_public_key():
    """Get VAPID public key for push notification subscriptions"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    if not VAPID_PUBLIC_KEY:
        logger.error("VAPID public key not configured")
        return jsonify({'error': 'Push notifications not configured'}), 500
    
    return jsonify({
        'publicKey': VAPID_PUBLIC_KEY,
        'algorithm': 'ES256'
    })

@pwa_bp.route('/push/subscribe', methods=['POST'])
def subscribe_to_push():
    """Subscribe user to push notifications"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    try:
        data = request.get_json()
        
        if not data or 'subscription' not in data:
            return jsonify({'error': 'Missing subscription data'}), 400
        
        subscription = data['subscription']
        user_id = data.get('user_id') or request.headers.get('X-User-ID', 'anonymous')
        
        # Validate subscription data
        if not all(key in subscription for key in ['endpoint', 'keys']):
            return jsonify({'error': 'Invalid subscription format'}), 400
        
        keys = subscription['keys']
        if not all(key in keys for key in ['p256dh', 'auth']):
            return jsonify({'error': 'Missing subscription keys'}), 400
        
        # Save subscription
        success = sw_manager.save_push_subscription(user_id, subscription)
        
        if not success:
            return jsonify({'error': 'Failed to save subscription'}), 500
        
        logger.info(f"Push subscription saved for user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Subscription saved successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Error subscribing to push notifications: {e}")
        return jsonify({'error': 'Subscription failed'}), 500

@pwa_bp.route('/push/unsubscribe', methods=['POST'])
def unsubscribe_from_push():
    """Unsubscribe from push notifications"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    try:
        data = request.get_json()
        
        if not data or 'endpoint' not in data:
            return jsonify({'error': 'Missing endpoint'}), 400
        
        endpoint = data['endpoint']
        
        # Remove subscription
        success = sw_manager.remove_push_subscription(endpoint)
        
        if not success:
            return jsonify({'error': 'Failed to remove subscription'}), 500
        
        logger.info(f"Push subscription removed for endpoint {endpoint}")
        
        return jsonify({
            'success': True,
            'message': 'Unsubscribed successfully'
        })
        
    except Exception as e:
        logger.error(f"Error unsubscribing from push notifications: {e}")
        return jsonify({'error': 'Unsubscribe failed'}), 500

@pwa_bp.route('/push/send', methods=['POST'])
def send_push_notification():
    """Send push notification to user(s)"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing notification data'}), 400
        
        # Extract notification parameters
        user_id = data.get('user_id')
        title = data.get('title', 'EchoTune AI')
        body = data.get('body', 'New music recommendations available!')
        icon = data.get('icon', '/favicon.ico')
        badge = data.get('badge', '/favicon.ico')
        url = data.get('url', '/')
        tag = data.get('tag')
        renotify = data.get('renotify', False)
        require_interaction = data.get('requireInteraction', False)
        silent = data.get('silent', False)
        actions = data.get('actions', [])
        custom_data = data.get('data', {})
        
        # Get subscriptions
        if user_id:
            subscriptions = sw_manager.get_push_subscriptions(user_id)
        else:
            # Send to all subscriptions (admin only)
            if not verify_admin_token(request.headers.get('Authorization')):
                return jsonify({'error': 'Unauthorized'}), 401
            subscriptions = sw_manager.get_push_subscriptions()
        
        if not subscriptions:
            return jsonify({'error': 'No active subscriptions found'}), 404
        
        # Send notifications
        results = []
        for subscription in subscriptions:
            try:
                result = send_push_to_subscription(
                    subscription,
                    title=title,
                    body=body,
                    icon=icon,
                    badge=badge,
                    url=url,
                    tag=tag,
                    renotify=renotify,
                    require_interaction=require_interaction,
                    silent=silent,
                    actions=actions,
                    custom_data=custom_data
                )
                results.append({
                    'endpoint': subscription.endpoint,
                    'success': result['success'],
                    'status_code': result.get('status_code'),
                    'error': result.get('error')
                })
            except Exception as e:
                logger.error(f"Failed to send push to {subscription.endpoint}: {e}")
                results.append({
                    'endpoint': subscription.endpoint,
                    'success': False,
                    'error': str(e)
                })
        
        successful_sends = sum(1 for r in results if r['success'])
        
        return jsonify({
            'success': True,
            'message': f'Sent to {successful_sends}/{len(results)} subscriptions',
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return jsonify({'error': 'Failed to send notification'}), 500

@pwa_bp.route('/sync/queue', methods=['POST'])
def queue_background_sync():
    """Queue background sync task"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    try:
        data = request.get_json()
        
        if not data or 'task_type' not in data or 'task_data' not in data:
            return jsonify({'error': 'Missing task data'}), 400
        
        task_type = data['task_type']
        task_data = data['task_data']
        user_id = data.get('user_id') or request.headers.get('X-User-ID')
        
        # Queue the sync task
        success = sync_manager.queue_sync_task(task_type, task_data, user_id)
        
        if not success:
            return jsonify({'error': 'Failed to queue sync task'}), 500
        
        return jsonify({
            'success': True,
            'message': 'Task queued successfully',
            'task_type': task_type
        })
        
    except Exception as e:
        logger.error(f"Error queuing background sync task: {e}")
        return jsonify({'error': 'Failed to queue task'}), 500

@pwa_bp.route('/sync/status', methods=['GET'])
def get_sync_status():
    """Get background sync status"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    try:
        pending_tasks = sync_manager.get_pending_tasks(limit=10)
        
        return jsonify({
            'success': True,
            'pending_tasks': len(pending_tasks),
            'tasks': [
                {
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'created_at': task.created_at.isoformat(),
                    'retry_count': task.retry_count
                }
                for task in pending_tasks
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        return jsonify({'error': 'Failed to get sync status'}), 500

@pwa_bp.route('/sync/process', methods=['POST'])
def process_background_sync():
    """Manually trigger background sync processing (admin only)"""
    
    if not is_pwa_enabled():
        return jsonify({'error': 'PWA features disabled'}), 503
    
    # Verify admin authorization
    if not verify_admin_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        pending_tasks = sync_manager.get_pending_tasks()
        processed_count = 0
        failed_count = 0
        
        for task in pending_tasks:
            try:
                # Process the task (this would typically be done by service worker)
                success = process_sync_task(task)
                
                if success:
                    sync_manager.mark_task_completed(task.task_id)
                    processed_count += 1
                else:
                    sync_manager.increment_retry_count(task.task_id)
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing sync task {task.task_id}: {e}")
                sync_manager.increment_retry_count(task.task_id)
                failed_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Processed {processed_count} tasks, {failed_count} failed',
            'processed': processed_count,
            'failed': failed_count
        })
        
    except Exception as e:
        logger.error(f"Error processing background sync: {e}")
        return jsonify({'error': 'Failed to process sync'}), 500

@pwa_bp.route('/manifest.json', methods=['GET'])
def get_app_manifest():
    """Get PWA manifest file"""
    
    manifest = {
        "name": "EchoTune AI",
        "short_name": "EchoTune",
        "description": "AI-powered music recommendation and discovery platform",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#1a1a1a",
        "theme_color": "#6b73ff",
        "orientation": "portrait-primary",
        "categories": ["music", "entertainment", "lifestyle"],
        "lang": "en",
        "dir": "ltr",
        "scope": "/",
        "icons": [
            {
                "src": "/favicon.ico",
                "sizes": "64x64",
                "type": "image/x-icon"
            },
            {
                "src": "/assets/icon-192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
            },
            {
                "src": "/assets/icon-512.png", 
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            }
        ],
        "screenshots": [
            {
                "src": "/assets/screenshot-wide.png",
                "sizes": "1280x720",
                "type": "image/png",
                "form_factor": "wide"
            },
            {
                "src": "/assets/screenshot-mobile.png",
                "sizes": "640x1136",
                "type": "image/png"
            }
        ],
        "shortcuts": [
            {
                "name": "Discover Music",
                "short_name": "Discover", 
                "url": "/discover",
                "icons": [{"src": "/favicon.ico", "sizes": "64x64"}]
            },
            {
                "name": "Chat with AI",
                "short_name": "Chat",
                "url": "/chat",
                "icons": [{"src": "/favicon.ico", "sizes": "64x64"}]
            },
            {
                "name": "Dashboard",
                "short_name": "Dashboard",
                "url": "/dashboard",
                "icons": [{"src": "/favicon.ico", "sizes": "64x64"}]
            }
        ],
        "prefer_related_applications": False,
        "edge_side_panel": {
            "preferred_width": 400
        }
    }
    
    return jsonify(manifest)

# Helper functions

def send_push_to_subscription(subscription, **kwargs):
    """Send push notification to a specific subscription"""
    
    try:
        # Prepare notification payload
        notification_data = {
            'title': kwargs.get('title', 'EchoTune AI'),
            'body': kwargs.get('body', ''),
            'icon': kwargs.get('icon', '/favicon.ico'),
            'badge': kwargs.get('badge', '/favicon.ico'),
            'url': kwargs.get('url', '/'),
            'tag': kwargs.get('tag'),
            'renotify': kwargs.get('renotify', False),
            'requireInteraction': kwargs.get('require_interaction', False),
            'silent': kwargs.get('silent', False),
            'actions': kwargs.get('actions', []),
            'data': {
                'timestamp': datetime.now().isoformat(),
                **kwargs.get('custom_data', {})
            }
        }
        
        # Remove None values
        notification_data = {k: v for k, v in notification_data.items() if v is not None}
        
        payload = json.dumps(notification_data)
        
        # Generate VAPID headers
        vapid_headers = generate_vapid_headers(subscription.endpoint)
        
        # Send notification
        response = requests.post(
            subscription.endpoint,
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Content-Encoding': 'utf8',
                'TTL': '86400',  # 24 hours
                **vapid_headers
            },
            timeout=10
        )
        
        if response.status_code in [200, 201, 204]:
            return {'success': True, 'status_code': response.status_code}
        elif response.status_code == 410:
            # Subscription expired, remove it
            sw_manager.remove_push_subscription(subscription.endpoint)
            return {'success': False, 'status_code': response.status_code, 'error': 'Subscription expired'}
        else:
            return {'success': False, 'status_code': response.status_code, 'error': response.text}
            
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return {'success': False, 'error': str(e)}

def generate_vapid_headers(endpoint):
    """Generate VAPID headers for push notification"""
    
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        raise ValueError("VAPID keys not configured")
    
    # Parse endpoint to get audience
    parsed_url = urlparse(endpoint)
    audience = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    # Generate JWT claims
    now = datetime.now()
    claims = {
        'aud': audience,
        'exp': int((now + timedelta(hours=12)).timestamp()),
        'sub': VAPID_SUBJECT
    }
    
    # Sign JWT
    token = jwt.encode(
        claims,
        VAPID_PRIVATE_KEY,
        algorithm='ES256',
        headers={'typ': 'JWT', 'alg': 'ES256'}
    )
    
    return {
        'Authorization': f'vapid t={token}, k={VAPID_PUBLIC_KEY}',
        'Crypto-Key': f'p256ecdsa={VAPID_PUBLIC_KEY}'
    }

def verify_admin_token(auth_header):
    """Verify admin authorization token"""
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.split(' ')[1]
    admin_token = os.getenv('ADMIN_API_TOKEN')
    
    return admin_token and token == admin_token

def process_sync_task(task):
    """Process a background sync task"""
    
    try:
        if task.task_type == 'feedback_event':
            return process_feedback_event(task.data)
        elif task.task_type == 'experiment_event':
            return process_experiment_event(task.data)
        elif task.task_type == 'analytics_event':
            return process_analytics_event(task.data)
        else:
            logger.error(f"Unknown sync task type: {task.task_type}")
            return False
            
    except Exception as e:
        logger.error(f"Error processing sync task: {e}")
        return False

def process_feedback_event(data):
    """Process feedback event sync task"""
    # This would integrate with the events system
    logger.info(f"Processing feedback event: {data}")
    return True

def process_experiment_event(data):
    """Process experiment event sync task"""
    # This would integrate with the experiments system
    logger.info(f"Processing experiment event: {data}")
    return True

def process_analytics_event(data):
    """Process analytics event sync task"""
    # This would integrate with the analytics system
    logger.info(f"Processing analytics event: {data}")
    return True

# Generate VAPID keys if not configured
def generate_vapid_keys():
    """Generate VAPID key pair for push notifications"""
    
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Convert to base64 for web push
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('ascii').rstrip('=')
    
    return {
        'private_key': private_pem.decode('ascii'),
        'public_key': public_pem.decode('ascii'),
        'public_key_b64': public_key_b64
    }

if __name__ == '__main__':
    # Generate VAPID keys for development
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        print("Generating VAPID keys...")
        keys = generate_vapid_keys()
        print(f"VAPID_PRIVATE_KEY={keys['private_key']}")
        print(f"VAPID_PUBLIC_KEY={keys['public_key_b64']}")
        print(f"VAPID_SUBJECT={VAPID_SUBJECT}")