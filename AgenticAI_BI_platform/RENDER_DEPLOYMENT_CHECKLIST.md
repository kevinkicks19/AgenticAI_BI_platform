# 🚀 Render Deployment Checklist

## ✅ Pre-Deployment Preparation (Completed)

All code changes have been made to prepare for Render deployment:

### 1. ✅ Environment Variable Configuration
- [x] Created centralized API configuration file (`frontend/src/config/api.ts`)
- [x] Updated `vite.config.js` to handle environment variables
- [x] Updated `env.example` with all required variables
- [x] Updated `docker-compose.yml` to use environment variables

### 2. ✅ Frontend Code Updates
All hardcoded `localhost:5000` URLs have been replaced with environment-aware configuration:

- [x] `frontend/src/components/EnhancedChat.tsx`
- [x] `frontend/src/components/Chat.tsx`
- [x] `frontend/src/components/SessionChatbox.tsx`
- [x] `frontend/src/components/SettingsPanel.tsx`
- [x] `frontend/src/components/EmbeddedN8nChat.tsx`
- [x] `frontend/src/components/WorkflowSelector.tsx`
- [x] `frontend/src/components/HomeAutomationChat.tsx`
- [x] `frontend/src/components/WorkflowManager.tsx`
- [x] `frontend/src/components/BusinessProblemSolver.tsx`
- [x] `frontend/src/utils/api.js`

### 3. ✅ Docker Configuration
- [x] Updated `Dockerfile` to accept `VITE_API_BASE_URL` build argument
- [x] Configured multi-stage build for frontend and backend
- [x] Set up proper environment variable passing

### 4. ✅ Render Configuration
- [x] Verified `render.yaml` has all required environment variables
- [x] Confirmed health check endpoint configuration
- [x] Verified disk storage for uploads (1GB)

---

## 📋 Deployment Steps

### Step 1: Create .env File Locally
Before deploying, create a `.env` file in the project root for local development:

```bash
cp env.example .env
```

Then update `.env` with your actual API keys:
```env
VITE_API_BASE_URL=http://localhost:5000
OPENAI_API_KEY=your_actual_openai_key
PERPLEXITY_API_KEY=your_actual_perplexity_key
N8N_API_KEY=your_actual_n8n_key
N8N_BASE_URL=https://n8n.casamccartney.link
# ... etc
```

**⚠️ Important:** The `.env` file is gitignored and will NOT be pushed to GitHub.

### Step 2: Commit and Push Changes
```bash
git add .
git commit -m "feat: prepare for Render deployment - fix hardcoded URLs and add env config"
git push origin main
```

