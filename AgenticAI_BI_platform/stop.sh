#!/bin/bash

# AgenticAI BI Platform Stop Script

echo "🛑 Stopping AgenticAI BI Platform..."

# Stop the application
docker-compose down

echo "✅ Application stopped successfully!"

# Optional: Remove containers and volumes (uncomment for clean slate)
# echo "🧹 Cleaning up containers and volumes..."
# docker-compose down -v --remove-orphans

echo "📝 To start again, run: ./start.sh" 