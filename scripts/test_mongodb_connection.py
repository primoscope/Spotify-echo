#!/usr/bin/env python3
"""
MongoDB Connection Test Script for EchoTune AI
Tests MongoDB connectivity and validates environment configuration
"""

import os
import sys
import logging
from typing import Dict, Optional
import pymongo
from pymongo import MongoClient
from datetime import datetime, timezone
import argparse

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    logger.warning("python-dotenv not installed. Environment variables must be set manually.")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MongoDBConnectionTester:
    """Tests MongoDB connection and performs basic operations"""
    
    def __init__(self, mongodb_uri: str = None, database_name: str = None, collection_name: str = None):
        self.mongodb_uri = mongodb_uri or os.getenv('MONGODB_URI')
        self.database_name = database_name or os.getenv('MONGODB_DATABASE', 'spotify_analytics')
        self.collection_name = collection_name or os.getenv('MONGODB_COLLECTION', 'listening_history')
        
        self.client = None
        self.db = None
        self.collection = None
    
    def test_connection(self) -> Dict[str, any]:
        """Test MongoDB connection and return detailed results"""
        results = {
            'success': False,
            'connection_uri_provided': bool(self.mongodb_uri),
            'connection_established': False,
            'database_accessible': False,
            'collection_accessible': False,
            'server_info': None,
            'database_stats': None,
            'error': None,
            'test_timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # Check if URI is provided
            if not self.mongodb_uri:
                results['error'] = "MongoDB URI not provided. Set MONGODB_URI environment variable."
                return results
            
            # Mask sensitive info in logs
            uri_display = self.mongodb_uri.replace(self.mongodb_uri.split('@')[0].split('://')[1], "***:***") if '@' in self.mongodb_uri else self.mongodb_uri
            logger.info(f"Testing connection to: {uri_display}")
            logger.info(f"Database: {self.database_name}")
            logger.info(f"Collection: {self.collection_name}")
            
            # Test basic connection
            logger.info("Establishing MongoDB connection...")
            self.client = MongoClient(self.mongodb_uri, serverSelectionTimeoutMS=5000)
            
            # Test server connection
            logger.info("Testing server connectivity...")
            server_info = self.client.admin.command('ismaster')
            results['connection_established'] = True
            results['server_info'] = {
                'mongodb_version': server_info.get('maxWireVersion'),
                'is_master': server_info.get('ismaster'),
                'server_time': datetime.now(timezone.utc).isoformat()
            }
            
            # Test database access
            logger.info("Testing database access...")
            self.db = self.client[self.database_name]
            
            # List collections to verify database access
            collections = self.db.list_collection_names()
            results['database_accessible'] = True
            
            # Test collection access
            logger.info("Testing collection access...")
            self.collection = self.db[self.collection_name]
            
            # Get collection stats if collection exists
            if self.collection_name in collections:
                try:
                    collection_stats = self.db.command("collStats", self.collection_name)
                    results['database_stats'] = {
                        'collection_exists': True,
                        'document_count': collection_stats.get('count', 0),
                        'storage_size_mb': collection_stats.get('storageSize', 0) / (1024*1024),
                        'index_size_mb': collection_stats.get('totalIndexSize', 0) / (1024*1024),
                        'avg_document_size': collection_stats.get('avgObjSize', 0)
                    }
                except Exception as e:
                    logger.warning(f"Could not retrieve collection stats: {e}")
                    results['database_stats'] = {'collection_exists': True, 'stats_error': str(e)}
            else:
                results['database_stats'] = {
                    'collection_exists': False,
                    'available_collections': collections[:10]  # Limit output
                }
            
            results['collection_accessible'] = True
            results['success'] = True
            
            logger.info("✅ MongoDB connection test successful!")
            
        except pymongo.errors.ServerSelectionTimeoutError as e:
            error_msg = f"Connection timeout - cannot reach MongoDB server: {e}"
            logger.error(f"❌ {error_msg}")
            results['error'] = error_msg
            
        except pymongo.errors.ConfigurationError as e:
            error_msg = f"Configuration error in MongoDB URI: {e}"
            logger.error(f"❌ {error_msg}")
            results['error'] = error_msg
            
        except pymongo.errors.OperationFailure as e:
            error_msg = f"Authentication or operation failed: {e}"
            logger.error(f"❌ {error_msg}")
            results['error'] = error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error during MongoDB connection test: {e}"
            logger.error(f"❌ {error_msg}")
            results['error'] = error_msg
            
        finally:
            self.disconnect()
            
        return results
    
    def test_basic_operations(self) -> Dict[str, any]:
        """Test basic MongoDB operations (insert, find, delete)"""
        if not self.mongodb_uri:
            return {'success': False, 'error': 'MongoDB URI not provided'}
        
        results = {
            'success': False,
            'insert_test': False,
            'find_test': False,
            'delete_test': False,
            'error': None
        }
        
        try:
            self.client = MongoClient(self.mongodb_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.database_name]
            test_collection = self.db['test_connection']
            
            # Test document
            test_doc = {
                '_id': 'test_mongodb_connection',
                'test_type': 'connection_test',
                'timestamp': datetime.now(timezone.utc),
                'message': 'This is a test document for MongoDB connection validation'
            }
            
            # Test insert
            logger.info("Testing insert operation...")
            test_collection.insert_one(test_doc)
            results['insert_test'] = True
            
            # Test find
            logger.info("Testing find operation...")
            found_doc = test_collection.find_one({'_id': 'test_mongodb_connection'})
            if found_doc:
                results['find_test'] = True
            
            # Test delete (cleanup)
            logger.info("Testing delete operation...")
            delete_result = test_collection.delete_one({'_id': 'test_mongodb_connection'})
            if delete_result.deleted_count > 0:
                results['delete_test'] = True
            
            results['success'] = all([results['insert_test'], results['find_test'], results['delete_test']])
            
            if results['success']:
                logger.info("✅ MongoDB basic operations test successful!")
            else:
                logger.warning("⚠️ Some MongoDB operations failed")
                
        except Exception as e:
            error_msg = f"Error during basic operations test: {e}"
            logger.error(f"❌ {error_msg}")
            results['error'] = error_msg
            
        finally:
            self.disconnect()
            
        return results
    
    def disconnect(self):
        """Safely disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            self.collection = None
    
    def generate_report(self, connection_results: Dict, operations_results: Dict = None):
        """Generate a comprehensive test report"""
        print("\n" + "="*70)
        print("MONGODB CONNECTION TEST REPORT")
        print("="*70)
        
        # Connection Test Results
        print(f"Timestamp: {connection_results['test_timestamp']}")
        print(f"Database: {self.database_name}")
        print(f"Collection: {self.collection_name}")
        print()
        
        print("CONNECTION TEST:")
        print(f"  ✅ URI Provided: {'Yes' if connection_results['connection_uri_provided'] else '❌ No'}")
        print(f"  ✅ Connection: {'Successful' if connection_results['connection_established'] else '❌ Failed'}")
        print(f"  ✅ Database Access: {'Successful' if connection_results['database_accessible'] else '❌ Failed'}")
        print(f"  ✅ Collection Access: {'Successful' if connection_results['collection_accessible'] else '❌ Failed'}")
        
        if connection_results['server_info']:
            print(f"\nSERVER INFO:")
            print(f"  MongoDB Version: {connection_results['server_info'].get('mongodb_version', 'Unknown')}")
            print(f"  Is Master: {connection_results['server_info'].get('is_master', 'Unknown')}")
        
        if connection_results['database_stats']:
            stats = connection_results['database_stats']
            print(f"\nDATABASE STATS:")
            print(f"  Collection Exists: {'Yes' if stats.get('collection_exists') else 'No'}")
            if stats.get('collection_exists'):
                print(f"  Document Count: {stats.get('document_count', 0):,}")
                print(f"  Storage Size: {stats.get('storage_size_mb', 0):.2f} MB")
                print(f"  Index Size: {stats.get('index_size_mb', 0):.2f} MB")
                print(f"  Avg Document Size: {stats.get('avg_document_size', 0):.0f} bytes")
            else:
                collections = stats.get('available_collections', [])
                if collections:
                    print(f"  Available Collections: {', '.join(collections[:5])}")
                    if len(collections) > 5:
                        print(f"    ... and {len(collections) - 5} more")
        
        # Operations Test Results
        if operations_results:
            print(f"\nOPERATIONS TEST:")
            print(f"  ✅ Insert: {'Successful' if operations_results['insert_test'] else '❌ Failed'}")
            print(f"  ✅ Find: {'Successful' if operations_results['find_test'] else '❌ Failed'}")
            print(f"  ✅ Delete: {'Successful' if operations_results['delete_test'] else '❌ Failed'}")
        
        # Overall Status
        print(f"\nOVERALL STATUS:")
        connection_success = connection_results['success']
        operations_success = operations_results['success'] if operations_results else True
        overall_success = connection_success and operations_success
        
        if overall_success:
            print("  🎉 All tests passed! MongoDB is ready for use.")
        else:
            print("  ⚠️ Some tests failed. Check configuration and try again.")
        
        # Error Information
        if connection_results.get('error'):
            print(f"\nERROR DETAILS:")
            print(f"  {connection_results['error']}")
        
        if operations_results and operations_results.get('error'):
            print(f"  {operations_results['error']}")
        
        print("\n" + "="*70)
        
        return overall_success

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Test MongoDB connection for EchoTune AI')
    parser.add_argument('--uri', help='MongoDB connection URI (or set MONGODB_URI env var)')
    parser.add_argument('--database', '-d', help='Database name (default: spotify_analytics)')
    parser.add_argument('--collection', '-c', help='Collection name (default: listening_history)')
    parser.add_argument('--operations', '-o', action='store_true',
                       help='Also test basic operations (insert, find, delete)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize tester
    tester = MongoDBConnectionTester(
        mongodb_uri=args.uri,
        database_name=args.database,
        collection_name=args.collection
    )
    
    try:
        # Test connection
        connection_results = tester.test_connection()
        
        # Test operations if requested and connection succeeded
        operations_results = None
        if args.operations and connection_results['success']:
            operations_results = tester.test_basic_operations()
        
        # Generate report
        success = tester.generate_report(connection_results, operations_results)
        
        return 0 if success else 1
        
    except Exception as e:
        logger.error(f"Test script failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())