# 🐳 Docker Deployment Guide

Complete guide for deploying the AgenticAI BI Platform using Docker.

## 📋 Prerequisites

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before deployment

2. **Required API Keys**
   - OpenAI API Key
   - n8n API Key
   - Perplexity API Key (optional but recommended)
   - Pinecone API Key (optional for vector storage)
   - Affine API credentials (optional for document management)

## 🚀 Quick Start - Production Deployment

### Windows

```bash
# Make sure you're in the AgenticAI_BI_platform directory
cd AgenticAI_BI_platform

# Deploy with one command
deploy.bat production up
```

### Linux/Mac

```bash
# Make sure you're in the AgenticAI_BI_platform directory
cd AgenticAI_BI_platform

# Make the script executable (first time only)
chmod +x deploy.sh

# Deploy with one command
./deploy.sh production up
```

**That's it!** The application will:
- ✅ Build the frontend (React + Vite)
- ✅ Build the backend (Python + FastAPI)
- ✅ Start the container
- ✅ Serve everything on http://localhost:5000

## 🔧 Configuration

### Environment Variables

Your `.env` file should contain:

```env
# AI API Keys (Required)
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# N8N Configuration (Required)
N8N_API_KEY=eyJhbG...
N8N_BASE_URL=https://n8n.casamccartney.link

# Optional: Affine Integration
AFFINE_API_KEY=...
AFFINE_WORKSPACE_ID=...

# Optional: Pinecone (Vector Database)
PINECONE_API_KEY=...

# Application Settings
PORT=5000
DEBUG=False
ENVIRONMENT=production
```

**Important:** The `.env` file is already configured in your project. Do not commit it to Git!

## 📦 Deployment Modes

### Production Mode (Recommended)

```bash
# Windows
deploy.bat production up

# Linux/Mac
./deploy.sh production up
```

**Features:**
- Optimized builds
- No source code mounting
- Faster performance
- Single container
- Health checks enabled

### Development Mode

```bash
# Windows
deploy.bat development up

# Linux/Mac
./deploy.sh development up
```

**Features:**
- Hot reload enabled
- Source code mounted as volumes
- Separate frontend/backend containers
- Better for active development

## 🎮 Available Commands

### Start/Deploy
```bash
# Production
deploy.bat production up    # Windows
./deploy.sh production up   # Linux/Mac

# Development
deploy.bat development up   # Windows
./deploy.sh development up  # Linux/Mac
```

### Stop
```bash
deploy.bat production down   # Windows
./deploy.sh production down  # Linux/Mac
```

### Rebuild (after code changes)
```bash
deploy.bat production rebuild   # Windows
./deploy.sh production rebuild  # Linux/Mac
```

### View Logs
```bash
deploy.bat production logs   # Windows
./deploy.sh production logs  # Linux/Mac
```

## 🌐 Accessing the Application

Once deployed, access:

- **Frontend UI**: http://localhost:5000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/upload/health
- **API Documentation**: http://localhost:5000/docs (if enabled)

## 🏗️ Architecture

### Production Build

```
┌─────────────────────────────────────────┐
│  Docker Container: agentic-ai-bi        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Frontend (Static Files)        │   │
│  │  - React + Vite                 │   │
│  │  - Served from /static          │   │
│  └─────────────────────────────────┘   │
│                ↓                        │
│  ┌─────────────────────────────────┐   │
│  │  Backend (FastAPI)              │   │
│  │  - Python 3.10                  │   │
│  │  - Port 5000                    │   │
│  │  - Serves static + API          │   │
│  └─────────────────────────────────┘   │
│                ↓                        │
│  ┌─────────────────────────────────┐   │
│  │  n8n Workflows (External)       │   │
│  │  - https://n8n.casamccartney... │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Multi-Stage Build Process

1. **Stage 1: Frontend Build**
   - Node.js 20 Alpine
   - Installs npm dependencies
   - Builds React app with Vite
   - Outputs to `/dist`

2. **Stage 2: Backend + Serve**
   - Python 3.10 Slim
   - Installs Python dependencies
   - Copies backend code
   - Copies built frontend to `/app/static`
   - Serves both via FastAPI

## 🔍 Health Monitoring

The application includes automatic health checks:

- **Endpoint**: `GET /api/upload/health`
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts
- **Start Period**: 40 seconds (warmup time)

Check health status:
```bash
curl http://localhost:5000/api/upload/health
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**
```bash
# Windows - Find what's using the port
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Change port in .env file
PORT=5001
```

