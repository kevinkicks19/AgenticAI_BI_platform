#!/usr/bin/env python3
"""
Test script to check Pinecone connectivity and fix dimension issues
"""
import os
import asyncio
from config import PINECONE_API_KEY, OPENAI_API_KEY
import openai
from pinecone import Pinecone, ServerlessSpec

async def test_pinecone():
    print("🔍 Testing Pinecone connectivity...")
    
    # Test OpenAI API key
    print(f"OpenAI API Key exists: {bool(OPENAI_API_KEY)}")
    
    # Test Pinecone API key
    print(f"Pinecone API Key exists: {bool(PINECONE_API_KEY)}")
    
    if not PINECONE_API_KEY:
        print("❌ PINECONE_API_KEY not found!")
        return
    
    try:
        # Initialize Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        print("✅ Pinecone client initialized successfully")
        
        # List existing indexes
        indexes = pc.list_indexes()
        print(f"📋 Existing indexes: {[idx.name for idx in indexes]}")
        
        # Check if project-context index exists
        index_names = [idx.name for idx in indexes]
        if "project-context" in index_names:
            print("✅ project-context index exists")
            
            # Get index info
            index = pc.Index("project-context")
            index_stats = index.describe_index_stats()
            print(f"📊 Index stats: {index_stats}")
            
            # Check vector count
            vector_count = index_stats.get('total_vector_count', 0)
            print(f"🔢 Total vectors in index: {vector_count}")
            
        else:
            print("❌ project-context index does not exist")
            print("🔧 Creating project-context index with correct dimensions...")
            
            # Create index with correct dimensions for text-embedding-3-small (1024)
            pc.create_index(
                name="project-context",
                dimension=1024,  # text-embedding-3-small produces 1024-dimensional vectors
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            print("✅ project-context index created successfully")
            
    except Exception as e:
        print(f"❌ Error testing Pinecone: {str(e)}")
        import traceback
        traceback.print_exc()

async def test_embedding():
    print("\n🧠 Testing OpenAI embeddings...")
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not found!")
        return
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Test embedding generation
        response = client.embeddings.create(
            model="text-embedding-3-small",  # This produces 1024 dimensions
            input="This is a test sentence."
        )
        
        embedding = response.data[0].embedding
        print(f"✅ Embedding generated successfully")
        print(f"📏 Embedding dimension: {len(embedding)}")
        
        return len(embedding)
        
    except Exception as e:
        print(f"❌ Error testing embeddings: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    print("🚀 Starting Pinecone and OpenAI tests...\n")
    
    # Test embeddings first
    embedding_dim = await test_embedding()
    
    # Test Pinecone
    await test_pinecone()
    
    print(f"\n📋 Summary:")
    print(f"   - OpenAI API Key: {'✅' if OPENAI_API_KEY else '❌'}")
    print(f"   - Pinecone API Key: {'✅' if PINECONE_API_KEY else '❌'}")
    print(f"   - Embedding dimension: {embedding_dim or '❌'}")
    
    if embedding_dim and embedding_dim != 1024:
        print(f"⚠️  Warning: Expected 1024 dimensions, got {embedding_dim}")

if __name__ == "__main__":
    asyncio.run(main()) 