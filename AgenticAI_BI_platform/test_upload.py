#!/usr/bin/env python3
"""
Test script for document upload functionality
Run this script to test the file upload endpoints locally
"""

import requests
import os
import json
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_FILE_PATH = "test_document.txt"

def create_test_file():
    """Create a test file for uploading"""
    test_content = """
# Test Document

This is a test document for the Agentic AI BI Platform.

## Features Tested
- File upload functionality
- Text extraction
- Document metadata storage
- API endpoint responses

## Test Data
- Document Type: Test Document
- Category: Testing
- Tags: test, upload, verification
- Content: Sample text content

This document should be processed successfully by the upload system.
    """.strip()
    
    with open(TEST_FILE_PATH, 'w') as f:
        f.write(test_content)
    
    print(f"✅ Created test file: {TEST_FILE_PATH}")

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/upload/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_file_upload():
    """Test file upload functionality"""
    if not os.path.exists(TEST_FILE_PATH):
        create_test_file()
    
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (TEST_FILE_PATH, f, 'text/plain')}
            data = {
                'document_type': 'business_problem',
                'category': 'testing',
                'tags': 'test,upload,verification',
                'user_id': 'test-user'
            }
            
            response = requests.post(f"{BASE_URL}/api/upload/document", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ File upload successful!")
                print(f"   File ID: {result['document']['file_id']}")
                print(f"   Original Filename: {result['document']['original_filename']}")
                print(f"   File Size: {result['document']['file_size']} bytes")
                return result['document']['file_id']
            else:
                print(f"❌ File upload failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ File upload error: {e}")
        return None

def test_list_documents():
    """Test listing uploaded documents"""
    try:
        response = requests.get(f"{BASE_URL}/api/upload/documents")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Document list retrieved: {data['total']} documents")
            return data['documents']
        else:
            print(f"❌ Document list failed: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Document list error: {e}")
        return []

def test_get_document(file_id):
    """Test getting document details"""
    try:
        response = requests.get(f"{BASE_URL}/api/upload/documents/{file_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Document details retrieved")
            print(f"   Title: {data['document']['original_filename']}")
            print(f"   Content Preview: {data['document']['extracted_text'][:100]}...")
            return True
        else:
            print(f"❌ Document details failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Document details error: {e}")
        return False

def test_download_document(file_id):
    """Test downloading document"""
    try:
        response = requests.get(f"{BASE_URL}/api/upload/documents/{file_id}/download")
        if response.status_code == 200:
            print(f"✅ Document download successful")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Content-Length: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ Document download failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Document download error: {e}")
        return False

def cleanup():
    """Clean up test files"""
    if os.path.exists(TEST_FILE_PATH):
        os.remove(TEST_FILE_PATH)
        print(f"✅ Cleaned up test file: {TEST_FILE_PATH}")

def main():
    """Run all tests"""
    print("🚀 Starting document upload tests...")
    print("=" * 50)
    
    # Test health endpoint
    if not test_health_endpoint():
        print("❌ Health check failed, stopping tests")
        return
    
    print()
    
    # Test file upload
    file_id = test_file_upload()
    if not file_id:
        print("❌ File upload failed, stopping tests")
        cleanup()
        return
    
    print()
    
    # Test listing documents
    documents = test_list_documents()
    print()
    
    # Test getting document details
    test_get_document(file_id)
    print()
    
    # Test downloading document
    test_download_document(file_id)
    print()
    
    # Cleanup
    cleanup()
    
    print("=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main()
