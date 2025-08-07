import React, { useState, useEffect } from 'react';
import './EnhancedAdvancedSettings.css';

/**
 * Enhanced Advanced Settings Component
 * 
 * Comprehensive configuration interface with:
 * - Multi-provider LLM configuration (OpenAI, Gemini, OpenRouter)
 * - Model selection and parameter tuning
 * - Database insights and management
 * - Environment and API configuration
 * - Real-time system monitoring
 * - Modern responsive design
 */
const EnhancedAdvancedSettings = () => {
  // State management
  const [activeTab, setActiveTab] = useState('llm-providers');
  const [settings, setSettings] = useState({});
  const [systemStatus, setSystemStatus] = useState({});
  const [databaseInsights, setDatabaseInsights] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // LLM Provider configurations
  const [llmProviders, setLlmProviders] = useState({
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    gemini: {
      enabled: true,
      apiKey: '',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 4096,
      topK: 40,
      topP: 0.95,
    },
    openrouter: {
      enabled: false,
      apiKey: '',
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      site_url: '',
      app_name: 'EchoTune AI',
    },
    mock: {
      enabled: true,
      fallback: true,
    }
  });

  // Available models for each provider
  const availableModels = {
    openai: [
      'gpt-4o',
      'gpt-4o-mini', 
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ],
    gemini: [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro'
    ],
    openrouter: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-haiku',
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct',
      'mistralai/mixtral-8x7b-instruct'
    ]
  };

  // Component lifecycle
  useEffect(() => {
    loadAllSettings();
    loadSystemStatus();
    loadDatabaseInsights();
  }, []);

  /**
   * Load all settings from API
   */
  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [settingsResponse, configResponse] = await Promise.all([
        fetch('/api/settings/config'),
        fetch('/api/settings/llm-providers')
      ]);
      
      const settingsData = await settingsResponse.json();
      const configData = await configResponse.json();
      
      if (settingsData.success) {
        setSettings(settingsData.config);
      }
      
      if (configData.success) {
        setLlmProviders(prev => ({ ...prev, ...configData.providers }));
      }
    } catch (error) {
      showMessage('error', 'Failed to load settings');
      console.error('Settings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load system status and health
   */
  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('System status load error:', error);
    }
  };

  /**
   * Load database insights and analytics
   */
  const loadDatabaseInsights = async () => {
    try {
      const response = await fetch('/api/analytics/overview');
      const data = await response.json();
      if (data.success) {
        setDatabaseInsights(data.data);
      }
    } catch (error) {
      console.error('Database insights load error:', error);
    }
  };

  /**
   * Save LLM provider configuration
   */
  const saveLLMProviders = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/llm-providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers: llmProviders }),
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'LLM provider settings saved successfully');
      } else {
        showMessage('error', 'Failed to save LLM provider settings');
      }
    } catch (error) {
      showMessage('error', 'Error saving LLM provider settings');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test LLM provider connection
   */
  const testProvider = async (providerName) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/test-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          provider: providerName,
          config: llmProviders[providerName]
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', `${providerName} connection test successful`);
      } else {
        showMessage('error', `${providerName} connection test failed: ${data.error}`);
      }
    } catch (error) {
      showMessage('error', `${providerName} connection test failed`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update LLM provider setting
   */
  const updateLLMProvider = (provider, field, value) => {
    setLlmProviders(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  /**
   * Show message to user
   */
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /**
   * Render tab navigation
   */
  const renderTabs = () => {
    const tabs = [
      { id: 'llm-providers', label: '🤖 LLM Providers', icon: '⚡' },
      { id: 'database', label: '🗄️ Database Insights', icon: '📊' },
      { id: 'api-config', label: '🔧 API Configuration', icon: '⚙️' },
      { id: 'system-monitor', label: '📈 System Monitor', icon: '💻' },
      { id: 'environment', label: '🌍 Environment', icon: '🔐' }
    ];

    return (
      <div className="enhanced-settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render LLM Providers configuration
   */
  const renderLLMProviders = () => (
    <div className="enhanced-section">
      <div className="section-header">
        <h3>🤖 AI Language Model Providers</h3>
        <p>Configure and manage multiple LLM providers for enhanced chat capabilities</p>
      </div>

      <div className="providers-grid">
        {Object.entries(llmProviders).map(([providerName, config]) => {
          if (providerName === 'mock') return null;
          
          return (
            <div key={providerName} className="provider-card">
              <div className="provider-header">
                <div className="provider-info">
                  <h4>{providerName.charAt(0).toUpperCase() + providerName.slice(1)}</h4>
                  <div className="provider-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => updateLLMProvider(providerName, 'enabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span>{config.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                <button 
                  className="test-provider-btn"
                  onClick={() => testProvider(providerName)}
                  disabled={!config.enabled || loading}
                >
                  Test Connection
                </button>
              </div>

              {config.enabled && (
                <div className="provider-config">
                  {/* API Key Configuration */}
                  <div className="config-group">
                    <label>API Key</label>
                    <div className="secure-input">
                      <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => updateLLMProvider(providerName, 'apiKey', e.target.value)}
                        placeholder={`Enter your ${providerName} API key`}
                        className="api-key-input"
                      />
                      <span className="input-icon">🔐</span>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="config-group">
                    <label>Model</label>
                    <select
                      value={config.model}
                      onChange={(e) => updateLLMProvider(providerName, 'model', e.target.value)}
                      className="model-select"
                    >
                      {availableModels[providerName]?.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* Advanced Parameters */}
                  <div className="advanced-params">
                    <h5>Advanced Parameters</h5>
                    <div className="params-grid">
                      <div className="param-item">
                        <label>Temperature</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={config.temperature}
                          onChange={(e) => updateLLMProvider(providerName, 'temperature', parseFloat(e.target.value))}
                          className="param-slider"
                        />
                        <span className="param-value">{config.temperature}</span>
                      </div>

                      <div className="param-item">
                        <label>Max Tokens</label>
                        <input
                          type="number"
                          min="1"
                          max="32768"
                          value={config.maxTokens}
                          onChange={(e) => updateLLMProvider(providerName, 'maxTokens', parseInt(e.target.value))}
                          className="param-input"
                        />
                      </div>

                      {providerName === 'openai' && (
                        <>
                          <div className="param-item">
                            <label>Top P</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={config.topP}
                              onChange={(e) => updateLLMProvider(providerName, 'topP', parseFloat(e.target.value))}
                              className="param-slider"
                            />
                            <span className="param-value">{config.topP}</span>
                          </div>
                          <div className="param-item">
                            <label>Frequency Penalty</label>
                            <input
                              type="range"
                              min="-2"
                              max="2"
                              step="0.1"
                              value={config.frequencyPenalty}
                              onChange={(e) => updateLLMProvider(providerName, 'frequencyPenalty', parseFloat(e.target.value))}
                              className="param-slider"
                            />
                            <span className="param-value">{config.frequencyPenalty}</span>
                          </div>
                        </>
                      )}

                      {providerName === 'gemini' && (
                        <>
                          <div className="param-item">
                            <label>Top K</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={config.topK}
                              onChange={(e) => updateLLMProvider(providerName, 'topK', parseInt(e.target.value))}
                              className="param-input"
                            />
                          </div>
                          <div className="param-item">
                            <label>Top P</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={config.topP}
                              onChange={(e) => updateLLMProvider(providerName, 'topP', parseFloat(e.target.value))}
                              className="param-slider"
                            />
                            <span className="param-value">{config.topP}</span>
                          </div>
                        </>
                      )}

                      {providerName === 'openrouter' && (
                        <>
                          <div className="param-item">
                            <label>Site URL</label>
                            <input
                              type="url"
                              value={config.site_url}
                              onChange={(e) => updateLLMProvider(providerName, 'site_url', e.target.value)}
                              placeholder="https://yoursite.com"
                              className="param-input"
                            />
                          </div>
                          <div className="param-item">
                            <label>App Name</label>
                            <input
                              type="text"
                              value={config.app_name}
                              onChange={(e) => updateLLMProvider(providerName, 'app_name', e.target.value)}
                              className="param-input"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="providers-actions">
        <button 
          className="save-providers-btn primary"
          onClick={saveLLMProviders}
          disabled={saving}
        >
          {saving ? '💾 Saving...' : '💾 Save LLM Configuration'}
        </button>
        <button 
          className="test-all-btn secondary"
          onClick={() => {
            Object.keys(llmProviders).forEach(provider => {
              if (provider !== 'mock' && llmProviders[provider].enabled) {
                testProvider(provider);
              }
            });
          }}
          disabled={loading}
        >
          🧪 Test All Enabled Providers
        </button>
      </div>
    </div>
  );

  /**
   * Render Database Insights
   */
  const renderDatabaseInsights = () => (
    <div className="enhanced-section">
      <div className="section-header">
        <h3>🗄️ Database Insights & Management</h3>
        <p>Monitor MongoDB performance and manage your data</p>
      </div>

      <div className="database-overview">
        <div className="db-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Collections</h4>
              <span className="stat-value">{databaseInsights.collections || '0'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <h4>Data Size</h4>
              <span className="stat-value">{databaseInsights.dataSize || '0 MB'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗂️</div>
            <div className="stat-content">
              <h4>Storage Size</h4>
              <span className="stat-value">{databaseInsights.storageSize || '0 MB'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h4>Index Size</h4>
              <span className="stat-value">{databaseInsights.indexSize || '0 MB'}</span>
            </div>
          </div>
        </div>

        <div className="collection-details">
          <h4>Collection Details</h4>
          <div className="collections-table">
            {databaseInsights.collectionDetails && Object.entries(databaseInsights.collectionDetails).map(([name, details]) => (
              <div key={name} className="collection-row">
                <span className="collection-name">{name}</span>
                <span className="collection-count">{details.documents} docs</span>
                <span className="collection-size">{details.size}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="database-actions">
          <button onClick={loadDatabaseInsights} className="refresh-btn">
            🔄 Refresh Insights
          </button>
          <button className="optimize-btn">
            ⚡ Optimize Database
          </button>
          <button className="backup-btn">
            💾 Create Backup
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Render System Monitor
   */
  const renderSystemMonitor = () => (
    <div className="enhanced-section">
      <div className="section-header">
        <h3>📈 System Health Monitor</h3>
        <p>Real-time system performance and health status</p>
      </div>

      <div className="system-status">
        <div className="status-overview">
          <div className="status-indicator">
            <div className={`status-light ${systemStatus.status === 'healthy' ? 'green' : 'red'}`}></div>
            <span>System Status: {systemStatus.status || 'Unknown'}</span>
          </div>
          <div className="system-uptime">
            <span>Uptime: {systemStatus.uptime ? Math.floor(systemStatus.uptime / 60) : 0} minutes</span>
          </div>
        </div>

        <div className="health-checks">
          {systemStatus.checks && Object.entries(systemStatus.checks).map(([check, status]) => (
            <div key={check} className="health-check-item">
              <div className="check-name">{check}</div>
              <div className={`check-status ${status.status}`}>
                {status.status}
              </div>
              <div className="check-duration">{status.duration}</div>
            </div>
          ))}
        </div>

        <div className="system-actions">
          <button onClick={loadSystemStatus} className="refresh-btn">
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'llm-providers':
        return renderLLMProviders();
      case 'database':
        return renderDatabaseInsights();
      case 'system-monitor':
        return renderSystemMonitor();
      default:
        return renderLLMProviders();
    }
  };

  if (loading) {
    return (
      <div className="enhanced-settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading advanced settings...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-advanced-settings">
      <div className="enhanced-settings-header">
        <h1>⚙️ Advanced Settings</h1>
        <p>Configure EchoTune AI's advanced features and integrations</p>
      </div>

      {message && (
        <div className={`enhanced-message ${message.type}`}>
          <span className="message-text">{message.text}</span>
          <button onClick={() => setMessage(null)} className="message-close">×</button>
        </div>
      )}

      {renderTabs()}
      
      <div className="enhanced-settings-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EnhancedAdvancedSettings;