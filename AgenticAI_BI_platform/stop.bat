@echo off
REM AgenticAI BI Platform Stop Script for Windows

echo 🛑 Stopping AgenticAI BI Platform...

REM Stop the application
docker-compose down

echo ✅ Application stopped successfully!

REM Optional: Remove containers and volumes (uncomment for clean slate)
REM echo 🧹 Cleaning up containers and volumes...
REM docker-compose down -v --remove-orphans

echo 📝 To start again, run: start.bat
pause 