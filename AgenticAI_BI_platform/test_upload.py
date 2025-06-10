import requests
import json
import os

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_FILE = "test_document.md"

def test_chat_session():
    """Test creating a chat session first"""
    print("Testing chat session creation...")
    
    response = requests.post(f"{BASE_URL}/api/chat", json={
        "message": "Hello, I want to upload a document",
        "projectContext": {
            "name": "Document Upload Test",
            "description": "Testing document upload and vectorization"
        }
    })
    
    print(f"Chat response status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Session created: {result.get('session_id')}")
        return result.get('session_id')
    else:
        print(f"Error: {response.text}")
        return None

def test_document_upload(session_id):
    """Test document upload functionality"""
    print(f"\nTesting document upload for session: {session_id}")
    
    if not os.path.exists(TEST_FILE):
        print(f"Test file {TEST_FILE} not found!")
        return
    
    # Prepare the file upload
    with open(TEST_FILE, 'rb') as f:
        files = {
            'file': (TEST_FILE, f, 'text/markdown')
        }
        data = {
            'metadata': json.dumps({
                'test_type': 'vectorization_test',
                'upload_source': 'test_script'
            })
        }
        
        print("Uploading file...")
        response = requests.post(
            f"{BASE_URL}/api/documents/upload?session_id={session_id}",
            files=files,
            data=data
        )
    
    print(f"Upload response status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("Upload successful!")
        print(f"Result: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Upload failed: {response.text}")
        return None

def test_chat_with_context(session_id):
    """Test chat functionality with uploaded document context"""
    print(f"\nTesting chat with document context for session: {session_id}")
    
    response = requests.post(f"{BASE_URL}/api/chat", json={
        "sessionId": session_id,
        "message": "What documents have been uploaded to this session?"
    })
    
    print(f"Chat response status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("Chat response:")
        print(f"Response: {result.get('response')}")
        print(f"Intent: {result.get('intent')}")
        print(f"Workflow: {result.get('workflow')}")
        return result
    else:
        print(f"Chat failed: {response.text}")
        return None

def test_project_summary(session_id):
    """Test getting project summary with documents"""
    print(f"\nTesting project summary for session: {session_id}")
    
    response = requests.get(f"{BASE_URL}/api/project?sessionId={session_id}")
    
    print(f"Project summary response status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("Project summary:")
        print(f"Summary: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Project summary failed: {response.text}")
        return None

def main():
    """Run all tests"""
    print("=== AgenticAI BI Platform - Document Upload Test ===\n")
    
    # Test 1: Create a session
    session_id = test_chat_session()
    if not session_id:
        print("Failed to create session. Exiting.")
        return
    
    # Test 2: Upload document
    upload_result = test_document_upload(session_id)
    if not upload_result:
        print("Failed to upload document. Exiting.")
        return
    
    # Test 3: Chat with context
    chat_result = test_chat_with_context(session_id)
    
    # Test 4: Get project summary
    summary_result = test_project_summary(session_id)
    
    print("\n=== Test Summary ===")
    print(f"Session ID: {session_id}")
    print(f"Upload successful: {upload_result is not None}")
    print(f"Chat with context: {chat_result is not None}")
    print(f"Project summary: {summary_result is not None}")

if __name__ == "__main__":
    main() 