### Step 3: Deploy on Render

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com](https://dashboard.render.com)
   - Log in to your account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository

3. **Render Auto-Detection**
   - Render will automatically detect `render.yaml`
   - It will use the configuration specified in the file
   - Review the auto-detected settings

4. **Configure Environment Variables**
   
   In the Render dashboard, add the following environment variables:

   **Required Variables:**
   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   PERPLEXITY_API_KEY=your_actual_perplexity_api_key
   N8N_API_KEY=your_actual_n8n_api_key
   N8N_BASE_URL=https://n8n.casamccartney.link
   ```

   **Optional Variables:**
   ```
   AFFINE_API_KEY=your_actual_affine_api_key
   AFFINE_WORKSPACE_ID=your_actual_affine_workspace_id
   PINECONE_API_KEY=your_actual_pinecone_api_key
   ```

   **⚠️ Important:** The following variables are already configured in `render.yaml`:
   - `PYTHONPATH=/app`
   - `HOST=0.0.0.0`
   - `PORT=5000`
   
   You do NOT need to add these manually.

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building your application
   - Build process takes approximately 5-10 minutes

### Step 4: Verify Deployment

Once deployment is complete:

1. **Check Health Endpoint**
   - Visit `https://your-app-name.onrender.com/api/upload/health`
   - Should return health status

2. **Test Frontend**
   - Visit `https://your-app-name.onrender.com`
   - Frontend should load without errors
   - Check browser console for any API errors

3. **Test File Upload**
   - Navigate to Documents tab
   - Try uploading a test file
   - Verify upload works correctly

4. **Test Chat Functionality**
   - Test the chat interface
   - Verify it connects to the backend API
   - Check that responses are received

---

## 🔍 How the Environment Configuration Works

### Development (Local)
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:5000`
- `VITE_API_BASE_URL=http://localhost:5000` in `.env`
- API calls go to localhost backend

### Production (Render)
- Frontend is built and served as static files from `/app/static`
- Backend serves both API and static frontend files
- Both run on the same origin (e.g., `https://your-app.onrender.com`)
- No `VITE_API_BASE_URL` needed - automatically uses `window.location.origin`
- API calls go to the same domain (relative URLs)

### API Configuration Logic
Located in `frontend/src/config/api.ts`:

```typescript
const getApiBaseUrl = (): string => {
  // 1. Check for explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. In production, use same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // 3. Default to localhost for development
  return 'http://localhost:5000';
};
```

---

## 🛠️ Troubleshooting

### Issue: API calls fail with CORS errors
**Solution:** Verify backend CORS is configured correctly in `backend/app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Frontend shows blank page
**Possible causes:**
1. Build failed - Check Render build logs
2. Static files not mounted - Verify Dockerfile copies to `/app/static`
3. JavaScript errors - Check browser console

**Solution:** Check Render logs for build/runtime errors

### Issue: File uploads fail
**Possible causes:**
1. Upload directory not created
2. Permissions issue
3. Disk not mounted

**Solution:** Verify in `render.yaml`:
```yaml
disk:
  name: uploads
  mountPath: /app/uploads
  sizeGB: 1
```

### Issue: Environment variables not working
**Solution:**
1. Verify variables are set in Render dashboard (not in `render.yaml`)
2. Check spelling and capitalization
3. Restart the service after adding variables

### Issue: Health check fails
**Solution:**
1. Verify endpoint exists: `/api/upload/health`
2. Check backend is running on port 5000
3. Review Render logs for startup errors

---

## 📊 Post-Deployment Monitoring

### What to Monitor
1. **Application Logs**: Available in Render dashboard
2. **Health Endpoint**: Monitor `/api/upload/health`
3. **Disk Usage**: Check upload storage usage
4. **API Response Times**: Monitor performance
5. **Error Rates**: Track failed requests

### Render Dashboard Features
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, bandwidth usage
- **Events**: Deployment history
- **Shell**: Access to container shell for debugging

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Application loads at `https://your-app.onrender.com`
- ✅ Health check returns 200 OK
- ✅ Frontend displays without console errors
- ✅ API calls work correctly
- ✅ File uploads function properly
- ✅ Chat interface connects to backend
- ✅ N8N workflows execute successfully
- ✅ No CORS errors in browser console

---

## 📝 Additional Notes

### Automatic Redeployment
- Render automatically redeploys on push to `main` branch
- You can disable auto-deploy in Render settings if needed

### Manual Redeployment
- Go to Render dashboard
- Select your service
- Click "Manual Deploy" → "Deploy latest commit"

### Rollback
- In Render dashboard, go to "Events"
- Find previous successful deployment
- Click "Rollback to this version"

### Scaling
Current configuration in `render.yaml`:
```yaml
scaling:
  minInstances: 1
  maxInstances: 3
```

- Adjust based on your traffic needs
- Higher plans support more instances

---

## 🔐 Security Checklist

- [ ] All API keys are set in Render dashboard (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] CORS is configured appropriately for production
- [ ] Security headers are set in `render.yaml`
- [ ] File upload size limits are enforced
- [ ] File type validation is active
- [ ] Application runs as non-root user in Docker

---

## 📞 Need Help?

- **Render Documentation**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Project Issues**: Check GitHub issues
- **Logs**: Always start with Render logs for debugging

---

**You're all set for deployment! 🚀**

