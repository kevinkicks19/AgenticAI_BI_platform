import { Bell, Database, Palette, RotateCcw, Save, Settings, Shield, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    workflowUpdates: boolean;
    systemAlerts: boolean;
    chatMessages: boolean;
  };
  chat: {
    autoSave: boolean;
    messageHistory: number;
    typingIndicators: boolean;
    soundEffects: boolean;
    defaultAgent: string;
  };
  workflows: {
    autoExecute: boolean;
    confirmationRequired: boolean;
    timeoutMinutes: number;
    retryAttempts: number;
  };
  data: {
    autoBackup: boolean;
    retentionDays: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  security: {
    sessionTimeout: number;
    twoFactorAuth: boolean;
    apiKeyRotation: number;
    auditLogging: boolean;
  };
}

interface SystemConfig {
  apiEndpoint: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
  };
}

const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: false,
      workflowUpdates: true,
      systemAlerts: true,
      chatMessages: true,
    },
    chat: {
      autoSave: true,
      messageHistory: 100,
      typingIndicators: true,
      soundEffects: false,
      defaultAgent: 'triage',
    },
    workflows: {
      autoExecute: false,
      confirmationRequired: true,
      timeoutMinutes: 30,
      retryAttempts: 3,
    },
    data: {
      autoBackup: true,
      retentionDays: 90,
      compressionEnabled: true,
      encryptionEnabled: true,
    },
    security: {
      sessionTimeout: 3600,
      twoFactorAuth: false,
      apiKeyRotation: 90,
      auditLogging: true,
    },
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    apiEndpoint: 'http://localhost:5000',
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'docx', 'xlsx', 'csv', 'txt'],
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
    },
    logging: {
      level: 'info',
      retention: 30,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    const savedSystemConfig = localStorage.getItem('systemConfig');
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
    if (savedSystemConfig) {
      setSystemConfig(JSON.parse(savedSystemConfig));
    }
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [preferences, systemConfig]);

  const handlePreferenceChange = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSystemConfigChange = (key: string, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      localStorage.setItem('systemConfig', JSON.stringify(systemConfig));
      
      // Apply theme immediately
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (preferences.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto theme - use system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      setHasChanges(false);
      
      // Show success message (you could add a toast notification here)
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('systemConfig');
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat', label: 'Chat', icon: Settings },
    { id: 'workflows', label: 'Workflows', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', 'language', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) => handlePreferenceChange('timezone', 'timezone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => handlePreferenceChange('dateFormat', 'dateFormat', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-600">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'push' && 'Receive push notifications in browser'}
                  {key === 'workflowUpdates' && 'Get notified when workflows complete'}
                  {key === 'systemAlerts' && 'Receive system alerts and warnings'}
                  {key === 'chatMessages' && 'Get notified of new chat messages'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePreferenceChange('notifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'light', label: 'Light', description: 'Clean and bright interface' },
                { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
                { value: 'auto', label: 'Auto', description: 'Follow system preference' },
              ].map((theme) => (
                <div
                  key={theme.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferences.theme === theme.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePreferenceChange('theme', 'theme', theme.value)}
                >
                  <h4 className="font-medium text-gray-900">{theme.label}</h4>
                  <p className="text-sm text-gray-600">{theme.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Preferences</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message History Limit
              </label>
              <input
                type="number"
                value={preferences.chat.messageHistory}
                onChange={(e) => handlePreferenceChange('chat', 'messageHistory', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                max="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Agent
              </label>
              <select
                value={preferences.chat.defaultAgent}
                onChange={(e) => handlePreferenceChange('chat', 'defaultAgent', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="triage">Triage Agent</option>
                <option value="data_analyst">Data Analyst</option>
                <option value="document_processor">Document Processor</option>
                <option value="workflow_orchestrator">Workflow Orchestrator</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(preferences.chat).filter(([key]) => typeof preferences.chat[key as keyof typeof preferences.chat] === 'boolean').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {key === 'autoSave' && 'Automatically save chat history'}
                    {key === 'typingIndicators' && 'Show typing indicators'}
                    {key === 'soundEffects' && 'Play sound effects for messages'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => handlePreferenceChange('chat', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkflowSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Configuration</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (minutes)
              </label>
              <input
                type="number"
                value={preferences.workflows.timeoutMinutes}
                onChange={(e) => handlePreferenceChange('workflows', 'timeoutMinutes', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="120"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Attempts
              </label>
              <input
                type="number"
                value={preferences.workflows.retryAttempts}
                onChange={(e) => handlePreferenceChange('workflows', 'retryAttempts', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="10"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(preferences.workflows).filter(([key]) => typeof preferences.workflows[key as keyof typeof preferences.workflows] === 'boolean').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {key === 'autoExecute' && 'Automatically execute approved workflows'}
                    {key === 'confirmationRequired' && 'Require confirmation before executing workflows'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => handlePreferenceChange('workflows', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (seconds)
              </label>
              <input
                type="number"
                value={preferences.security.sessionTimeout}
                onChange={(e) => handlePreferenceChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="300"
                max="86400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key Rotation (days)
              </label>
              <input
                type="number"
                value={preferences.security.apiKeyRotation}
                onChange={(e) => handlePreferenceChange('security', 'apiKeyRotation', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(preferences.security).filter(([key]) => typeof preferences.security[key as keyof typeof preferences.security] === 'boolean').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {key === 'twoFactorAuth' && 'Enable two-factor authentication'}
                    {key === 'auditLogging' && 'Enable audit logging for security events'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => handlePreferenceChange('security', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'chat':
        return renderChatSettings();
      case 'workflows':
        return renderWorkflowSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Settings
          </h2>
          <p className="text-sm text-gray-600">Customize your experience</p>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 border border-blue-300 text-blue-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label} Settings
              </h1>
              <p className="text-gray-600">
                Configure your preferences and system settings
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  • Unsaved changes
                </span>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
