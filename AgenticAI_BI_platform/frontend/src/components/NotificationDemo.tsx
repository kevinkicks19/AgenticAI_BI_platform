import React from 'react';
import { useNotificationHelpers } from '../contexts/NotificationContext';

const NotificationDemo: React.FC = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWorkflowNotification,
    showSystemNotification,
  } = useNotificationHelpers();

  const handleSuccessNotification = () => {
    showSuccess(
      'Workflow Completed',
      'Data analysis workflow has been completed successfully.',
      [
        {
          label: 'View Results',
          action: () => console.log('Viewing results...'),
          variant: 'primary'
        }
      ]
    );
  };

  const handleErrorNotification = () => {
    showError(
      'Workflow Failed',
      'The document processing workflow encountered an error and could not complete.',
      [
        {
          label: 'Retry',
          action: () => console.log('Retrying workflow...'),
          variant: 'primary'
        },
        {
          label: 'View Logs',
          action: () => console.log('Viewing logs...'),
          variant: 'secondary'
        }
      ]
    );
  };

  const handleWarningNotification = () => {
    showWarning(
      'High Memory Usage',
      'System memory usage is above 85%. Consider closing unused workflows.',
      [
        {
          label: 'Optimize',
          action: () => console.log('Optimizing system...'),
          variant: 'primary'
        }
      ]
    );
  };

  const handleInfoNotification = () => {
    showInfo(
      'New Feature Available',
      'The enhanced chat interface is now available with markdown support and message templates.',
      [
        {
          label: 'Learn More',
          action: () => console.log('Learning more...'),
          variant: 'primary'
        }
      ]
    );
  };

  const handleWorkflowNotification = () => {
    showWorkflowNotification(
      'Workflow Started',
      'Sales data analysis workflow has been initiated and is currently running.',
      'sales_analysis_workflow_001',
      [
        {
          label: 'Monitor',
          action: () => console.log('Monitoring workflow...'),
          variant: 'primary'
        },
        {
          label: 'Cancel',
          action: () => console.log('Cancelling workflow...'),
          variant: 'danger'
        }
      ]
    );
  };

  const handleSystemNotification = () => {
    showSystemNotification(
      'System Maintenance',
      'Scheduled maintenance will begin in 30 minutes. Please save your work.',
      [
        {
          label: 'Schedule Later',
          action: () => console.log('Scheduling maintenance...'),
          variant: 'primary'
        }
      ]
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification System Demo</h2>
      <p className="text-gray-600 mb-6">
        Click the buttons below to test different types of notifications. Check the notification bell in the sidebar to see them.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={handleSuccessNotification}
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-900">Success Notification</span>
          </div>
          <p className="text-sm text-green-700">Test a successful workflow completion notification</p>
        </button>

        <button
          onClick={handleErrorNotification}
          className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-900">Error Notification</span>
          </div>
          <p className="text-sm text-red-700">Test an error notification with retry options</p>
        </button>

        <button
          onClick={handleWarningNotification}
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-900">Warning Notification</span>
          </div>
          <p className="text-sm text-yellow-700">Test a system warning notification</p>
        </button>

        <button
          onClick={handleInfoNotification}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">Info Notification</span>
          </div>
          <p className="text-sm text-blue-700">Test an informational notification</p>
        </button>

        <button
          onClick={handleWorkflowNotification}
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-900">Workflow Notification</span>
          </div>
          <p className="text-sm text-purple-700">Test a workflow-specific notification</p>
        </button>

        <button
          onClick={handleSystemNotification}
          className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="font-medium text-gray-900">System Notification</span>
          </div>
          <p className="text-sm text-gray-700">Test a system maintenance notification</p>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Notification Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Real-time notifications with different types and priorities</li>
          <li>• Action buttons for quick responses</li>
          <li>• Auto-dismiss for non-persistent notifications</li>
          <li>• Unread count badge on the notification bell</li>
          <li>• Browser notifications (with permission)</li>
          <li>• Mark as read and remove functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationDemo;
