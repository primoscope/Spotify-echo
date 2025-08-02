// React is needed for JSX
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLLM } from '../contexts/LLMContext';
import { useDatabase } from '../contexts/DatabaseContext';
import ProviderPanel from './ProviderPanel';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import VoiceRecording from './VoiceRecording';
import QuickSuggestions from './QuickSuggestions';
import io from 'socket.io-client';

/**
 * Modern React-based Chat Interface
 * Replaces the basic HTML/CSS/JS implementation with real-time features
 */
function ChatInterface() {
  const { user } = useAuth();
  const { currentProvider, sendMessage } = useLLM();
  const { hasActiveDatabase, fallbackMode } = useDatabase();
  
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection for real-time features
    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('message', (data) => {
      addMessage('assistant', data.message, data.timestamp);
    });

    newSocket.on('typing', (data) => {
      setIsTyping(data.isTyping);
    });

    setSocket(newSocket);

    // Add initial welcome message
    addMessage('assistant', getWelcomeMessage(), new Date().toISOString());

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = () => {
    if (user) {
      return `Hello ${user.display_name || user.id}! I'm your AI music assistant. I can help you discover new music, create playlists, and find the perfect songs for any mood or activity.

**Try asking me:**
• "Recommend some upbeat songs for working out"
• "Create a chill playlist for studying"
• "I'm feeling nostalgic, what should I listen to?"
• "Analyze my music taste and suggest similar artists"`;
    }
    
    return `Hello! I'm your AI music assistant powered by advanced language models. I can help you discover new music, create playlists, and find the perfect songs for any mood or activity.

${!hasActiveDatabase() ? '**Demo Mode Active** - Connect your Spotify account for personalized recommendations!' : ''}

**Try asking me:**
• "Recommend some upbeat songs for working out"
• "Create a chill playlist for studying"  
• "I'm feeling nostalgic, what should I listen to?"
• "Find me some new indie artists to discover"`;
  };

  const addMessage = (sender, content, timestamp = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: timestamp || new Date().toISOString(),
      provider: sender === 'assistant' ? currentProvider : null
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const addSystemMessage = (content) => {
    addMessage('system', content);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isTyping) return;

    // Add user message
    const _userMessage = addMessage('user', message);
    
    // Update conversation history
    const newHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(newHistory);

    setIsTyping(true);
    
    // Emit typing to server
    if (socket) {
      socket.emit('typing', { isTyping: true });
    }

    try {
      const context = {
        isDemo: !user,
        user_context: user,
        conversation_history: newHistory.slice(-10), // Keep last 10 messages
        hasDatabase: hasActiveDatabase(),
        fallbackMode
      };

      const result = await sendMessage(message, context);
      
      if (result.success) {
        const assistantMessage = addMessage('assistant', result.response);
        
        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'assistant', content: result.response }
        ]);

        // Handle special actions
        if (result.action) {
          handleSpecialAction(result.action, result.data);
        }

        // Show fallback notice if applicable
        if (result.fallback) {
          addSystemMessage(`Switched to ${result.provider} provider due to connection issues`);
        }

        // Emit message to server for real-time updates
        if (socket) {
          socket.emit('message', {
            message: result.response,
            sender: 'assistant',
            timestamp: assistantMessage.timestamp
          });
        }
      } else {
        addMessage('assistant', 
          `I apologize, but I encountered an error: ${result.error || 'Please try again.'}`
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 
        'I seem to be having connection issues. Please check your internet connection and try again.'
      );
    } finally {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', { isTyping: false });
      }
    }
  };

  const handleSpecialAction = (action, data) => {
    switch (action) {
      case 'create_playlist':
        addSystemMessage(`Creating playlist "${data.name}" with ${data.tracks?.length || 0} tracks...`);
        break;
      case 'recommend':
        if (data.tracks) {
          addSystemMessage(`Found ${data.tracks.length} recommendations based on your preferences.`);
        }
        break;
      case 'analysis_complete':
        addSystemMessage('Music analysis complete. Check your dashboard for detailed insights.');
        break;
      case 'voice_command':
        addSystemMessage('Voice command processed successfully.');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleVoiceInput = (transcript) => {
    addSystemMessage(`Voice input: "${transcript}"`);
    handleSendMessage(transcript);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            🎵 Music Assistant
            <div className={`status-indicator ${user ? 'authenticated' : 'demo'}`}>
              <div className="status-dot"></div>
              {user ? 'Personalized' : 'Demo Mode'}
            </div>
          </div>
          <div className="chat-subtitle">
            Ask me for music recommendations, playlist creation, or mood-based suggestions
          </div>
        </div>

        <ProviderPanel />

        <MessageList 
          messages={messages}
          isTyping={isTyping}
          currentProvider={currentProvider}
        />

        <div className="chat-input-container">
          <QuickSuggestions onSuggestionClick={handleSuggestionClick} />
          
          <div className="input-row">
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={isTyping}
              placeholder="Ask me about music recommendations, playlists, or anything music-related..."
            />
            
            <VoiceRecording 
              onVoiceInput={handleVoiceInput}
              disabled={isTyping}
            />
          </div>
        </div>
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatInterface;