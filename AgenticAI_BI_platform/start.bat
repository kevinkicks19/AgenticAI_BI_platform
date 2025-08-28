@echo off
REM AgenticAI BI Platform Startup Script for Windows

echo 🚀 Starting AgenticAI BI Platform...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating a template...
    (
        echo # OpenAI Configuration
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Pinecone Configuration  
        echo PINECONE_API_KEY=your_pinecone_api_key_here
        echo.
        echo # n8n Configuration
        echo N8N_API_URL=https://your-n8n-instance.com
        echo N8N_API_KEY=your_n8n_api_key_here
        echo.
        echo # Redis Configuration (optional)
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # Server Configuration
        echo HOST=0.0.0.0
        echo PORT=5000
        echo DEBUG=True
        echo ENVIRONMENT=development
    ) > .env
    echo 📝 Please edit .env file with your actual API keys before starting.
    echo    Then run: start.bat
    pause
    exit /b 1
)

echo 🔧 Building and starting the application...

REM Build and start the application
docker-compose up --build -d

REM Wait for the application to start
echo ⏳ Waiting for the application to start...
timeout /t 10 /nobreak >nul

REM Check if the application is running
curl -f http://localhost:5000/ >nul 2>&1
if errorlevel 1 (
    echo ❌ Application failed to start. Check logs with: docker-compose logs
    pause
    exit /b 1
) else (
    echo ✅ Application is running successfully!
    echo 🌐 Frontend: http://localhost:5000
    echo 🔧 Backend API: http://localhost:5000/api
    echo.
    echo 📋 Available endpoints:
    echo    - Chat: http://localhost:5000/api/chat
    echo    - Handoff: http://localhost:5000/api/handoff
    echo    - n8n Workflows: http://localhost:5000/api/n8n/workflows
    echo.
    echo 🛑 To stop the application, run: stop.bat
    echo 📊 To view logs, run: docker-compose logs -f
)

pause 