# Docker Troubleshooting Guide

## Common Windows Docker Issues

### Error: "unknown file mode ?rwxr-xr-x"

**Problem**: Windows file permissions don't map cleanly to Unix permissions in Docker.

**Solutions**:

1. **Update .dockerignore** to exclude problematic directories:
   ```dockerignore
   venv/
   venv_new/
   __pycache__/
   .pytest_cache/
   ```

2. **Use selective COPY** in Dockerfile instead of `COPY . .`:
   ```dockerfile
   COPY routes/ ./routes/
   COPY services/ ./services/
   COPY *.py ./
   ```

3. **Clean build context**:
   ```bash
   # Remove large directories before building
   # (They're in .dockerignore but sometimes still get included)
   ```

4. **Use WSL2 backend** in Docker Desktop (recommended):
   - Docker Desktop Settings → General → Use WSL 2 based engine
   - This provides better Linux compatibility

### Error: "Build context too large"

**Problem**: Docker is trying to copy too much (venv, node_modules, etc.)

**Solutions**:

1. **Verify .dockerignore is working**:
   ```bash
   # Check what Docker sees
   docker build --no-cache -t test-image -f backend/Dockerfile backend 2>&1 | grep "Sending build context"
   ```

2. **Exclude large directories explicitly** in .dockerignore:
   ```
   venv/
   venv_new/
   node_modules/
   __pycache__/
   ```

3. **Use .dockerignore in project root** - Docker respects the one closest to Dockerfile

### Error: "Docker daemon not running"

**Problem**: Docker Desktop isn't started

**Solutions**:
1. Start Docker Desktop application
2. Wait for Docker icon to show "Docker Desktop is running"
3. Verify: `docker ps` should work

### Error: "Port already in use"

**Problem**: Port 5000 or 5173 is already in use

**Solutions**:
```bash
# Windows: Find what's using the port
netstat -ano | findstr :5000

# Kill the process or change ports in docker-compose.yml
```

## Build Performance Tips

1. **Use BuildKit** (faster builds):
   ```bash
   $env:DOCKER_BUILDKIT=1; docker-compose build
   ```

2. **Layer caching**: Keep Dockerfile commands that change less frequently at the top

3. **Multi-stage builds**: Use for production to reduce final image size

4. **.dockerignore**: Make sure it's comprehensive to reduce build context

## Windows-Specific Considerations

1. **Line endings**: If you get "bad interpreter" errors, ensure scripts use LF not CRLF

2. **File permissions**: Windows doesn't support Unix permissions well - use .dockerignore to exclude problematic files

3. **Symlinks**: May not work correctly - exclude or handle specially

4. **Path separators**: Docker uses `/` even on Windows

## Quick Fixes

### Reset Docker Build Cache
```bash
docker builder prune -a
```

### Clean Everything
```bash
docker-compose down -v
docker system prune -a
```

### Rebuild from Scratch
```bash
docker-compose build --no-cache
```

