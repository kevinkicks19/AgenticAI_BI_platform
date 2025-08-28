import React, { useEffect, useRef } from 'react';

interface N8nChatWidgetProps {
  workflowId: string;
  workflowName: string;
  webhookUrl: string;
  onClose: () => void;
}

const N8nChatWidget: React.FC<N8nChatWidgetProps> = ({
  workflowId,
  workflowName,
  webhookUrl,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract the base URL from the webhook URL
  const getN8nBaseUrl = (webhookUrl: string) => {
    try {
      const url = new URL(webhookUrl);
      return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
    } catch {
      // Fallback to the webhook URL without the webhook path
      return webhookUrl.replace(/\/webhook\/.*$/, '');
    }
  };

  const n8nBaseUrl = getN8nBaseUrl(webhookUrl);
  
  // Construct the chat widget URL
  // Note: This is a placeholder - you'll need to check n8n's actual chat widget endpoint
  const chatWidgetUrl = `${n8nBaseUrl}/chat-widget?workflow=${workflowId}`;

  useEffect(() => {
    // Focus the iframe when component mounts
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  }, []);

  return (
    <div className="n8n-chat-widget-container">
      <div className="n8n-chat-widget-header">
        <h3>Chat with {workflowName}</h3>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>
      
      <div className="n8n-chat-widget-content">
        {/* Fallback message if iframe doesn't load */}
        <div className="n8n-chat-fallback">
          <p>Connecting to {workflowName} workflow...</p>
          <p className="text-sm text-gray-500">
            If the chat widget doesn't load, you can also interact directly via the webhook:
          </p>
          <code className="text-xs bg-gray-100 p-2 rounded block mt-2">
            {webhookUrl}
          </code>
        </div>
        
        {/* n8n Chat Widget iframe */}
        <iframe
          ref={iframeRef}
          src={chatWidgetUrl}
          title={`${workflowName} Chat Widget`}
          className="n8n-chat-iframe"
          frameBorder="0"
          allow="microphone; camera; geolocation"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
      
      {/* Alternative: Direct webhook interaction */}
      <div className="n8n-chat-alternative">
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Alternative: Direct Webhook Interaction
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              You can also send messages directly to this workflow:
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Handle direct webhook call
                    const message = (e.target as HTMLInputElement).value;
                    if (message.trim()) {
                      fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message, timestamp: new Date().toISOString() })
                      }).then(() => {
                        (e.target as HTMLInputElement).value = '';
                      });
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Press Enter to send directly to the workflow webhook
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default N8nChatWidget;
