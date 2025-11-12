"""
N8N API Key Checker

This script helps diagnose N8N API key issues and provides instructions
for obtaining a new API key if needed.
"""

import os
import json
import base64
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def decode_jwt_payload(token):
    """Decode JWT token payload without verification"""
    try:
        # Split the token
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode the payload (middle part)
        payload = parts[1]
        
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        # Decode base64
        decoded_bytes = base64.urlsafe_b64decode(payload)
        decoded_json = json.loads(decoded_bytes)
        
        return decoded_json
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None

def check_api_key():
    """Check N8N API key status"""
    print("="*70)
    print("  N8N API Key Diagnostic Tool")
    print("="*70)
    
    api_key = os.getenv("N8N_API_KEY")
    api_url = os.getenv("N8N_API_URL", "https://n8n.casamccartney.link")
    
    print(f"\nConfiguration:")
    print(f"  N8N_API_URL: {api_url}")
    print(f"  N8N_API_KEY: {'SET' if api_key else 'NOT SET'}")
    
    if not api_key:
        print("\n❌ N8N_API_KEY is not set in environment!")
        print("\n📝 To fix this:")
        print("   1. Log in to your n8n instance at:", api_url)
        print("   2. Go to Settings → API")
        print("   3. Create a new API key")
        print("   4. Add it to your .env file:")
        print("      N8N_API_KEY=your-api-key-here")
        return False
    
    print(f"\n  API Key (first 20 chars): {api_key[:20]}...")
    
    # Try to decode the JWT token
    try:
        # Decode without verification to inspect the token
        decoded = decode_jwt_payload(api_key)
        
        if not decoded:
            print(f"\n❌ Could not decode API key as JWT")
            print(f"\n📝 This might be an invalid or old-style API key. Try:")
            print(f"   1. Log in to: {api_url}")
            print(f"   2. Go to Settings → API")
            print(f"   3. Create a new API key")
            print(f"   4. Update your .env file with the new key")
            return False
        
        print(f"\n✅ API Key is a valid JWT token")
        print(f"\nToken Details:")
        print(f"  Subject (sub): {decoded.get('sub', 'N/A')}")
        print(f"  Issuer (iss): {decoded.get('iss', 'N/A')}")
        print(f"  Audience (aud): {decoded.get('aud', 'N/A')}")
        
        # Check issued at
        if 'iat' in decoded:
            issued_at = datetime.fromtimestamp(decoded['iat'])
            print(f"  Issued At: {issued_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check expiration
        if 'exp' in decoded:
            exp_timestamp = decoded['exp']
            exp_date = datetime.fromtimestamp(exp_timestamp)
            now = datetime.now()
            
            print(f"  Expires At: {exp_date.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if now > exp_date:
                print(f"\n❌ API Key has EXPIRED!")
                print(f"   Expired on: {exp_date.strftime('%Y-%m-%d')}")
                print(f"   Current date: {now.strftime('%Y-%m-%d')}")
                print(f"\n📝 You need to generate a new API key:")
                print(f"   1. Log in to: {api_url}")
                print(f"   2. Go to Settings → API")
                print(f"   3. Delete the old key")
                print(f"   4. Create a new API key")
                print(f"   5. Update your .env file with the new key")
                return False
            else:
                days_left = (exp_date - now).days
                print(f"  Status: ✅ Valid (expires in {days_left} days)")
                
                if days_left < 7:
                    print(f"\n⚠️  Warning: API key expires in {days_left} days!")
                    print(f"   Consider generating a new key soon")
                
                return True
        else:
            print(f"\n⚠️  Token has no expiration date")
            return True
            
    except Exception as e:
        print(f"\n❌ Error decoding API key: {e}")
        print(f"\n📝 Try generating a new API key:")
        print(f"   1. Log in to: {api_url}")
        print(f"   2. Go to Settings → API")
        print(f"   3. Create a new API key")
        print(f"   4. Update your .env file with the new key")
        return False

if __name__ == "__main__":
    is_valid = check_api_key()
    
    print("\n" + "="*70)
    if is_valid:
        print("  ✅ Your N8N API key is valid and ready to use!")
    else:
        print("  ❌ Your N8N API key needs to be updated")
    print("="*70)

