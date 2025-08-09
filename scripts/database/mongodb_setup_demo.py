#!/usr/bin/env python3
"""
MongoDB Setup Guide for EchoTune AI
Demonstrates the complete setup process using environment variables

IMPORTANT: This script has been sanitized - hardcoded credentials removed.
Configure your MongoDB connection using environment variables in .env file.
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Import shared MongoDB utilities
try:
    from mongodb_utils import get_sample_document_json_structure
except ImportError:
    # Fallback if mongodb_utils is not available
    def get_sample_document_json_structure():
        return """{
  "_id": "unique_identifier",
  "spotify_track_uri": "spotify:track:...",
  "timestamp": "2010-05-03 09:14:32",
  "user": {
    "username": "user_name",
    "platform": "platform_info",
    "country": "country_code"
  },
  "track": {
    "name": "Track Name",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration_ms": 210000,
    "popularity": 75
  },
  "listening": {
    "ms_played": 180000,
    "skipped": false,
    "completion_rate": 0.857
  },
  "audio_features": {
    "danceability": 0.7,
    "energy": 0.8,
    "valence": 0.6,
    "tempo": 120.0
  },
  "metadata": {
    "explicit": false,
    "created_at": "timestamp"
  }
}"""

# Load environment variables
load_dotenv()

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f" {title}")
    print("="*70)

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n🔸 Step {step_num}: {description}")
    print("-" * 50)

def main():
    print_header("MONGODB CONNECTION SETUP - ECHOTUNE AI")
    
    print("""
This guide demonstrates the MongoDB setup process for the EchoTune AI 
Spotify recommendation system using environment variables.

SECURITY NOTE: 
Previous versions of this script contained hardcoded credentials.
All credentials have been removed and must now be configured via environment variables.

Required Environment Variables:
- MONGODB_URI: Full MongoDB connection string
- MONGODB_DATABASE: Database name (default: echotune)
- MONGODB_COLLECTION: Collection name (default: listening_history)

Example .env configuration:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
MONGODB_DATABASE=echotune
MONGODB_COLLECTION=listening_history
""")
    
    print_step(1, "Checking Environment Configuration")
    
    mongodb_uri = os.getenv('MONGODB_URI')
    database_name = os.getenv('MONGODB_DATABASE', 'echotune')
    collection_name = os.getenv('MONGODB_COLLECTION', 'listening_history')
    
    if not mongodb_uri:
        print("❌ ERROR: MONGODB_URI environment variable not set")
        print("\nPlease configure your .env file with:")
        print("MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database")
        print("\nFor security reasons, credentials should NEVER be hardcoded in scripts.")
        return
    
    # Mask credentials in URI for display
    display_uri = mongodb_uri
    if '@' in display_uri:
        # Hide credentials for security
        parts = display_uri.split('@')
        if len(parts) >= 2:
            scheme_and_creds = parts[0]
            if '://' in scheme_and_creds:
                scheme = scheme_and_creds.split('://')[0]
                display_uri = f"{scheme}://***:***@{'@'.join(parts[1:])}"
    
    print(f"✅ MongoDB URI configured: {display_uri}")
    print(f"✅ Database: {database_name}")
    print(f"✅ Collection: {collection_name}")
    
    print_step(2, "Testing MongoDB Connection")
    print("Running connection test...")
    
    try:
        # Test connection without exposing credentials
        from pymongo import MongoClient
        
        client = MongoClient(mongodb_uri)
        db = client[database_name]
        collection = db[collection_name]
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Get basic statistics
        count = collection.count_documents({})
        print(f"✅ Total documents in {collection_name}: {count:,}")
        
        if count > 0:
            users = collection.distinct("user.username")
            tracks = collection.distinct("spotify_track_uri")
            print(f"✅ Unique users: {len(users):,}")
            print(f"✅ Unique tracks: {len(tracks):,}")
            
            # Show indexes
            indexes = list(collection.list_indexes())
            print(f"✅ Database indexes: {len(indexes)} created")
            
            # Show sample document (without sensitive data)
            sample = collection.find_one()
            if sample:
                print(f"✅ Sample document ID: {sample.get('_id', 'N/A')}")
                track_info = sample.get('track', {})
                print(f"✅ Sample track: {track_info.get('name', 'N/A')} by {track_info.get('artist', 'N/A')}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        print("Please check your MONGODB_URI configuration.")
        return
    
    print_step(3, "Available Commands")
    print("""
Key scripts and commands available:

1. Test MongoDB Connection:
   python scripts/database/test_mongodb_connection.py

2. Migrate CSV Data to MongoDB:
   python scripts/database/migrate_to_mongodb.py --input data/spotify_listening_history_combined.csv

3. Migrate with custom options:
   python scripts/database/migrate_to_mongodb.py --input <file> --batch-size 1000 --update

4. Environment Variables (in .env):
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?options
   MONGODB_DATABASE=echotune
   MONGODB_COLLECTION=listening_history
""")
    
    print_step(4, "Production Migration")
    print("""
For production migration of the full dataset:

1. Ensure your MongoDB URI is configured in .env
2. The full CSV file should be available at: data/spotify_listening_history_combined.csv
3. Migration command:
   python scripts/database/migrate_to_mongodb.py --input data/spotify_listening_history_combined.csv --batch-size 1000

Note: Migration time depends on dataset size and network connectivity.
""")
    
    print_step(5, "Database Schema")
    print("""
The MongoDB collection uses the following document structure:
""")
    print(get_sample_document_json_structure())
    
    print_header("SETUP GUIDE COMPLETE")
    print("""
✅ Environment variable configuration checked
✅ MongoDB connection tested (if properly configured)  
✅ Database schema documented
✅ Migration commands provided

SECURITY REMINDERS:
🔒 Never commit credentials to version control
🔒 Use environment variables for sensitive configuration
🔒 Regularly rotate database passwords
🔒 Use least-privilege database user accounts

The MongoDB setup guide is complete. Ensure all environment variables
are properly configured for your deployment environment.
""")

if __name__ == "__main__":
    main()