#### 2. Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
- Start Docker Desktop
- Wait for it to fully initialize
- Try the deploy command again

#### 3. Build Fails - Missing Dependencies

**Error:** Build fails during npm install or pip install

**Solution:**
```bash
# Clean Docker cache
docker system prune -a -f

# Rebuild from scratch
deploy.bat production rebuild
```

#### 4. n8n Connection Issues

**Error:** Backend cannot connect to n8n

**Solution:**
- Verify `N8N_API_KEY` in `.env` is correct
- Check `N8N_BASE_URL` is accessible
- Test the n8n API key:
  ```bash
  curl -H "X-N8N-API-KEY: your-key" https://n8n.casamccartney.link/api/v1/workflows
  ```

#### 5. Environment Variables Not Loading

**Error:** Application starts but features don't work

**Solution:**
```bash
# Verify .env file exists and has content
cat .env  # Linux/Mac
type .env # Windows

# Restart with fresh environment
deploy.bat production down
deploy.bat production up
```

### Debug Commands

```bash
# Check if container is running
docker ps

# View container logs
docker logs agentic-ai-bi-platform

# Follow logs in real-time
docker logs -f agentic-ai-bi-platform

# Access container shell
docker exec -it agentic-ai-bi-platform bash

# Check environment variables inside container
docker exec agentic-ai-bi-platform env

# Inspect container
docker inspect agentic-ai-bi-platform
```

## 🔄 Updating the Application

### After Code Changes

```bash
# Stop, rebuild, and restart
deploy.bat production rebuild   # Windows
./deploy.sh production rebuild  # Linux/Mac
```

### After Dependency Changes

```bash
# Complete rebuild with no cache
docker-compose -f docker-compose.production.yml build --no-cache
deploy.bat production up
```

### Update from Git

```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
deploy.bat production rebuild
```

## 📊 Performance Optimization

### Production Tips

1. **Use Production Mode**
   - Always use `docker-compose.production.yml`
   - Smaller image size
   - Better performance

2. **Resource Limits** (optional)
   Add to `docker-compose.production.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
       reservations:
         cpus: '1'
         memory: 1G
   ```

3. **Enable CORS for Production**
   Update `backend/app.py` to restrict origins:
   ```python
   allow_origins=["https://yourdomain.com"]
   ```

## 🔐 Security Best Practices

1. **Never commit .env file**
   - Already in `.gitignore`
   - Contains sensitive API keys

2. **Use environment-specific .env files**
   ```
   .env.development
   .env.production
   .env.staging
   ```

3. **Rotate API keys regularly**

4. **Use Docker secrets for production**

5. **Keep Docker images updated**
   ```bash
   docker pull node:20-alpine
   docker pull python:3.10-slim
   ```

## 📈 Monitoring & Logs

### View Logs

```bash
# All logs
docker logs agentic-ai-bi-platform

# Follow logs (Ctrl+C to exit)
docker logs -f agentic-ai-bi-platform

# Last 100 lines
docker logs --tail 100 agentic-ai-bi-platform

# Logs from specific time
docker logs --since 30m agentic-ai-bi-platform
```

### Log Files

Application logs are also available inside the container:
```bash
docker exec agentic-ai-bi-platform ls -la /app/logs
```

## 🚢 Production Deployment Options

### Option 1: Docker Compose (Current Setup)
Best for: Single server deployment

### Option 2: Docker Swarm
Best for: Multi-server orchestration

```bash
docker swarm init
docker stack deploy -c docker-compose.production.yml agentic-ai
```

### Option 3: Kubernetes
Best for: Large-scale deployments

Create Kubernetes manifests from Docker Compose:
```bash
kompose convert -f docker-compose.production.yml
```

### Option 4: Cloud Platforms
- **AWS ECS**: Elastic Container Service
- **Google Cloud Run**: Serverless containers
- **Azure Container Instances**: Managed containers
- **DigitalOcean App Platform**: Platform-as-a-Service

## 📞 Support

For issues or questions:

1. Check the logs: `docker logs agentic-ai-bi-platform`
2. Review this documentation
3. Check Docker is running and up-to-date
4. Verify all environment variables are set correctly

## 🎯 Next Steps

After successful deployment:

1. ✅ Access the frontend at http://localhost:5000
2. ✅ Test the n8n workflow integration
3. ✅ Configure your agents in the UI
4. ✅ Upload documents for analysis
5. ✅ Monitor logs for any issues

---

**Happy Deploying! 🚀**

