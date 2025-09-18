# Agentic AI BI Platform - Render Deployment Ready

## 🚀 Quick Start

This application is now ready for deployment to Render with full document upload functionality!

### What's New

✅ **File Upload System**: Complete document upload functionality with support for PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, PNG, JPG, JPEG, GIF, WEBP files

✅ **Text Extraction**: Automatic text extraction from uploaded documents

✅ **Document Management**: View, download, and organize uploaded files

✅ **Affine Integration**: Upload files directly to Affine workspace

✅ **Production Ready**: Optimized Dockerfile with security features

✅ **Render Configuration**: Complete `render.yaml` setup for easy deployment

## 📁 File Structure

```
AgenticAI_BI_platform/
├── backend/
│   ├── file_upload_routes.py    # New file upload endpoints
│   ├── requirements.txt         # Updated with file processing dependencies
│   └── app.py                   # Updated to include upload routes
├── frontend/src/components/
│   └── DocumentManager.tsx      # Updated with upload functionality
├── render.yaml                  # Render deployment configuration
├── Dockerfile                   # Production-optimized container
├── PRODUCTION_DEPLOYMENT.md     # Deployment guide
└── test_upload.py              # Test script for upload functionality
```

## 🔧 Features Added

### Backend Features
- **File Upload API**: `/api/upload/document` endpoint for file uploads
- **Document Management**: List, view, download, and delete uploaded files
- **Text Extraction**: Automatic text extraction from PDF, DOC, DOCX, TXT files
- **File Validation**: Type and size validation (max 10MB)
- **Metadata Storage**: JSON metadata files for each uploaded document
- **Health Monitoring**: `/api/upload/health` endpoint for monitoring

### Frontend Features
- **Upload Modal**: User-friendly file upload interface
- **Document Grid**: Display both Affine and uploaded documents
- **File Icons**: Visual file type indicators
- **Download Functionality**: Direct download links for uploaded files
- **Search & Filter**: Search and filter uploaded documents
- **Progress Indicators**: Upload progress and status feedback

## 🚀 Deployment to Render

### Step 1: Prepare Your Repository
1. Push all changes to your GitHub repository
2. Ensure `render.yaml` is in the root directory
3. Verify `Dockerfile` is present and updated

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration
5. Set your environment variables (see below)

### Step 3: Environment Variables
Set these in your Render service settings:

**Required:**
- `OPENAI_API_KEY`: Your OpenAI API key
- `PERPLEXITY_API_KEY`: Your Perplexity API key  
- `N8N_API_KEY`: Your N8N API key
- `N8N_BASE_URL`: Your N8N instance URL

**Optional:**
- `AFFINE_API_KEY`: Your Affine API key
- `AFFINE_WORKSPACE_ID`: Your Affine workspace ID

## 🧪 Testing

### Local Testing
Run the test script to verify upload functionality:

```bash
# Start your local server first
cd AgenticAI_BI_platform
python backend/app.py

# In another terminal, run the test
python test_upload.py
```

### Production Testing
1. Deploy to Render
2. Visit your deployed URL
3. Navigate to the Documents tab
4. Click "Upload File" to test the upload functionality

## 📊 File Upload Capabilities

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT, CSV, XLSX, XLS
- **Images**: PNG, JPG, JPEG, GIF, WEBP
- **Maximum Size**: 10MB per file

### Features
- **Automatic Text Extraction**: Extract text from documents for search
- **File Metadata**: Store file information and properties
- **Download Links**: Direct download access to original files
- **Integration Ready**: Upload files directly to Affine workspace

## 🔒 Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: 10MB maximum file size
- **Non-root User**: Application runs as non-root user in container
- **Health Monitoring**: Built-in health checks
- **CORS Configuration**: Proper API access controls

## 📈 Monitoring

- **Health Endpoint**: `/api/upload/health` for service monitoring
- **Render Logs**: Application logs available in Render dashboard
- **File Storage**: 1GB disk space allocated for uploads
- **Performance**: Built-in metrics and monitoring

## 🆘 Troubleshooting

### Common Issues
1. **Upload Fails**: Check file size (max 10MB) and file type
2. **API Errors**: Verify all API keys are set correctly
3. **Build Failures**: Ensure all dependencies are in requirements.txt

### Support
- Check Render logs for detailed error messages
- Verify environment variables in Render dashboard
- Test API endpoints using the health check

## 🎯 Next Steps

1. **Deploy to Render**: Use the provided configuration
2. **Set Environment Variables**: Add your API keys
3. **Test Upload Functionality**: Verify file uploads work
4. **Configure Affine**: Set up Affine integration if needed
5. **Monitor Performance**: Use Render's monitoring tools

Your Agentic AI BI Platform is now ready for production deployment with full document upload capabilities! 🚀
