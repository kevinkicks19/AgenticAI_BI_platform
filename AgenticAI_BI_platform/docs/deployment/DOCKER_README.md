# AgenticAI BI Platform - Docker Setup

This guide explains how to run the AgenticAI BI Platform using Docker, which includes both the frontend (React/Vite) and backend (Python/FastAPI) in a single container.

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Compose** (usually included with Docker Desktop)
3. **API Keys** for OpenAI, Pinecone, and n8n

### Step 1: Setup Environment

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd AgenticAI_BI_platform
   ```

2. **Create environment file**:
   - On Windows: Run `start.bat` (it will create `.env` template)
   - On Linux/Mac: Run `./start.sh` (it will create `.env` template)

3. **Edit the `.env` file** with your actual API keys:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_actual_openai_api_key_here
   
   # Pinecone Configuration  
   PINECONE_API_KEY=your_actual_pinecone_api_key_here
   
   # n8n Configuration
   N8N_API_URL=https://your-n8n-instance.com
   N8N_API_KEY=your_actual_n8n_api_key_here
   
   # Redis Configuration (optional)
   REDIS_URL=redis://localhost:6379
   
   # Server Configuration
   HOST=0.0.0.0
   PORT=5000
   DEBUG=True
   ENVIRONMENT=development
   ```

### Step 2: Start the Application

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

**Manual Docker commands:**
```bash
docker-compose up --build -d
```

### Step 3: Access the Application

Once started, you can access:

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/

## 📋 Available Endpoints

### Chat & Coordination
- `POST /api/chat` - Main chat endpoint
- `GET /api/agents` - List available agents

### Handoff Management
- `POST /api/handoff/initiate` - Start handoff to specialized agent
- `POST /api/handoff/complete` - Complete handoff
- `GET /api/handoff/agents` - List available specialized agents
- `GET /api/handoff/status/{handoff_id}` - Check handoff status

### n8n Integration
- `GET /api/n8n/workflows` - List n8n workflows
- `POST /api/n8n/workflows/{id}/execute` - Execute workflow

### Approval System
- `POST /api/approval` - Handle approval requests

## 🛠️ Development

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agentic-ai-bi-platform
```

### Rebuild After Changes
```bash
# Stop and rebuild
docker-compose down
docker-compose up --build -d

# Or use the restart script
stop.bat  # or ./stop.sh
start.bat # or ./start.sh
```

### Development Mode
For development with hot reloading, you can:

1. **Mount source code** (already configured in docker-compose.yml):
   ```yaml
   volumes:
     - ./backend:/app
     - ./frontend:/app/frontend
   ```

2. **Run frontend separately** for hot reloading:
   ```bash
   cd frontend
   npm run dev
   ```

## 🐳 Docker Architecture

### Multi-Stage Build
The Dockerfile uses a multi-stage build:

1. **Frontend Stage** (`node:18-alpine`):
   - Installs Node.js dependencies
   - Builds the React/Vite application
   - Outputs to `/app/frontend/dist`

2. **Backend Stage** (`python:3.10-slim`):
   - Installs Python dependencies
   - Copies backend source code
   - Copies built frontend from stage 1
   - Runs the FastAPI application

### Container Structure
```
/app/
├── static/           # Built frontend (served by backend)
├── app.py           # Main FastAPI application
├── backend/         # Backend source code
├── requirements.txt # Python dependencies
└── start.sh        # Startup script
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI functionality | ✅ |
| `PINECONE_API_KEY` | Pinecone API key for vector storage | ✅ |
| `N8N_API_URL` | n8n instance URL | ✅ |
| `N8N_API_KEY` | n8n API key | ✅ |
| `HOST` | Server host (default: 0.0.0.0) | ❌ |
| `PORT` | Server port (default: 5000) | ❌ |
| `DEBUG` | Debug mode (default: True) | ❌ |
| `ENVIRONMENT` | Environment (default: development) | ❌ |

### Ports

- **5000**: Main application (frontend + backend)
- **6379**: Redis (optional, for session management)

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using port 5000
   netstat -ano | findstr :5000  # Windows
   lsof -i :5000                 # Linux/Mac
   ```

2. **Docker not running**:
   - Start Docker Desktop
   - Ensure Docker service is running

3. **Build fails**:
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **API keys not working**:
   - Check `.env` file exists and has correct values
   - Verify API keys are valid
   - Check logs for specific error messages

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs agentic-ai-bi-platform

# Access container shell
docker-compose exec agentic-ai-bi-platform bash

# Check environment variables
docker-compose exec agentic-ai-bi-platform env
```

## 🛑 Stopping the Application

**Windows:**
```bash
stop.bat
```

**Linux/Mac:**
```bash
./stop.sh
```

**Manual:**
```bash
docker-compose down
```

## 📦 Production Deployment

For production deployment:

1. **Remove development volumes** from `docker-compose.yml`:
   ```yaml
   # Comment out these lines:
   # volumes:
   #   - ./backend:/app
   #   - ./frontend:/app/frontend
   ```

2. **Set production environment variables**:
   ```env
   DEBUG=False
   ENVIRONMENT=production
   ```

3. **Use production nginx configuration** (if needed)

4. **Set up proper SSL/TLS certificates**

## 🔄 Updates

To update the application:

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart**:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

## 📊 Monitoring

### Health Checks
The application includes health checks:
- **Endpoint**: `GET /`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f agentic-ai-bi-platform
```

## 🤝 Contributing

When making changes:

1. **Test locally** with Docker
2. **Update documentation** if needed
3. **Follow the existing code style**
4. **Test the handoff system** with different agent types

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables in `.env`
3. Ensure all prerequisites are installed
4. Check the troubleshooting section above 