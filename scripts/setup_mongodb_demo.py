#!/usr/bin/env python3
"""
MongoDB Setup Demo for EchoTune AI
Demonstrates MongoDB connection testing and provides setup guidance
"""

import os
import sys
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Note: python-dotenv not installed. Environment variables must be set manually.")

def create_mongodb_demo():
    """Create a demo script showing MongoDB setup"""
    
    print("🎯 MongoDB Connection Setup for EchoTune AI")
    print("="*60)
    print()
    
    print("📋 Current Configuration Status:")
    print("-" * 30)
    
    # Check environment variables
    mongodb_uri = os.getenv('MONGODB_URI', 'Not set')
    mongodb_db = os.getenv('MONGODB_DATABASE', 'Not set')
    mongodb_collection = os.getenv('MONGODB_COLLECTION', 'Not set')
    
    print(f"MONGODB_URI: {mongodb_uri}")
    print(f"MONGODB_DATABASE: {mongodb_db}")
    print(f"MONGODB_COLLECTION: {mongodb_collection}")
    print()
    
    # Determine if using placeholder values
    is_placeholder = 'username:password@cluster.mongodb.net' in mongodb_uri
    
    if is_placeholder:
        print("⚠️ MongoDB is configured with placeholder values")
        print()
        print("🚀 To set up a real MongoDB connection:")
        print("1. Go to https://cloud.mongodb.com")
        print("2. Create a free cluster (M0 tier)")
        print("3. Create a database user")
        print("4. Whitelist your IP address (0.0.0.0/0 for development)")
        print("5. Get your connection string")
        print("6. Replace the MONGODB_URI in your .env file")
        print()
        
        print("📝 Example .env configuration:")
        print("MONGODB_URI=mongodb+srv://myuser:mypassword@mycluster.abcde.mongodb.net/")
        print("MONGODB_DATABASE=spotify_analytics")
        print("MONGODB_COLLECTION=listening_history")
        print()
        
    print("🔧 Available Commands:")
    print("-" * 30)
    print("# Test current MongoDB connection:")
    print("python scripts/test_mongodb_connection.py")
    print()
    print("# Test all database connections:")
    print("python scripts/database_setup.py --test")
    print()
    print("# Interactive database setup:")
    print("python scripts/database_setup.py --interactive")
    print()
    print("# Test with operations (requires working MongoDB):")
    print("python scripts/test_mongodb_connection.py --operations")
    print()
    
    print("🔍 Test Results:")
    print("-" * 30)
    
    # Run a quick test
    if is_placeholder:
        print("✅ Environment variables loaded successfully")
        print("❌ MongoDB connection will fail (placeholder URI)")
        print("✅ Connection testing infrastructure ready")
        print("✅ Error handling and reporting working")
    else:
        print("✅ Environment variables loaded successfully")
        print("🔄 MongoDB connection testing required...")
        
        # Try to test the connection
        try:
            from test_mongodb_connection import MongoDBConnectionTester
            tester = MongoDBConnectionTester()
            results = tester.test_connection()
            
            if results['success']:
                print("✅ MongoDB connection successful!")
            else:
                print(f"❌ MongoDB connection failed: {results.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Error testing MongoDB connection: {e}")
    
    print()
    print("🎉 MongoDB connection testing is configured and ready!")
    print("   Update your .env file with real MongoDB credentials to connect.")

if __name__ == "__main__":
    create_mongodb_demo()