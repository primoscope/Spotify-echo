// React is needed for JSX

import { useLLM } from '../contexts/LLMContext';
import { useState, useEffect, useCallback } from 'react';

function ProviderPanel() {
  const { currentProvider, providers, loading, switchProvider, refreshProviders } = useLLM();
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [telemetryData, setTelemetryData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshingModels, setRefreshingModels] = useState(false);

  useEffect(() => {
    loadAvailableModels();
    loadTelemetryData();
  }, [currentProvider, loadAvailableModels, loadTelemetryData]);

  const loadAvailableModels = useCallback(async () => {
    if (currentProvider === 'mock') return;

    setRefreshingModels(true);
    try {
      const response = await fetch(
        `/api/settings/llm-providers/models?provider=${currentProvider}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailableModels(data.models);

        // Set default selected model
        if (data.models.length > 0 && !selectedModel) {
          const currentModel = data.models.find((m) => m.available) || data.models[0];
          setSelectedModel(currentModel.id);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setRefreshingModels(false);
    }
  }, [currentProvider, selectedModel]);

  const loadTelemetryData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/settings/llm-providers/telemetry?provider=${currentProvider}`
      );
      const data = await response.json();

      if (data.success) {
        setTelemetryData(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load telemetry:', error);
    }
  }, [currentProvider]);

  const handleProviderChange = async (e) => {
    const newProvider = e.target.value;
    if (newProvider === currentProvider) return;

    const success = await switchProvider(newProvider);
    if (!success) {
      // Revert selection if switch failed
      e.target.value = currentProvider;
    }
  };

  const handleModelChange = async (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // TODO: Implement model switching API call
    console.log(`Switching to model: ${newModel}`);
  };

  const refreshModels = async () => {
    setRefreshingModels(true);
    try {
      await fetch('/api/settings/llm-providers/models/refresh', { method: 'POST' });
      await loadAvailableModels();
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      setRefreshingModels(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'var(--success-color)';
      case 'error':
        return 'var(--error-color)';
      case 'unknown':
        return 'var(--warning-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusText = (providerId) => {
    const provider = providers[providerId];
    if (!provider) return 'Unknown';

    if (loading) return 'Loading...';
    if (!provider.available) return 'Unavailable';
    if (provider.status === 'connected') return 'Ready';
    if (provider.status === 'error') return 'Error';
    return 'Unknown';
  };

  const getModelInfo = (modelId) => {
    const model = availableModels.find((m) => m.id === modelId);
    return model || null;
  };

  const formatLatency = (latency) => {
    if (!latency) return 'N/A';
    return typeof latency === 'number' ? `${latency.toFixed(0)}ms` : latency;
  };

  const formatPercentage = (value) => {
    if (!value) return 'N/A';
    return typeof value === 'string' ? value : `${value.toFixed(1)}%`;
  };

  return (
    <div className="provider-panel">
      <div className="provider-controls">
        <div className="provider-row">
          <label htmlFor="provider-select" className="provider-label">
            🤖 AI Provider:
          </label>

          <select
            id="provider-select"
            className="provider-select"
            value={currentProvider}
            onChange={handleProviderChange}
            disabled={loading}
          >
            {Object.entries(providers)
              .sort(([a], [b]) => {
                // Sort to prioritize Gemini first, then others, with mock last
                const order = ['gemini', 'openai', 'azure', 'openrouter', 'mock'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([key, provider]) => (
                <option key={key} value={key} disabled={!provider.available}>
                  {provider.name} {!provider.available ? '(Unavailable)' : ''}
                </option>
              ))}
          </select>

          <button
            className="provider-settings-btn"
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? 'Hide Details' : 'Show Details'}
            disabled={loading}
          >
            {showDetails ? '🔼' : '🔽'}
          </button>

          <button
            className="refresh-providers-btn"
            onClick={refreshProviders}
            title="Refresh Providers"
            disabled={loading}
          >
            {loading ? '⟳' : '🔄'}
          </button>
        </div>

        {currentProvider !== 'mock' && availableModels.length > 0 && (
          <div className="model-row">
            <label htmlFor="model-select" className="model-label">
              🧠 Model:
            </label>

            <select
              id="model-select"
              className="model-select"
              value={selectedModel}
              onChange={handleModelChange}
              disabled={loading || refreshingModels}
            >
              {availableModels
                .filter((model) => model.available)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.latencyTier}, {model.qualityTier})
                  </option>
                ))}
            </select>

            <button
              className="refresh-models-btn"
              onClick={refreshModels}
              title="Refresh Models"
              disabled={loading || refreshingModels}
            >
              {refreshingModels ? '⟳' : '🔄'}
            </button>
          </div>
        )}
      </div>

      <div className="provider-status">
        <span
          className="status-text"
          style={{ color: getStatusColor(providers[currentProvider]?.status) }}
        >
          {getStatusText(currentProvider)}
        </span>
        {providers[currentProvider]?.model && (
          <span className="model-info">({providers[currentProvider].model})</span>
        )}
        {telemetryData?.current && (
          <span className="telemetry-info">
            ({telemetryData.current.requests} requests,{' '}
            {formatLatency(telemetryData.current.averageLatency)} avg)
          </span>
        )}
      </div>

      {showDetails && (
        <div className="provider-details">
          {currentProvider !== 'mock' && selectedModel && (
            <div className="model-details">
              <h4>📋 Model Information</h4>
              {(() => {
                const model = getModelInfo(selectedModel);
                return model ? (
                  <div className="model-info-grid">
                    <div className="info-item">
                      <span className="info-label">Description:</span>
                      <span className="info-value">{model.description}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Capabilities:</span>
                      <span className="info-value">{model.capabilities.join(', ')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Max Tokens:</span>
                      <span className="info-value">{model.maxTokens.toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Context Window:</span>
                      <span className="info-value">{model.contextWindow.toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Cost per 1K tokens:</span>
                      <span className="info-value">
                        ${model.costPer1kTokens.input} in / ${model.costPer1kTokens.output} out
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Performance:</span>
                      <span className="info-value">
                        {model.latencyTier} latency, {model.qualityTier} quality
                      </span>
                    </div>
                    {model.experimental && (
                      <div className="info-item experimental">
                        <span className="info-label">⚠️ Status:</span>
                        <span className="info-value">Experimental</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Loading model information...</p>
                );
              })()}
            </div>
          )}

          {telemetryData?.current && (
            <div className="telemetry-details">
              <h4>📊 Performance Metrics</h4>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Requests:</span>
                  <span className="metric-value">{telemetryData.current.requests}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Success Rate:</span>
                  <span className="metric-value">
                    {formatPercentage(telemetryData.current.successRate)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Latency:</span>
                  <span className="metric-value">
                    {formatLatency(telemetryData.current.averageLatency)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Retries:</span>
                  <span className="metric-value">{telemetryData.current.retryAttempts || 0}</span>
                </div>
                {telemetryData.current.lastRequestTime && (
                  <div className="metric-item">
                    <span className="metric-label">Last Used:</span>
                    <span className="metric-value">
                      {new Date(telemetryData.current.lastRequestTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {telemetryData.current.errors && telemetryData.current.errors.length > 0 && (
                <div className="error-history">
                  <h5>Recent Errors:</h5>
                  <ul className="error-list">
                    {telemetryData.current.errors.slice(0, 3).map((error, index) => (
                      <li key={index} className="error-item">
                        <span className="error-time">
                          {new Date(error.timestamp).toLocaleTimeString()}:
                        </span>
                        <span className="error-message">{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .provider-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .provider-row, .model-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .provider-label, .model-label {
          font-weight: 600;
          min-width: 100px;
        }

        .provider-select, .model-select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--input-bg);
          color: var(--text-primary);
        }

        .provider-settings-btn, .refresh-providers-btn, .refresh-models-btn {
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--button-bg);
          color: var(--text-primary);
          cursor: pointer;
        }

        .provider-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 14px;
        }

        .status-text {
          font-weight: 600;
        }

        .model-info, .telemetry-info {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .provider-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .model-details, .telemetry-details {
          margin-bottom: 16px;
        }

        .model-details h4, .telemetry-details h4 {
          margin: 0 0 12px 0;
          color: var(--text-primary);
          font-size: 16px;
        }

        .model-info-grid, .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 8px;
        }

        .info-item, .metric-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .info-label, .metric-label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .info-value, .metric-value {
          color: var(--text-primary);
        }

        .experimental {
          color: var(--warning-color);
        }

        .error-history {
          margin-top: 12px;
        }

        .error-history h5 {
          margin: 0 0 8px 0;
          color: var(--error-color);
        }

        .error-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-item {
          padding: 4px 0;
          font-size: 12px;
          color: var(--error-color);
        }

        .error-time {
          font-weight: 600;
          margin-right: 8px;
        }

        .error-message {
          color: var(--text-secondary);
        }

        :disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default ProviderPanel;
