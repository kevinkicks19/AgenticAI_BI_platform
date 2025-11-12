@echo off
REM AgenticAI BI Platform - Production Deployment Script (Windows)
REM This script builds and deploys the application using Docker

setlocal enabledelayedexpansion

echo ========================================================
echo  AgenticAI BI Platform - Production Deployment
echo ========================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found
    echo Please create a .env file with your configuration
    echo You can copy from env.example:
    echo   copy env.example .env
    exit /b 1
)

REM Load environment variables from .env file
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "%%a=%%b"
)

echo [INFO] Environment configuration loaded
echo.

REM Parse command line arguments
set MODE=%1
set ACTION=%2

if "%MODE%"=="" set MODE=production
if "%ACTION%"=="" set ACTION=up

if not "%MODE%"=="production" if not "%MODE%"=="development" (
    echo [WARNING] Invalid mode: %MODE%
    echo Usage: deploy.bat [production^|development] [up^|down^|rebuild^|logs]
    exit /b 1
)

REM Set the compose file based on mode
if "%MODE%"=="production" (
    set COMPOSE_FILE=docker-compose.production.yml
) else (
    set COMPOSE_FILE=docker-compose.yml
)

echo [INFO] Mode: %MODE%
echo [INFO] Using: %COMPOSE_FILE%
echo.

REM Execute the action
if "%ACTION%"=="up" goto action_up
if "%ACTION%"=="down" goto action_down
if "%ACTION%"=="rebuild" goto action_rebuild
if "%ACTION%"=="logs" goto action_logs

echo [ERROR] Unknown action: %ACTION%
echo Valid actions: up, down, rebuild, logs
exit /b 1

:action_up
echo [INFO] Building and starting containers...
docker-compose -f %COMPOSE_FILE% up --build -d
if errorlevel 1 (
    echo [ERROR] Deployment failed
    exit /b 1
)
echo.
echo [SUCCESS] Deployment successful!
echo.
echo Application is running at:
echo   Frontend: http://localhost:%PORT%
echo   Backend API: http://localhost:%PORT%/api
echo.
echo To view logs:
echo   docker-compose -f %COMPOSE_FILE% logs -f
echo.
echo To stop:
echo   deploy.bat %MODE% down
goto end

:action_down
echo [INFO] Stopping containers...
docker-compose -f %COMPOSE_FILE% down
echo [SUCCESS] Containers stopped
goto end

:action_rebuild
echo [INFO] Rebuilding containers...
docker-compose -f %COMPOSE_FILE% down
docker-compose -f %COMPOSE_FILE% up --build -d
echo [SUCCESS] Rebuild complete!
goto end

:action_logs
echo [INFO] Showing logs (Ctrl+C to exit)...
docker-compose -f %COMPOSE_FILE% logs -f
goto end

:end
endlocal

