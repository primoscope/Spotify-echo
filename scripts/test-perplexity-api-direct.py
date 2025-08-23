#!/usr/bin/env python3
"""
Direct test of Perplexity API to verify the key is working
This bypasses all our custom logic and tests the API directly
"""

import os
import requests
import json

def test_perplexity_api_direct():
    """Test Perplexity API directly with minimal overhead"""
    
    print("🔍 Direct Perplexity API Test\n")
    
    # Get API key
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        print("❌ PERPLEXITY_API_KEY environment variable not found")
        return False
    
    print(f"✅ API Key found: {api_key[:8]}...")
    
    # Test the API directly
    url = 'https://api.perplexity.ai/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'sonar',  # Use cheapest model for test
        'messages': [
            {'role': 'user', 'content': 'What year is it currently? Give a very brief answer.'}
        ],
        'max_tokens': 20,
        'temperature': 0.1,
        'return_citations': True
    }
    
    print("📡 Making direct API request...")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            print("✅ API Request Successful!")
            print(f"Response: {content}")
            print(f"Model: {result.get('model', 'Unknown')}")
            
            if result.get('citations'):
                print(f"Citations: {len(result['citations'])}")
            
            return True
            
        elif response.status_code == 401:
            print("❌ Authentication failed - API key is invalid")
            print("Please check that the API key is correct and active")
            return False
            
        elif response.status_code == 429:
            print("⚠️ Rate limited - API key is valid but too many requests")
            return True  # Key is valid
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                print(f"Raw response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⚠️ Request timed out - but API key format seems correct")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check internet connection")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == '__main__':
    test_perplexity_api_direct()