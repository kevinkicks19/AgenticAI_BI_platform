# 🤖 n8n Workflow Setup for Document Processing

## 📋 Overview

Your Agentic AI BI Platform is designed to automatically trigger n8n workflows when documents are uploaded. This guide shows you how to set up powerful automation workflows.

## 🔧 Prerequisites

1. **n8n Instance**: Running n8n server (cloud or self-hosted)
2. **API Keys**: Configure in your n8n instance:
   - OpenAI API key for AI analysis
   - Google Drive API for backups
   - Slack API for notifications
   - Affine API for workspace sync

## 🚀 Available Workflows

### 1. Document Analysis Workflow
**File**: `n8n-workflows/document-analysis-workflow.json`

**What it does**:
- Receives document upload notifications
- Analyzes content with GPT-4
- Extracts key insights, summaries, action items
- Sends analysis back to your app

**Webhook URL**: `https://your-n8n-instance.com/webhook/document-analysis`

### 2. Document Backup & Sync Workflow
**File**: `n8n-workflows/document-backup-workflow.json`

**What it does**:
- Backs up documents to Google Drive
- Syncs document info to Affine workspace
- Sends team notifications via Slack

**Webhook URL**: `https://your-n8n-instance.com/webhook/document-backup`

## 📥 How to Import Workflows

### Step 1: Access n8n Interface
1. Open your n8n instance dashboard
2. Click "Workflows" in the sidebar
3. Click "Import from URL/File"

### Step 2: Import Workflow Files
1. Select "Import from File"
2. Upload the JSON files from `n8n-workflows/` directory
3. Click "Import"

### Step 3: Configure Credentials
For each workflow, set up the required credentials:

#### OpenAI Credential
- Name: `OpenAI`
- API Key: Your OpenAI API key

#### Google Drive Credential (for backup workflow)
- Name: `Google Drive`
- OAuth2 authentication or Service Account

#### Slack Credential (for backup workflow)
- Name: `Slack`
- Bot Token or OAuth2

#### Affine Credential (for backup workflow)
- Name: `Affine`
- API Key and Workspace ID

### Step 4: Update Webhook URLs
In your app's `workflow_trigger.py`, update the webhook URLs:

```python
# Update these URLs in workflow_trigger.py
WORKFLOW_ENDPOINTS = {
    "document_processing": "https://your-n8n-instance.com/webhook/document-analysis",
    "document_backup": "https://your-n8n-instance.com/webhook/document-backup",
    "vector_indexing": "https://your-n8n-instance.com/webhook/vector-indexing"
}
```

### Step 5: Activate Workflows
1. Open each imported workflow
2. Click the "Active" toggle to enable it
3. Test with a sample document upload

## 🧪 Testing Your Workflows

### Test Document Analysis
```bash
curl -X POST https://your-n8n-instance.com/webhook/document-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "file_id": "test-123",
      "original_filename": "test-report.pdf",
      "document_type": "business_report",
      "extracted_text": "This is a test business report with key metrics and insights..."
    }
  }'
```

### Test Document Backup
```bash
curl -X POST https://your-n8n-instance.com/webhook/document-backup \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "file_id": "test-456",
      "original_filename": "quarterly-data.xlsx",
      "document_type": "spreadsheet",
      "file_size": 2048000,
      "upload_time": "2024-01-15T10:30:00Z"
    }
  }'
```

## 🔄 How Integration Works

### Upload Flow with n8n
```
1. User uploads document → Your App
2. Document saved & processed → Your App
3. Webhook triggered → n8n Workflow
4. AI analysis/backup/sync → n8n
5. Results sent back → Your App
6. User sees enriched document → Frontend
```

### Workflow Triggers in Your App
Your app automatically calls n8n workflows via `workflow_trigger.py`:

```python
# This happens automatically on document upload
async def trigger_document_processing(document_metadata):
    workflows = [
        "document_processing",  # AI analysis
        "document_backup",      # Backup & sync
        "vector_indexing"       # Vector store processing
    ]
    
    results = {}
    for workflow in workflows:
        result = await trigger_workflow(workflow, document_metadata)
        results[workflow] = result
    
    return results
```

## 🎯 Advanced Workflow Ideas

### 3. Document Classification Workflow
- Auto-categorize documents by content
- Route to different processing pipelines
- Update document metadata automatically

### 4. Compliance Checking Workflow
- Check documents against compliance rules
- Flag potential issues
- Generate compliance reports

### 5. Document Summarization Workflow
- Generate executive summaries
- Create bullet-point highlights
- Extract key metrics and KPIs

### 6. Multi-Language Processing Workflow
- Detect document language
- Translate content if needed
- Process in native language

## 🔧 Customization Tips

### Adding New Workflows
1. Create new JSON file in `n8n-workflows/`
2. Add webhook endpoint to `workflow_trigger.py`
3. Import and activate in n8n
4. Test with sample data

### Modifying Existing Workflows
1. Edit workflow in n8n interface
2. Export updated JSON
3. Save to your repository
4. Document changes in this file

## 🐛 Troubleshooting

### Common Issues
1. **Webhook not triggering**: Check n8n URL and API key
2. **Missing credentials**: Verify all API keys are configured
3. **Workflow errors**: Check n8n execution logs
4. **Timeout issues**: Increase timeout values in HTTP Request nodes

### Debug Mode
Enable debug logging in your app:
```python
# In config.py
DEBUG = True
WORKFLOW_DEBUG = True
```

## 📊 Monitoring & Analytics

### Workflow Performance
- Monitor execution times in n8n dashboard
- Track success/failure rates
- Set up alerts for workflow failures

### Document Processing Metrics
- Documents processed per day
- Average processing time
- Most common document types
- User engagement with processed content

---

**Next Steps**: 
1. Import the provided workflows into your n8n instance
2. Configure the required API credentials
3. Update webhook URLs in your app
4. Test with sample document uploads
5. Monitor workflow performance and optimize as needed

