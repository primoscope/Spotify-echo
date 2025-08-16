// React is needed for JSX
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LLMContext = createContext();

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error('useLLM must be used within an LLMProvider');
  }
  return context;
};

export function LLMProvider({ children }) {
  const [currentProvider, setCurrentProvider] = useState('gemini'); // Default to Gemini
  const [providers, setProviders] = useState({
    gemini: { name: 'Google Gemini', status: 'unknown', available: false }, // Gemini first
    mock: { name: 'Demo Mode (Mock)', status: 'connected', available: true },
    openai: { name: 'OpenAI GPT', status: 'unknown', available: false },
    azure: { name: 'Azure OpenAI', status: 'unknown', available: false },
    openrouter: { name: 'OpenRouter', status: 'unknown', available: false },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]); // Add refreshProviders dependency

  const mapProvidersFromUnified = (list) => {
    const updated = { ...providers };
    for (const p of list) {
      const key = p.id;
      if (!updated[key]) continue;
      updated[key] = {
        ...updated[key],
        name: p.name || updated[key].name,
        status: p.status || 'unknown',
        available: !!p.available,
        model: p.model,
      };
    }
    return updated;
  };

  const refreshProviders = useCallback(async () => {
    setLoading(true);
    try {
      // Try unified providers endpoint first
      let updatedProviders = null;
      try {
        const res = await fetch('/api/providers');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.providers)) {
            updatedProviders = mapProvidersFromUnified(data.providers);
          }
        }
      } catch {}

      if (!updatedProviders) {
        // Fallback to chat providers endpoint
        const response = await fetch('/api/chat/providers');
        const data = await response.json();
        if (data.success && Array.isArray(data.providers)) {
          const copy = { ...providers };
          for (const p of data.providers) {
            const key = p.id;
            if (!copy[key]) continue;
            copy[key] = {
              ...copy[key],
              status: p.status,
              available: p.available,
              model: p.model,
            };
          }
          updatedProviders = copy;
        }
      }

      if (updatedProviders) {
        setProviders(updatedProviders);
        // Auto-select best available provider - prioritize Gemini first
        const providerPriority = ['gemini', 'openai', 'openrouter', 'mock'];
        let selectedProvider = currentProvider;

        if (!updatedProviders[currentProvider]?.available) {
          selectedProvider =
            providerPriority.find((key) => updatedProviders[key]?.available) || 'mock';
        }
        setCurrentProvider(selectedProvider);
      }
    } catch (error) {
      console.error('Failed to refresh providers:', error);
      // Fallback to mock provider
      setCurrentProvider('mock');
    } finally {
      setLoading(false);
    }
  }, [providers, currentProvider]);

  const switchProvider = async (providerId) => {
    if (!providers[providerId]?.available) {
      console.warn(`Provider ${providerId} is not available`);
      return false;
    }

    setLoading(true);
    try {
      // Try unified switch endpoint first
      const unified = await fetch('/api/providers/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      if (unified.ok) {
        setCurrentProvider(providerId);
        return true;
      }
    } catch {}

    try {
      // Fallback: test provider via chat test endpoint
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          provider: providerId,
        }),
      });

      if (response.ok) {
        setCurrentProvider(providerId);
        return true;
      } else {
        throw new Error('Provider test failed');
      }
    } catch (error) {
      console.error('Provider switch error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message, context = {}) => {
    if (!message.trim()) return null;

    try {
      const endpoint = context.isDemo ? '/api/chat/test' : '/api/chat';

      const requestBody = {
        message: message.trim(),
        provider: currentProvider,
        ...context,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          response: data.response || data.message,
          action: data.action,
          data: data.data,
          provider: currentProvider,
        };
      } else {
        // If provider fails, try fallback to mock
        if (currentProvider !== 'mock') {
          console.warn(`Provider ${currentProvider} failed, falling back to mock`);
          const fallbackResponse = await fetch('/api/chat/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: message.trim(),
              provider: 'mock',
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setCurrentProvider('mock');
            return {
              success: true,
              response: fallbackData.response,
              provider: 'mock',
              fallback: true,
            };
          }
        }

        return {
          success: false,
          error: data.message || 'Unknown error occurred',
        };
      }
    } catch (error) {
      console.error('Message send error:', error);
      return {
        success: false,
        error: 'Connection error. Please check your internet connection.',
      };
    }
  };

  const getProviderStatus = (providerId) => {
    return providers[providerId]?.status || 'unknown';
  };

  const isProviderAvailable = (providerId) => {
    return providers[providerId]?.available || false;
  };

  const value = {
    currentProvider,
    providers,
    loading,
    refreshProviders,
    switchProvider,
    sendMessage,
    getProviderStatus,
    isProviderAvailable,
  };

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
}
