#!/bin/bash

# AgenticAI BI Platform - Production Deployment Script
# This script builds and deploys the application using Docker

set -e  # Exit on error

echo "🚀 AgenticAI BI Platform - Production Deployment"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your configuration"
    echo "You can copy from env.example:"
    echo "  cp env.example .env"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment configuration..."
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("OPENAI_API_KEY" "N8N_API_KEY" "N8N_BASE_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Error: Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "Please add these variables to your .env file"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration loaded${NC}"
echo ""

# Parse command line arguments
MODE="${1:-production}"
ACTION="${2:-up}"

if [ "$MODE" != "production" ] && [ "$MODE" != "development" ]; then
    echo -e "${YELLOW}⚠️  Invalid mode: $MODE${NC}"
    echo "Usage: ./deploy.sh [production|development] [up|down|rebuild]"
    exit 1
fi

# Set the compose file based on mode
if [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "🔧 Mode: $MODE"
echo "📄 Using: $COMPOSE_FILE"
echo ""

# Execute the action
case "$ACTION" in
    up)
        echo "🏗️  Building and starting containers..."
        docker-compose -f "$COMPOSE_FILE" up --build -d
        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""
        echo "📍 Application is running at:"
        echo "   Frontend: http://localhost:${PORT:-5000}"
        echo "   Backend API: http://localhost:${PORT:-5000}/api"
        echo ""
        echo "📊 To view logs:"
        echo "   docker-compose -f $COMPOSE_FILE logs -f"
        echo ""
        echo "🛑 To stop:"
        echo "   ./deploy.sh $MODE down"
        ;;
        
    down)
        echo "🛑 Stopping containers..."
        docker-compose -f "$COMPOSE_FILE" down
        echo -e "${GREEN}✅ Containers stopped${NC}"
        ;;
        
    rebuild)
        echo "🔄 Rebuilding containers..."
        docker-compose -f "$COMPOSE_FILE" down
        docker-compose -f "$COMPOSE_FILE" up --build -d
        echo -e "${GREEN}✅ Rebuild complete!${NC}"
        ;;
        
    logs)
        echo "📊 Showing logs (Ctrl+C to exit)..."
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
        
    *)
        echo -e "${RED}❌ Unknown action: $ACTION${NC}"
        echo "Valid actions: up, down, rebuild, logs"
        exit 1
        ;;
esac

