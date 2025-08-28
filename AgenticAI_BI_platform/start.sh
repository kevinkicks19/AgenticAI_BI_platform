#!/bin/bash

# AgenticAI BI Platform Startup Script

echo "🚀 Starting AgenticAI BI Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating a template..."
    cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key_here

# n8n Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key_here

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Affine Configuration
AFFINE_API_URL=https://app.affine.pro
AFFINE_API_KEY=your_affine_api_key_here
AFFINE_WORKSPACE_ID=your_affine_workspace_id_here

# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=True
ENVIRONMENT=development
EOF
    echo "📝 Please edit .env file with your actual API keys before starting."
    echo "   Then run: ./start.sh"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please stop the service using that port first."
        exit 1
    fi
}

# Check if ports are available
check_port 5000

echo "🔧 Building and starting the application..."

# Build and start the application
docker-compose up --build -d

# Wait for the application to start
echo "⏳ Waiting for the application to start..."
sleep 10

# Check if the application is running
if curl -f http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Frontend: http://localhost:5000"
    echo "🔧 Backend API: http://localhost:5000/api"
    echo ""
    echo "📋 Available endpoints:"
    echo "   - Chat: http://localhost:5000/api/chat"
    echo "   - Handoff: http://localhost:5000/api/handoff"
    echo "   - n8n Workflows: http://localhost:5000/api/n8n/workflows"
    echo ""
    echo "🛑 To stop the application, run: ./stop.sh"
    echo "📊 To view logs, run: docker-compose logs -f"
else
    echo "❌ Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi 