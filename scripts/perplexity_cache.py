#!/usr/bin/env python3
"""
Perplexity API Caching System

Provides intelligent caching for Perplexity API responses to reduce costs
and improve performance. Uses content-based cache keys and configurable
expiration policies.

Key Features:
- Content-based cache key generation using issue title, body, and labels
- File-based caching with compression support
- Configurable expiration (14-day default)
- Cache cleanup and maintenance
- Similarity-based deduplication
"""

import hashlib
import json
import gzip
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import yaml
import argparse
import re


class PerplexityCacheManager:
    """Manages Perplexity API response caching with intelligent key generation."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize cache manager with configuration."""
        self.config_path = config_path or '.github/perplexity-config.yml'
        self.config = self._load_config()
        
        # Set up cache directory
        cache_config = self.config.get('caching', {})
        self.cache_dir = Path(cache_config.get('dir', '.perplexity/cache'))
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache settings
        self.max_age_days = cache_config.get('max_age_days', 14)
        self.max_cache_size_mb = cache_config.get('max_cache_size_mb', 100)
        self.compression = cache_config.get('compression', True)
        self.enabled = cache_config.get('enabled', True)
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML file."""
        try:
            config_file = Path(self.config_path)
            if not config_file.exists():
                # Return default config if file doesn't exist
                return {
                    'caching': {
                        'enabled': True,
                        'dir': '.perplexity/cache',
                        'max_age_days': 14,
                        'max_cache_size_mb': 100,
                        'compression': True
                    }
                }
            
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            print(f"❌ Error loading configuration: {e}", file=sys.stderr)
            return {}
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for consistent cache key generation.
        
        Args:
            text: Input text to normalize
            
        Returns:
            Normalized text
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common markdown syntax that doesn't affect meaning
        text = re.sub(r'[*_`]+', '', text)
        
        # Remove URLs (they may change without affecting content meaning)
        text = re.sub(r'https?://[^\s]+', '<url>', text)
        
        # Normalize common issue number references
        text = re.sub(r'#\d+', '#<issue>', text)
        
        return text
    
    def _extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """
        Extract key terms from text for cache key generation.
        
        Args:
            text: Input text
            max_keywords: Maximum number of keywords to extract
            
        Returns:
            List of key terms
        """
        if not text:
            return []
        
        # Normalize text
        text = self._normalize_text(text)
        
        # Define stop words to filter out
        stop_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
            'those', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'can', 'must', 'shall', 'a', 'an', 'i', 'you', 'he', 'she', 'it', 'we',
            'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
            'its', 'our', 'their', 'please', 'thanks', 'hello', 'hi'
        }
        
        # Extract words (alphanumeric sequences)
        words = re.findall(r'\b[a-z][a-z0-9_]*\b', text)
        
        # Filter stop words and short words
        keywords = [
            word for word in words 
            if word not in stop_words and len(word) > 2
        ]
        
        # Count word frequencies
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:max_keywords]]
    
    def get_cache_key(self, 
                     title: str, 
                     body: str, 
                     labels: Optional[List[str]] = None,
                     context: Optional[Dict] = None) -> str:
        """
        Generate cache key from issue/content data.
        
        Args:
            title: Issue or content title
            body: Issue body or content text
            labels: List of labels (optional)
            context: Additional context for cache key (optional)
            
        Returns:
            Cache key string
        """
        if not self.enabled:
            return None
        
        try:
            # Normalize inputs
            title_norm = self._normalize_text(title or "")
            body_norm = self._normalize_text(body or "")
            labels_norm = sorted([self._normalize_text(label) for label in (labels or [])])
            
            # Extract keywords from title and body
            title_keywords = self._extract_keywords(title_norm, 5)
            body_keywords = self._extract_keywords(body_norm, 10)
            
            # Combine all elements for cache key
            cache_elements = {
                'title_keywords': title_keywords,
                'body_keywords': body_keywords[:15],  # Limit body keywords
                'labels': labels_norm,
                'context': context or {}
            }
            
            # Create deterministic cache key
            cache_string = json.dumps(cache_elements, sort_keys=True, separators=(',', ':'))
            cache_hash = hashlib.sha256(cache_string.encode()).hexdigest()
            
            return f"perplexity_{cache_hash[:16]}"
            
        except Exception as e:
            print(f"❌ Error generating cache key: {e}", file=sys.stderr)
            return None
    
    def _get_cache_file_path(self, cache_key: str) -> Path:
        """Get file path for cache key."""
        extension = '.json.gz' if self.compression else '.json'
        return self.cache_dir / f"{cache_key}{extension}"
    
    def read_cache(self, cache_key: str) -> Optional[Dict]:
        """
        Read cached data for given cache key.
        
        Args:
            cache_key: Cache key to look up
            
        Returns:
            Cached data or None if not found/expired
        """
        if not self.enabled or not cache_key:
            return None
        
        try:
            cache_file = self._get_cache_file_path(cache_key)
            
            if not cache_file.exists():
                return None
            
            # Check if cache file is expired
            file_age = datetime.now(timezone.utc) - datetime.fromtimestamp(
                cache_file.stat().st_mtime, timezone.utc
            )
            
            if file_age > timedelta(days=self.max_age_days):
                # Remove expired cache file
                try:
                    cache_file.unlink()
                except:
                    pass
                return None
            
            # Read cache file
            if self.compression and cache_file.suffix == '.gz':
                with gzip.open(cache_file, 'rt', encoding='utf-8') as f:
                    cache_data = json.load(f)
            else:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
            
            # Validate cache data structure
            if not isinstance(cache_data, dict) or 'data' not in cache_data:
                return None
            
            # Update access time in metadata
            cache_data['metadata']['last_accessed'] = datetime.now(timezone.utc).isoformat()
            cache_data['metadata']['access_count'] = cache_data['metadata'].get('access_count', 0) + 1
            
            return cache_data
            
        except Exception as e:
            print(f"❌ Error reading cache: {e}", file=sys.stderr)
            return None
    
    def write_cache(self, 
                   cache_key: str, 
                   data: Any, 
                   metadata: Optional[Dict] = None) -> bool:
        """
        Write data to cache.
        
        Args:
            cache_key: Cache key
            data: Data to cache
            metadata: Additional metadata
            
        Returns:
            True if successfully cached
        """
        if not self.enabled or not cache_key:
            return False
        
        try:
            # Create cache entry
            cache_entry = {
                'data': data,
                'metadata': {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'cache_key': cache_key,
                    'access_count': 1,
                    'last_accessed': datetime.now(timezone.utc).isoformat(),
                    **(metadata or {})
                }
            }
            
            # Write to cache file
            cache_file = self._get_cache_file_path(cache_key)
            
            if self.compression:
                with gzip.open(cache_file, 'wt', encoding='utf-8') as f:
                    json.dump(cache_entry, f, separators=(',', ':'))
            else:
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(cache_entry, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"❌ Error writing cache: {e}", file=sys.stderr)
            return False
    
    def cleanup_cache(self, force: bool = False) -> Dict[str, int]:
        """
        Clean up expired cache files and enforce size limits.
        
        Args:
            force: Force cleanup even if cache is under size limit
            
        Returns:
            Dictionary with cleanup statistics
        """
        if not self.enabled:
            return {'removed_expired': 0, 'removed_size': 0, 'total_files': 0}
        
        try:
            stats = {'removed_expired': 0, 'removed_size': 0, 'total_files': 0}
            
            # Get all cache files with their stats
            cache_files = []
            total_size_mb = 0
            
            for cache_file in self.cache_dir.glob('perplexity_*.json*'):
                try:
                    stat = cache_file.stat()
                    file_size_mb = stat.st_size / (1024 * 1024)
                    file_age = datetime.now(timezone.utc) - datetime.fromtimestamp(
                        stat.st_mtime, timezone.utc
                    )
                    
                    cache_files.append({
                        'path': cache_file,
                        'size_mb': file_size_mb,
                        'age': file_age,
                        'mtime': stat.st_mtime
                    })
                    
                    total_size_mb += file_size_mb
                    
                except Exception:
                    continue
            
            stats['total_files'] = len(cache_files)
            
            # Remove expired files
            expired_cutoff = timedelta(days=self.max_age_days)
            for file_info in cache_files[:]:  # Copy list to allow modification
                if file_info['age'] > expired_cutoff:
                    try:
                        file_info['path'].unlink()
                        cache_files.remove(file_info)
                        total_size_mb -= file_info['size_mb']
                        stats['removed_expired'] += 1
                    except Exception:
                        continue
            
            # Enforce size limits if necessary
            if force or total_size_mb > self.max_cache_size_mb:
                # Sort by last modified time (oldest first)
                cache_files.sort(key=lambda x: x['mtime'])
                
                # Remove oldest files until under size limit
                while cache_files and total_size_mb > self.max_cache_size_mb:
                    file_info = cache_files.pop(0)
                    try:
                        file_info['path'].unlink()
                        total_size_mb -= file_info['size_mb']
                        stats['removed_size'] += 1
                    except Exception:
                        continue
            
            return stats
            
        except Exception as e:
            print(f"❌ Error during cache cleanup: {e}", file=sys.stderr)
            return {'error': str(e)}
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics."""
        if not self.enabled:
            return {'enabled': False}
        
        try:
            cache_files = list(self.cache_dir.glob('perplexity_*.json*'))
            total_size = sum(f.stat().st_size for f in cache_files if f.exists())
            total_size_mb = total_size / (1024 * 1024)
            
            # Count expired files
            expired_count = 0
            expired_cutoff = timedelta(days=self.max_age_days)
            current_time = datetime.now(timezone.utc)
            
            for cache_file in cache_files:
                try:
                    file_age = current_time - datetime.fromtimestamp(
                        cache_file.stat().st_mtime, timezone.utc
                    )
                    if file_age > expired_cutoff:
                        expired_count += 1
                except Exception:
                    continue
            
            return {
                'enabled': True,
                'total_files': len(cache_files),
                'total_size_mb': round(total_size_mb, 2),
                'max_size_mb': self.max_cache_size_mb,
                'expired_files': expired_count,
                'max_age_days': self.max_age_days,
                'cache_dir': str(self.cache_dir),
                'compression': self.compression
            }
            
        except Exception as e:
            return {'enabled': True, 'error': str(e)}


