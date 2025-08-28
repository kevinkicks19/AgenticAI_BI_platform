import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env files
env_paths = [
    Path(__file__).parent / '.env',  # backend/.env
    Path(__file__).parent.parent / '.env',  # project root .env
]
for env_path in env_paths:
    if env_path.exists():
        print(f"Loading environment from: {env_path}")
        load_dotenv(dotenv_path=env_path)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Pinecone Configuration
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable is not set")

# Redis Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Server Configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8000'))

# Other Configuration
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development') 

# n8n Configuration for MCP Integration
N8N_API_URL = os.getenv("N8N_API_URL", "https://n8n.casamccartney.link")
N8N_API_KEY = os.getenv("N8N_API_KEY")

# DataHub Configuration for MCP Integration
DATAHUB_API_URL = os.getenv("DATAHUB_API_URL", "http://localhost:8080")
DATAHUB_API_TOKEN = os.getenv("DATAHUB_API_TOKEN")

# Debug configuration
print(f"DEBUG: N8N_API_URL = {N8N_API_URL}")
print(f"DEBUG: N8N_API_KEY {'is set' if N8N_API_KEY else 'is NOT set'}")
print(f"DEBUG: DATAHUB_API_URL = {DATAHUB_API_URL}")
print(f"DEBUG: DATAHUB_API_TOKEN {'is set' if DATAHUB_API_TOKEN else 'is NOT set'}") 