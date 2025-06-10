const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);  // Changed from 'files' to 'file'

    try {
      console.log('Uploading file:', file.name, 'to session:', sessionId);
      const response = await fetch(`${API_BASE_URL}/api/documents/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header - let the browser set it with the boundary
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.status === 'success') {
        setDocuments(prev => [...prev, {
          filename: data.metadata.filename,
          upload_time: data.metadata.upload_time,
          content_type: data.metadata.content_type,
          file_size: data.metadata.file_size
        }]);

        // Add a system message about the upload
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Document "${file.name}" has been uploaded and processed.`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to upload document: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      setChatStatus('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }; 