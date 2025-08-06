import { useState, useEffect } from 'react';
import { useLLM } from '../contexts/LLMContext';
import { useDatabase } from '../contexts/DatabaseContext';
import './Settings.css';

/**
 * Comprehensive Settings Component
 * 
 * Features:
 * - Application configuration management
 * - LLM provider settings and switching
 * - Database configuration and MongoDB insights
 * - Security and performance settings
 * - Real-time configuration updates
 */
const Settings = () => {
  // Context hooks
  const { providers, currentProvider, switchProvider, refreshProviders } = useLLM();
  const { status: _dbStatus, refreshStatus: _refreshStatus } = useDatabase();

  // State management
  const [activeTab, setActiveTab] = useState('application');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [databaseStats, setDatabaseStats] = useState(null);
  const [mongodbInsights, setMongodbInsights] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadDatabaseStats();
    loadMongoDBInsights();
  }, []);

  /**
   * Load current settings from API
   */
  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load database statistics
   */
  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json();
      
      if (data.success) {
        setDatabaseStats(data);
      }
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  /**
   * Load MongoDB insights and analytics
   */
  const loadMongoDBInsights = async () => {
    try {
      const response = await fetch('/api/database/analytics');
      const data = await response.json();
      
      if (data.success) {
        setMongodbInsights(data.analytics);
      }
    } catch (error) {
      console.error('Error loading MongoDB insights:', error);
    }
  };

  /**
   * Save settings to API
   */
  const saveSettings = async (updatedSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle setting change
   */
  const handleSettingChange = (category, key, value) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    // Save immediately for certain settings
    if (['LLM_PROVIDER', 'DATABASE_TYPE'].includes(key)) {
      saveSettings(updatedSettings);
    } else {
      setSettings(updatedSettings);
    }
  };

  /**
   * Handle LLM provider switch
   */
  const handleProviderSwitch = async (providerId) => {
    try {
      await switchProvider(providerId);
      await refreshProviders();
      setMessage({ type: 'success', text: `Switched to ${providers[providerId]?.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to switch provider' });
    }
  };

  /**
   * Test database connection
   */
  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/database/test', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Database connection successful' });
        await loadDatabaseStats();
      } else {
        setMessage({ type: 'error', text: 'Database connection failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error testing database connection' });
    }
  };

  /**
   * Refresh MongoDB insights
   */
  const refreshMongoDBInsights = async () => {
    await loadMongoDBInsights();
    setMessage({ type: 'success', text: 'MongoDB insights refreshed' });
  };

  /**
   * Render tab navigation
   */
  const renderTabs = () => (
    <div className="settings-tabs">
      <button
        className={`tab ${activeTab === 'application' ? 'active' : ''}`}
        onClick={() => setActiveTab('application')}
      >
        Application
      </button>
      <button
        className={`tab ${activeTab === 'llm' ? 'active' : ''}`}
        onClick={() => setActiveTab('llm')}
      >
        AI Providers
      </button>
      <button
        className={`tab ${activeTab === 'database' ? 'active' : ''}`}
        onClick={() => setActiveTab('database')}
      >
        Database
      </button>
      <button
        className={`tab ${activeTab === 'security' ? 'active' : ''}`}
        onClick={() => setActiveTab('security')}
      >
        Security
      </button>
      <button
        className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
        onClick={() => setActiveTab('performance')}
      >
        Performance
      </button>
    </div>
  );

  /**
   * Render application settings
   */
  const renderApplicationSettings = () => (
    <div className="settings-section">
      <h3>Application Configuration</h3>
      
      <div className="setting-group">
        <label>Environment</label>
        <select
          value={settings.NODE_ENV || 'production'}
          onChange={(e) => handleSettingChange('application', 'NODE_ENV', e.target.value)}
        >
          <option value="development">Development</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Domain</label>
        <input
          type="text"
          value={settings.DOMAIN || ''}
          onChange={(e) => handleSettingChange('application', 'DOMAIN', e.target.value)}
          placeholder="your-domain.com"
        />
      </div>

      <div className="setting-group">
        <label>Port</label>
        <input
          type="number"
          value={settings.PORT || 3000}
          onChange={(e) => handleSettingChange('application', 'PORT', parseInt(e.target.value))}
          min="1000"
          max="65535"
        />
      </div>

      <div className="setting-group">
        <label>Log Level</label>
        <select
          value={settings.LOG_LEVEL || 'info'}
          onChange={(e) => handleSettingChange('application', 'LOG_LEVEL', e.target.value)}
        >
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>
    </div>
  );

  /**
   * Render LLM provider settings
   */
  const renderLLMSettings = () => (
    <div className="settings-section">
      <h3>AI Provider Configuration</h3>
      
      <div className="current-provider">
        <h4>Current Provider: {providers[currentProvider]?.name}</h4>
        <span className={`status ${providers[currentProvider]?.status}`}>
          {providers[currentProvider]?.status}
        </span>
      </div>

      <div className="providers-list">
        {Object.entries(providers).map(([id, provider]) => (
          <div key={id} className="provider-item">
            <div className="provider-info">
              <h5>{provider.name}</h5>
              <span className={`status ${provider.status}`}>{provider.status}</span>
              {provider.model && <span className="model">Model: {provider.model}</span>}
            </div>
            <div className="provider-actions">
              <button
                onClick={() => handleProviderSwitch(id)}
                disabled={!provider.available || id === currentProvider}
                className={id === currentProvider ? 'active' : ''}
              >
                {id === currentProvider ? 'Active' : 'Switch'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={refreshProviders} className="refresh-providers">
        Refresh Providers
      </button>
    </div>
  );

  /**
   * Render database settings with MongoDB insights
   */
  const renderDatabaseSettings = () => (
    <div className="settings-section">
      <h3>Database Configuration</h3>
      
      {/* Database Status */}
      <div className="database-status">
        <h4>Database Status</h4>
        {databaseStats && (
          <div className="status-grid">
            <div className="status-item">
              <label>Active Databases:</label>
              <span>{databaseStats.activeDatabases?.join(', ') || 'None'}</span>
            </div>
            <div className="status-item">
              <label>Fallback Mode:</label>
              <span className={databaseStats.fallbackMode ? 'warning' : 'success'}>
                {databaseStats.fallbackMode ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="status-item">
              <label>MongoDB Status:</label>
              <span className={`status ${databaseStats.mongodb?.status}`}>
                {databaseStats.mongodb?.status || 'Unknown'}
              </span>
            </div>
            <div className="status-item">
              <label>SQLite Status:</label>
              <span className={`status ${databaseStats.sqlite?.status}`}>
                {databaseStats.sqlite?.status || 'Unknown'}
              </span>
            </div>
          </div>
        )}
        <button onClick={testDatabaseConnection} className="test-connection">
          Test Connection
        </button>
      </div>

      {/* MongoDB Insights */}
      {mongodbInsights && (
        <div className="mongodb-insights">
          <h4>MongoDB Insights</h4>
          <div className="insights-grid">
            <div className="insight-item">
              <label>Total Collections:</label>
              <span>{mongodbInsights.collections || 0}</span>
            </div>
            <div className="insight-item">
              <label>Total Documents:</label>
              <span>{mongodbInsights.totalDocuments || 0}</span>
            </div>
            <div className="insight-item">
              <label>Database Size:</label>
              <span>{mongodbInsights.size || 'Unknown'}</span>
            </div>
            <div className="insight-item">
              <label>Users:</label>
              <span>{mongodbInsights.users || 0}</span>
            </div>
            <div className="insight-item">
              <label>Listening History:</label>
              <span>{mongodbInsights.listeningHistory || 0}</span>
            </div>
            <div className="insight-item">
              <label>Recommendations:</label>
              <span>{mongodbInsights.recommendations || 0}</span>
            </div>
          </div>
          <button onClick={refreshMongoDBInsights} className="refresh-insights">
            Refresh Insights
          </button>
        </div>
      )}

      {/* Database Configuration */}
      <div className="database-config">
        <h4>Database Configuration</h4>
        <div className="setting-group">
          <label>Primary Database</label>
          <select
            value={settings.DATABASE_TYPE || 'mongodb'}
            onChange={(e) => handleSettingChange('database', 'DATABASE_TYPE', e.target.value)}
          >
            <option value="mongodb">MongoDB</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>Enable Fallback</label>
          <input
            type="checkbox"
            checked={settings.ENABLE_SQLITE_FALLBACK || true}
            onChange={(e) => handleSettingChange('database', 'ENABLE_SQLITE_FALLBACK', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );

  /**
   * Render security settings
   */
  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security Configuration</h3>
      
      <div className="setting-group">
        <label>Force HTTPS</label>
        <input
          type="checkbox"
          checked={settings.FORCE_HTTPS || true}
          onChange={(e) => handleSettingChange('security', 'FORCE_HTTPS', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Enable CORS</label>
        <input
          type="checkbox"
          checked={settings.ENABLE_CORS || true}
          onChange={(e) => handleSettingChange('security', 'ENABLE_CORS', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Rate Limiting</label>
        <input
          type="checkbox"
          checked={settings.RATE_LIMIT_ENABLED || true}
          onChange={(e) => handleSettingChange('security', 'RATE_LIMIT_ENABLED', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Security Headers</label>
        <input
          type="checkbox"
          checked={settings.ENABLE_SECURITY_HEADERS || true}
          onChange={(e) => handleSettingChange('security', 'ENABLE_SECURITY_HEADERS', e.target.checked)}
        />
      </div>
    </div>
  );

  /**
   * Render performance settings
   */
  const renderPerformanceSettings = () => (
    <div className="settings-section">
      <h3>Performance Configuration</h3>
      
      <div className="setting-group">
        <label>Enable Compression</label>
        <input
          type="checkbox"
          checked={settings.COMPRESSION || true}
          onChange={(e) => handleSettingChange('performance', 'COMPRESSION', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Enable Caching</label>
        <input
          type="checkbox"
          checked={settings.CACHE_ENABLED || true}
          onChange={(e) => handleSettingChange('performance', 'CACHE_ENABLED', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Cluster Mode</label>
        <input
          type="checkbox"
          checked={settings.CLUSTER_ENABLED || false}
          onChange={(e) => handleSettingChange('performance', 'CLUSTER_ENABLED', e.target.checked)}
        />
      </div>

      <div className="setting-group">
        <label>Worker Processes</label>
        <select
          value={settings.WORKER_PROCESSES || 'auto'}
          onChange={(e) => handleSettingChange('performance', 'WORKER_PROCESSES', e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
        </select>
      </div>
    </div>
  );

  /**
   * Render current tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'application':
        return renderApplicationSettings();
      case 'llm':
        return renderLLMSettings();
      case 'database':
        return renderDatabaseSettings();
      case 'security':
        return renderSecuritySettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return renderApplicationSettings();
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure EchoTune AI to match your preferences and requirements</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-message">×</button>
        </div>
      )}

      {renderTabs()}
      
      <div className="settings-content">
        {renderTabContent()}
      </div>

      <div className="settings-actions">
        <button
          onClick={() => saveSettings(settings)}
          disabled={saving}
          className="save-settings"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button onClick={loadSettings} className="reset-settings">
          Reset
        </button>
      </div>
    </div>
  );
};

export default Settings;