import React, { useState } from 'react';
import EmbeddedN8nChat from './EmbeddedN8nChat';
import EnhancedChat from './EnhancedChat';
import N8nChatWidget from './N8nChatWidget';
import WorkflowChat from './WorkflowChat';
import WorkflowSelector from './WorkflowSelector';

interface ChatContainer {
  id: string;
  type: 'coordinator' | 'workflow';
  title: string;
  description?: string;
  workflowId?: string;
  webhookUrl?: string;
  agentType?: string;
}

interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  agentType: string;
  webhookUrl: string;
  status: 'active' | 'inactive';
}

interface ChatContainerManagerProps {
  onContainerChange?: (container: ChatContainer) => void;
}

const ChatContainerManager: React.FC<ChatContainerManagerProps> = ({ onContainerChange }) => {
  const [containers, setContainers] = useState<ChatContainer[]>([
    {
      id: 'coordinator',
      type: 'coordinator',
      title: 'AI Coordinator',
      description: 'Your main AI business intelligence coordinator'
    }
  ]);

  const [activeContainerId, setActiveContainerId] = useState<string>('coordinator');
  const [openWorkflowChats, setOpenWorkflowChats] = useState<ChatContainer[]>([]);
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false);
  const [useN8nWidget, setUseN8nWidget] = useState(false); // Default to our custom chat since n8n doesn't have a widget

  const addWorkflowContainer = (workflowInfo: WorkflowInfo) => {
    const newContainer: ChatContainer = {
      id: `workflow-${workflowInfo.id}`,
      type: 'workflow',
      title: workflowInfo.name,
      description: workflowInfo.description,
      workflowId: workflowInfo.id,
      webhookUrl: workflowInfo.webhookUrl,
      agentType: workflowInfo.agentType
    };

    // Add to containers list
    setContainers(prev => [...prev, newContainer]);
    
    // Open the workflow chat
    setOpenWorkflowChats(prev => [...prev, newContainer]);
    
    // Hide the workflow selector
    setShowWorkflowSelector(false);
    
    if (onContainerChange) {
      onContainerChange(newContainer);
    }
  };

  const closeWorkflowChat = (containerId: string) => {
    setOpenWorkflowChats(prev => prev.filter(c => c.id !== containerId));
  };

  const minimizeWorkflowChat = (containerId: string) => {
    // For now, just close it. You can implement minimize logic later if needed
    closeWorkflowChat(containerId);
  };

  const switchContainer = (containerId: string) => {
    setActiveContainerId(containerId);
    
    if (onContainerChange) {
      const container = containers.find(c => c.id === containerId);
      if (container) {
        onContainerChange(container);
      }
    }
  };

  const removeContainer = (containerId: string) => {
    if (containerId === 'coordinator') return; // Don't remove coordinator
    
    setContainers(prev => prev.filter(c => c.id !== containerId));
    
    // If we're removing the active container, switch back to coordinator
    if (activeContainerId === containerId) {
      setActiveContainerId('coordinator');
      if (onContainerChange) {
        const coordinator = containers.find(c => c.id === 'coordinator');
        if (coordinator) {
          onContainerChange(coordinator);
        }
      }
    }
  };

  const activeContainer = containers.find(c => c.id === activeContainerId) || containers[0];

  return (
    <div className="flex h-full">
      {/* Sidebar with container tabs */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Chat Containers</h2>
        
        <div className="space-y-2 mb-4">
          {containers.map((container) => (
            <div
              key={container.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeContainerId === container.id
                  ? 'bg-blue-100 border border-blue-300 text-blue-800'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => switchContainer(container.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{container.title}</div>
                  {container.description && (
                    <div className="text-xs text-gray-500 mt-1">{container.description}</div>
                  )}
                </div>
                
                {container.type === 'workflow' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeContainer(container.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs p-1"
                    title="Remove chat"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Workflow Button */}
        <button
          onClick={() => setShowWorkflowSelector(true)}
          className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium mb-3"
        >
          ➕ Add Workflow
        </button>
        
        {/* Note about n8n integration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-800 text-sm">
            <p className="font-medium">💡 n8n Integration</p>
            <p className="text-xs mt-1">
              Workflow chats use direct webhook communication with n8n for seamless integration.
            </p>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        {showWorkflowSelector ? (
          <WorkflowSelector onWorkflowSelect={addWorkflowContainer} />
        ) : activeContainer.type === 'coordinator' ? (
          <EnhancedChat 
            key="coordinator-chat"
          />
        ) : (
          useN8nWidget ? (
            <N8nChatWidget
              workflowId={activeContainer.workflowId!}
              workflowName={activeContainer.title}
              webhookUrl={activeContainer.webhookUrl!}
              onClose={() => removeContainer(activeContainer.id)}
            />
          ) : (
            <WorkflowChat
              workflowId={activeContainer.workflowId!}
              workflowName={activeContainer.title}
              webhookUrl={activeContainer.webhookUrl!}
              onClose={() => removeContainer(activeContainer.id)}
            />
          )
        )}
      </div>

      {/* Embedded n8n Chat Widgets */}
      {openWorkflowChats.map((chat) => (
        <EmbeddedN8nChat
          key={chat.id}
          workflowId={chat.workflowId!}
          title={chat.title}
          description={chat.description}
          webhookUrl={chat.webhookUrl!}
          agentType={chat.agentType!}
          onClose={() => closeWorkflowChat(chat.id)}
          onMinimize={() => minimizeWorkflowChat(chat.id)}
        />
      ))}
    </div>
  );
};

export default ChatContainerManager;