def main():
    """Command line interface for cache management."""
    parser = argparse.ArgumentParser(description='Perplexity Cache Management')
    parser.add_argument('--config', help='Path to configuration file')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Generate cache key command
    key_parser = subparsers.add_parser('key', help='Generate cache key')
    key_parser.add_argument('--title', required=True, help='Issue title')
    key_parser.add_argument('--body', help='Issue body')
    key_parser.add_argument('--labels', nargs='*', help='Issue labels')
    
    # Read cache command
    read_parser = subparsers.add_parser('read', help='Read from cache')
    read_parser.add_argument('cache_key', help='Cache key to read')
    
    # Write cache command
    write_parser = subparsers.add_parser('write', help='Write to cache')
    write_parser.add_argument('cache_key', help='Cache key')
    write_parser.add_argument('--data-file', help='File containing data to cache')
    write_parser.add_argument('--model', help='Model used')
    write_parser.add_argument('--cost', type=float, help='Estimated cost')
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean cache')
    cleanup_parser.add_argument('--force', action='store_true', help='Force cleanup')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show cache statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize cache manager
    cache_manager = PerplexityCacheManager(args.config)
    
    try:
        if args.command == 'key':
            cache_key = cache_manager.get_cache_key(
                args.title, 
                args.body or "", 
                args.labels or []
            )
            print(json.dumps({
                'cache_key': cache_key,
                'title': args.title,
                'labels': args.labels or []
            }, indent=2))
        
        elif args.command == 'read':
            cache_data = cache_manager.read_cache(args.cache_key)
            if cache_data:
                print(json.dumps(cache_data, indent=2))
            else:
                print(json.dumps({'cache_key': args.cache_key, 'found': False}))
                sys.exit(1)
        
        elif args.command == 'write':
            data_to_cache = {}
            if args.data_file and Path(args.data_file).exists():
                with open(args.data_file, 'r') as f:
                    data_to_cache = json.load(f)
            
            metadata = {}
            if args.model:
                metadata['model'] = args.model
            if args.cost is not None:
                metadata['cost'] = args.cost
            
            success = cache_manager.write_cache(args.cache_key, data_to_cache, metadata)
            print(json.dumps({
                'cache_key': args.cache_key,
                'success': success
            }, indent=2))
        
        elif args.command == 'cleanup':
            stats = cache_manager.cleanup_cache(args.force)
            print(json.dumps(stats, indent=2))
        
        elif args.command == 'stats':
            stats = cache_manager.get_cache_stats()
            print(json.dumps(stats, indent=2))
        
    except Exception as e:
        print(f"❌ Command failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()