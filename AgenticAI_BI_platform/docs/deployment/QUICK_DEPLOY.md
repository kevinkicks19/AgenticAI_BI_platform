# ⚡ Quick Deploy Cheatsheet

## 🚀 Deploy Production (One Command)

### Windows
```bash
cd AgenticAI_BI_platform
deploy.bat production up
```

### Linux/Mac
```bash
cd AgenticAI_BI_platform
chmod +x deploy.sh
./deploy.sh production up
```

## 📍 Access Points

- **App**: http://localhost:5000
- **API**: http://localhost:5000/api  
- **Health**: http://localhost:5000/api/upload/health

## 🎮 Common Commands

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| Deploy | `deploy.bat production up` | `./deploy.sh production up` |
| Stop | `deploy.bat production down` | `./deploy.sh production down` |
| Rebuild | `deploy.bat production rebuild` | `./deploy.sh production rebuild` |
| Logs | `deploy.bat production logs` | `./deploy.sh production logs` |
| Dev Mode | `deploy.bat development up` | `./deploy.sh development up` |

## 🔧 Troubleshooting

```bash
# Check if running
docker ps

# View logs
docker logs agentic-ai-bi-platform

# Restart everything
deploy.bat production rebuild

# Clean slate
docker system prune -a -f
deploy.bat production up
```

## 📋 Prerequisites Checklist

- [ ] Docker Desktop installed and running
- [ ] `.env` file exists with API keys:
  - `OPENAI_API_KEY`
  - `N8N_API_KEY`
  - `N8N_BASE_URL`
  - `PERPLEXITY_API_KEY` (optional)

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| Port 5000 in use | Change `PORT=5001` in `.env` |
| Docker not running | Start Docker Desktop |
| Build fails | Run `docker system prune -f` then rebuild |
| n8n not connecting | Check `N8N_API_KEY` in `.env` |

---
**Full docs:** See `DOCKER_DEPLOYMENT.md`

