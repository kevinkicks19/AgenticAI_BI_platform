import asyncio
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from mcp.agent_coordinator import router, coordinator
from fastapi import FastAPI

# Create test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)

# Test data directory
TEST_DATA_DIR = Path(__file__).parent / "test_data"
TEST_DATA_DIR.mkdir(exist_ok=True)

# Create test files
def create_test_files():
    # Create a text file
    with open(TEST_DATA_DIR / "test.txt", "w") as f:
        f.write("This is a test text file.\nIt has multiple lines.\n")
    
    # Create a CSV file
    with open(TEST_DATA_DIR / "test.csv", "w") as f:
        f.write("name,age,city\nJohn,30,New York\nJane,25,London\n")
    
    # Create a simple Excel file (we'll use pandas for this)
    import pandas as pd
    df = pd.DataFrame({
        'name': ['John', 'Jane'],
        'age': [30, 25],
        'city': ['New York', 'London']
    })
    df.to_excel(TEST_DATA_DIR / "test.xlsx", index=False)

@pytest.fixture(scope="session", autouse=True)
def setup_test_files():
    create_test_files()
    yield
    # Cleanup test files
    for file in TEST_DATA_DIR.glob("*"):
        file.unlink()
    TEST_DATA_DIR.rmdir()

@pytest.fixture
def test_session():
    # Create a test session
    response = client.post(
        "/api/chat",
        json={
            "sessionId": "test_session",
            "message": "Initialize test session"
        }
    )
    assert response.status_code == 200
    return "test_session"

def test_upload_text_file(test_session):
    with open(TEST_DATA_DIR / "test.txt", "rb") as f:
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", f, "text/plain")},
            params={"sessionId": test_session}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["metadata"]["filename"] == "test.txt"
    assert data["metadata"]["content_type"] == "text/plain"

def test_upload_csv_file(test_session):
    with open(TEST_DATA_DIR / "test.csv", "rb") as f:
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.csv", f, "text/csv")},
            params={"sessionId": test_session}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["metadata"]["filename"] == "test.csv"
    assert data["metadata"]["content_type"] == "text/csv"

def test_upload_excel_file(test_session):
    with open(TEST_DATA_DIR / "test.xlsx", "rb") as f:
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            params={"sessionId": test_session}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["metadata"]["filename"] == "test.xlsx"
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in data["metadata"]["content_type"]

def test_upload_invalid_file_type(test_session):
    # Create an invalid file
    with open(TEST_DATA_DIR / "test.invalid", "w") as f:
        f.write("This is an invalid file type")
    
    with open(TEST_DATA_DIR / "test.invalid", "rb") as f:
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.invalid", f, "application/invalid")},
            params={"sessionId": test_session}
        )
    
    assert response.status_code == 400
    data = response.json()
    assert "Unsupported file type" in data["detail"]

def test_upload_without_session():
    with open(TEST_DATA_DIR / "test.txt", "rb") as f:
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", f, "text/plain")}
        )
    
    assert response.status_code == 400
    data = response.json()
    assert "Session ID is required" in data["detail"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 