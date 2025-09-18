import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationSystem from './NotificationSystem';

const NotificationBell: React.FC = () => {
  const { notifications, markAsRead, removeNotification } = useNotifications();

  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for notification ${id}`);
    // Handle specific actions here
  };

  return (
    <NotificationSystem
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onRemove={removeNotification}
      onAction={handleAction}
    />
  );
};

export default NotificationBell;
