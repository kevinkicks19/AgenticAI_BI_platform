# Docker Setup Guide

## Overview

This project uses Docker containers to run both the backend and frontend services separately.

## Architecture

- **Backend Container**: FastAPI application running on port 5000
- **Frontend Container**: Vite dev server (dev) or Nginx (prod) serving React app on port 5173 (dev) or 80 (prod)

## Quick Start

### Development Mode

```bash
# Start both containers in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or use the default docker-compose.yml
docker-compose up --build
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/docs

### Production Mode

```bash
# Start both containers in production mode
docker-compose -f docker-compose.prod.yml up --build -d
```

**Access:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000

## Docker Compose Files

### `docker-compose.yml` (Default)
- Development mode with hot reload
- Backend: Port 5000
- Frontend: Port 5173

### `docker-compose.dev.yml` (Explicit Dev)
- Same as default but explicit dev configuration
- Hot reload enabled for both services

### `docker-compose.prod.yml` (Production)
- Production optimized
- Frontend served via Nginx on port 80
- Backend with multiple workers
- Resource limits configured

## Environment Variables

Create a `.env` file in the project root with:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Perplexity Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key

# n8n Configuration
N8N_API_KEY=your_n8n_api_key
N8N_API_URL=https://n8n.casamccartney.link

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# DataHub Configuration (optional)
DATAHUB_API_URL=http://localhost:8080
DATAHUB_API_TOKEN=your_datahub_token

# GitHub Configuration (for artifacts)
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username

# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=True
ENVIRONMENT=development

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5000
```

## Container Details

### Backend Container

**Image**: Built from `backend/Dockerfile`
**Ports**: 5000:5000
**Volumes**:
- `./backend:/app` (source code for hot reload)
- `backend-uploads:/app/uploads` (persistent uploads)

**Health Check**: `http://localhost:5000/api/upload/health`

**Command**:
- Dev: `uvicorn app:app --host 0.0.0.0 --port 5000 --reload`
- Prod: `uvicorn app:app --host 0.0.0.0 --port 5000 --workers 4`

### Frontend Container

**Image**: Built from `frontend/Dockerfile` (dev) or `frontend/Dockerfile.prod` (prod)
**Ports**: 
- Dev: 5173:5173
- Prod: 80:80

**Volumes**:
- Source code mounted for hot reload (dev)
- `frontend-node-modules:/app/node_modules` (separate volume for node_modules)

**Environment**:
- `VITE_API_BASE_URL`: Backend API URL (in Docker, use `http://backend:5000`)

## Common Commands

### Start Services
```bash
# Development
docker-compose up

# Production (detached)
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
docker-compose down

# Remove volumes (deletes uploads/data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend /bin/bash

# Frontend shell
docker-compose exec frontend /bin/sh

# Run Python command in backend
docker-compose exec backend python script.py
```

### Rebuild Specific Service
```bash
# Rebuild backend only
docker-compose build backend

# Rebuild frontend only
docker-compose build frontend
```

## Networking

Both containers are on the `app-network` Docker network:

- **Container names**: `backend`, `frontend`
- **Service names**: Use `backend` or `frontend` to reference from other containers
- **Internal communication**: `http://backend:5000`, `http://frontend:5173`

## Volume Management

### Named Volumes
- `backend-uploads`: Persistent file uploads
- `backend-static`: Static files (production)
- `frontend-node-modules`: Node modules cache

### Bind Mounts (Development)
- Source code is mounted for hot reload
- Changes to files reflect immediately

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -i :5000

# Stop the service using the port, or change ports in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check if ports are available
docker ps

# Rebuild containers
docker-compose build --no-cache
```

### Frontend Can't Connect to Backend
- In Docker, frontend should use `http://backend:5000` (container name)
- Check that both containers are on the same network: `app-network`
- Verify backend health: `curl http://localhost:5000/api/upload/health`

### Permission Issues (Linux/Mac)
```bash
# Fix permissions for uploads directory
docker-compose exec backend chmod -R 755 /app/uploads
```

### Environment Variables Not Loading
- Make sure `.env` file is in the project root
- Check environment variables in container:
  ```bash
  docker-compose exec backend env | grep OPENAI_API_KEY
  ```

## Production Deployment

### Build Production Images
```bash
docker-compose -f docker-compose.prod.yml build
```

### Start Production Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Production Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Production Considerations
- Set `DEBUG=False` in environment
- Use strong secrets for API keys
- Configure proper CORS origins
- Set up SSL/TLS (use reverse proxy like Traefik or Nginx)
- Configure resource limits
- Set up log aggregation
- Use Docker secrets for sensitive data

## Health Checks

Both containers have health checks configured:

**Backend**: Checks `/api/upload/health` endpoint
**Frontend**: Checks if nginx is responding (production only)

View health status:
```bash
docker-compose ps
```

## Development Workflow

1. **Start containers**: `docker-compose up`
2. **Make code changes**: Files are mounted, changes reflect automatically
3. **View logs**: `docker-compose logs -f`
4. **Test changes**: Access http://localhost:5173
5. **Stop containers**: `docker-compose down`

## Useful Tips

- Use `docker-compose up --build` to rebuild after dependency changes
- Use `docker-compose restart <service>` to restart a specific service
- Use `docker system prune` to clean up unused Docker resources
- Use `docker-compose down -v` to remove volumes (deletes persistent data)

