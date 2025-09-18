import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Notification, NotificationAction } from '../components/NotificationSystem';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }

    // Show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper functions for common notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const showSuccess = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'success',
      title,
      message,
      persistent: false,
      actions,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should persist until dismissed
      actions,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'warning',
      title,
      message,
      persistent: false,
      actions,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'info',
      title,
      message,
      persistent: false,
      actions,
    });
  }, [addNotification]);

  const showWorkflowNotification = useCallback((
    title: string,
    message: string,
    workflowId?: string,
    actions?: NotificationAction[]
  ) => {
    addNotification({
      type: 'workflow',
      title,
      message,
      persistent: false,
      actions,
      metadata: { workflowId },
    });
  }, [addNotification]);

  const showSystemNotification = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'system',
      title,
      message,
      persistent: false,
      actions,
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWorkflowNotification,
    showSystemNotification,
  };
};
