# Multi-stage build for frontend and backend
FROM node:20-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install frontend dependencies (use npm install instead of npm ci for better compatibility)
RUN npm install

# Copy frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Backend stage
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    curl \
    libmagic-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist ./static

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose the port the backend runs on
EXPOSE 5000

# Set environment variables
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/upload/health || exit 1

# Start the application directly
CMD ["python", "app.py"] 