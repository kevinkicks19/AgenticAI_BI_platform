# Production Deployment Guide for Agentic AI BI Platform

## Environment Variables Required

### Required API Keys
- `OPENAI_API_KEY`: Your OpenAI API key for AI functionality
- `PERPLEXITY_API_KEY`: Your Perplexity API key for research features
- `N8N_API_KEY`: Your N8N API key for workflow integration
- `N8N_BASE_URL`: Your N8N instance URL (e.g., https://your-n8n-instance.com)

### Optional API Keys
- `AFFINE_API_KEY`: Your Affine API key for document management
- `AFFINE_WORKSPACE_ID`: Your Affine workspace ID

### Application Settings
- `PYTHONPATH`: Set to `/app`
- `HOST`: Set to `0.0.0.0`
- `PORT`: Set to `5000`
- `PYTHONUNBUFFERED`: Set to `1`

## Render Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Create Web Service**: Use the `render.yaml` configuration file
3. **Set Environment Variables**: Add all required API keys in Render dashboard
4. **Deploy**: Render will automatically build and deploy using Docker

## File Upload Features

The application now supports:
- **File Upload**: PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, PNG, JPG, JPEG, GIF, WEBP
- **Text Extraction**: Automatic text extraction from uploaded files
- **File Management**: View, download, and organize uploaded documents
- **Integration**: Upload files directly to Affine workspace

## Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **File Size Limits**: Maximum 10MB per file
- **Non-root User**: Application runs as non-root user in container
- **Health Checks**: Built-in health monitoring
- **CORS Configuration**: Proper CORS headers for API access

## Storage

- **Persistent Storage**: Uploads are stored in `/app/uploads` directory
- **Render Disk**: 1GB disk space allocated for file storage
- **File Metadata**: JSON metadata files track document information

## Monitoring

- **Health Endpoint**: `/api/upload/health` for monitoring
- **Logs**: Application logs available in Render dashboard
- **Metrics**: Built-in performance monitoring

## Troubleshooting

### Common Issues
1. **File Upload Fails**: Check file size and type restrictions
2. **API Errors**: Verify all API keys are correctly set
3. **Build Failures**: Ensure all dependencies are in requirements.txt

### Support
- Check Render logs for detailed error messages
- Verify environment variables are set correctly
- Test API endpoints using the health check endpoint
