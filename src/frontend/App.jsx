import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, Tabs, Tab } from '@mui/material';
import React, { useState, Suspense, lazy } from 'react';
import ThemeProvider, { ThemeToggle } from './components/ThemeProvider';
// Convert heavy components to lazy-loaded chunks for better initial bundle size
const PlaylistBuilder = lazy(() => import('./components/PlaylistBuilder'));
const PlaylistsPage = lazy(() => import('./components/PlaylistsPage'));
const ExplainableRecommendations = lazy(() => import('./components/ExplainableRecommendations'));
const EnhancedChatInterface = lazy(() => import('./components/EnhancedChatInterface'));
const EnhancedMusicDiscovery = lazy(() => import('./components/EnhancedMusicDiscovery'));
const EnhancedAnalyticsDashboard = lazy(() => import('./components/EnhancedAnalyticsDashboard'));
const InsightsDashboard = lazy(() => import('./components/InsightsDashboard'));
const SongsPage = lazy(() => import('./components/SongsPage'));
const MobileResponsiveManager = lazy(() => import('./components/MobileResponsiveManager'));
const EnhancedConfigPanel = lazy(() => import('./components/EnhancedConfigPanel'));
const GitHubInfo = lazy(() => import('../components/GitHubInfo'));
// import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LLMProvider } from './contexts/LLMContext';
// import { DatabaseProvider } from './contexts/DatabaseContext';
import './styles/App.css';

// Prefetch maps to warm lazy chunks on hover
const prefetchers = {
  chat: () => import('./components/EnhancedChatInterface'),
  recommendations: () => import('./components/ExplainableRecommendations'),
  playlist: () => import('./components/PlaylistBuilder'),
  playlists: () => import('./components/PlaylistsPage'),
  songs: () => import('./components/SongsPage'),
  discovery: () => import('./components/EnhancedMusicDiscovery'),
  analytics: () => import('./components/EnhancedAnalyticsDashboard'),
  insights: () => import('./components/InsightsDashboard'),
  settings: () => Promise.all([
    import('./components/EnhancedConfigPanel'),
    import('./components/MobileResponsiveManager'),
    import('../components/GitHubInfo')
  ]),
  settingsGeneral: () => import('./components/EnhancedConfigPanel'),
  settingsMobile: () => import('./components/MobileResponsiveManager'),
  settingsGithub: () => import('../components/GitHubInfo')
};

/**
 * Enhanced EchoTune AI Application
 * Features modern UI with Material Design, dark/light themes,
 * explainable recommendations, and advanced chat interface
 */
function App() {
  return (
    <ThemeProvider>
      <LLMProvider>
        <Router>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<MainApplication />} />
            <Route path="/chat" element={<MainApplication initialTab="chat" />} />
            <Route
              path="/recommendations"
              element={<MainApplication initialTab="recommendations" />}
            />
            <Route path="/playlist" element={<MainApplication initialTab="playlist" />} />
            <Route path="/playlists" element={<MainApplication initialTab="playlists" />} />
            <Route path="/songs" element={<MainApplication initialTab="songs" />} />
            <Route path="/discovery" element={<MainApplication initialTab="discovery" />} />
            <Route path="/analytics" element={<MainApplication initialTab="analytics" />} />
            <Route path="/insights" element={<MainApplication initialTab="insights" />} />
            <Route path="/settings" element={<MainApplication initialTab="settings" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
      </LLMProvider>
    </ThemeProvider>
  );
}

/**
 * Main Application Component with Tabbed Interface
 */
function MainApplication({ initialTab = 'chat' }) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [_recommendations, _setRecommendations] = useState([]);
  const [_playlistTracks, _setPlaylistTracks] = useState([]);

  // Mock data for demonstration
  const mockRecommendations = [
    {
      id: 'track1',
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      album: { name: 'After Hours' },
      duration_ms: 200040,
      confidence: 0.89,
      algorithm: 'hybrid',
      recommendationId: 'rec_1',
      quickReason: 'Based on your recent listening to synth-pop and 80s-inspired tracks',
      popularity: 95,
    },
    {
      id: 'track2',
      name: 'Levitating',
      artist: 'Dua Lipa',
      album: { name: 'Future Nostalgia' },
      duration_ms: 203064,
      confidence: 0.82,
      algorithm: 'collaborative',
      recommendationId: 'rec_2',
      quickReason: 'Users with similar taste love this upbeat disco-pop hit',
      popularity: 88,
    },
    {
      id: 'track3',
      name: 'As It Was',
      artist: 'Harry Styles',
      album: { name: 'Harry\'s House' },
      duration_ms: 167000,
      confidence: 0.76,
      algorithm: 'content_based',
      recommendationId: 'rec_3',
      quickReason: 'Matches your preference for melodic pop with emotional depth',
      popularity: 92,
    },
  ];

  const handleSendChatMessage = async (message, context) => {
    console.log('Sending message:', message, 'with context:', context);

    // Mock API call to enhanced chat endpoint
    try {
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          response: data.response,
          recommendations: mockRecommendations.slice(0, 2), // Mock recommendations
          explanation: {
            summary: 'I selected these tracks based on your mood and musical preferences.',
            reasoning: [
              `Chose ${context.mood || 'upbeat'} music to match your current mood`,
              'Included popular tracks that users with similar taste enjoy',
              'Balanced energy levels for your listening context',
            ],
            contextFactors: [
              { factor: 'mood', value: context.mood || 'happy', influence: 'high' },
              { factor: 'activity', value: context.activity || 'general', influence: 'medium' },
            ],
          },
          provider: data.provider || 'mock',
        };
      }
    } catch (error) {
      console.error('Chat API error:', error);
    }

    // Fallback response
    return {
      response: 'I\'d love to help you discover great music! What kind of mood are you in today?',
      recommendations: [],
      provider: 'mock',
    };
  };

  const handleGetExplanation = async (recommendationId, trackId) => {
    console.log('Getting explanation for:', recommendationId, trackId);

    // Mock explanation based on track
    const track = mockRecommendations.find((t) => t.id === trackId);
    if (track) {
      return {
        summary: `"${track.name}" was recommended because it matches your musical taste profile and current listening context.`,
        reasons: [
          `High confidence match (${Math.round(track.confidence * 100)}%) with your preferences`,
          `${track.algorithm} algorithm identified this as a perfect fit`,
          `Popular track (${track.popularity}% popularity) with broad appeal`,
          'Audio features align with your recently played songs',
        ],
        confidence: track.confidence,
        algorithm: track.algorithm,
        factors: [
          {
            type: 'audio_similarity',
            description: 'Musical features match your taste',
            weight: 0.4,
          },
          { type: 'user_behavior', description: 'Similar users also enjoy this', weight: 0.3 },
          { type: 'popularity', description: 'Trending and well-received', weight: 0.2 },
          { type: 'context', description: 'Fits current mood/activity', weight: 0.1 },
        ],
        trackSpecific: {
          name: track.name,
          artist: track.artist,
          reasons: [
            'Matches the energy level you typically prefer',
            `${track.artist} is in your top listened artists this month`,
            'Upbeat tempo perfect for your current activity',
            "Similar to other tracks you've liked recently",
          ],
        },
      };
    }

    return {
      summary: 'This recommendation was generated using our AI algorithms.',
      reasons: ['Based on your listening history and preferences'],
      confidence: 0.7,
      algorithm: 'hybrid',
      factors: [],
    };
  };

  const handleProvideFeedback = async (feedbackData) => {
    console.log('Submitting feedback:', feedbackData);

    // Mock API call to feedback endpoint
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Feedback submitted successfully:', data);
        return data;
      }
    } catch (error) {
      console.error('Feedback API error:', error);
    }

    // Mock successful response
    return {
      success: true,
      feedbackId: `feedback_${Date.now()}`,
      message: 'Feedback recorded successfully',
    };
  };

  const handleSavePlaylist = async (playlistData) => {
    console.log('Saving playlist:', playlistData);
    // Mock save operation
    return {
      success: true,
      playlistId: `playlist_${Date.now()}`,
      message: 'Playlist saved successfully',
    };
  };

  const handleSharePlaylist = async (playlistData) => {
    console.log('Sharing playlist:', playlistData);
    // Mock share operation
    navigator.clipboard.writeText(`Check out my EchoTune AI playlist: ${playlistData.name}`);
    return {
      success: true,
      shareUrl: `https://echotune.ai/playlist/${Date.now()}`,
    };
  };

  const handlePrefetch = (tab) => {
    const run = prefetchers[tab];
    if (run) {
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
      idle(() => run().catch(() => {}));
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            🎵 EchoTune AI
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
              Enhanced Experience
            </Typography>
          </Typography>
          <ThemeToggle showCustomization />
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="EchoTune AI navigation"
          >
            <Tab label="🤖 AI Chat" value="chat" onMouseEnter={() => handlePrefetch('chat')} />
            <Tab label="🎯 Recommendations" value="recommendations" onMouseEnter={() => handlePrefetch('recommendations')} />
            <Tab label="🎵 Playlist Builder" value="playlist" onMouseEnter={() => handlePrefetch('playlist')} />
            <Tab label="📋 Playlists" value="playlists" onMouseEnter={() => handlePrefetch('playlists')} />
            <Tab label="🎶 Songs" value="songs" onMouseEnter={() => handlePrefetch('songs')} />
            <Tab label="🔍 Discovery" value="discovery" onMouseEnter={() => handlePrefetch('discovery')} />
            <Tab label="📊 Analytics" value="analytics" onMouseEnter={() => handlePrefetch('analytics')} />
            <Tab label="💡 Insights" value="insights" onMouseEnter={() => handlePrefetch('insights')} />
            <Tab label="⚙️ Settings" value="settings" onMouseEnter={() => handlePrefetch('settings')} />
          </Tabs>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading section…</div>}>
          {currentTab === 'chat' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <EnhancedChatInterface
                sessionId={sessionId}
                onSendMessage={handleSendChatMessage}
                onProvideFeedback={handleProvideFeedback}
                loading={false}
              />
            </Container>
          )}

          {currentTab === 'recommendations' && (
            <Container maxWidth="xl" sx={{ py: 3 }}>
              <ExplainableRecommendations
                recommendations={mockRecommendations}
                onGetExplanation={handleGetExplanation}
                onProvideFeedback={handleProvideFeedback}
                loading={false}
              />
            </Container>
          )}

          {currentTab === 'playlist' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <PlaylistBuilder
                initialTracks={[]}
                recommendations={mockRecommendations}
                onSave={handleSavePlaylist}
                onShare={handleSharePlaylist}
                onGetExplanation={handleGetExplanation}
                onProvideFeedback={handleProvideFeedback}
              />
            </Container>
          )}

          {currentTab === 'playlists' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <PlaylistsPage />
            </Container>
          )}

          {currentTab === 'songs' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <SongsPage />
            </Container>
          )}

          {currentTab === 'discovery' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <EnhancedMusicDiscovery />
            </Container>
          )}

          {currentTab === 'analytics' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <EnhancedAnalyticsDashboard />
            </Container>
          )}

          {currentTab === 'insights' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <InsightsDashboard />
            </Container>
          )}

          {currentTab === 'settings' && (
            <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
              <SettingsTabManager />
            </Container>
          )}
        </Suspense>
      </Box>
    </Box>
  );
}

/**
 * Settings Tab Manager Component
 * Manages sub-tabs for different configuration areas
 */
function SettingsTabManager() {
  const [settingsTab, setSettingsTab] = useState('general');

  return (
    <Box>
      <Tabs
        value={settingsTab}
        onChange={(event, newValue) => setSettingsTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="⚙️ General" value="general" />
        <Tab label="📱 Mobile & Responsive" value="mobile" />
        <Tab label="🐙 GitHub" value="github" />
      </Tabs>

      <Suspense fallback={<div style={{ padding: '1rem' }}>Loading settings…</div>}>
        {settingsTab === 'general' && <EnhancedConfigPanel />}
        {settingsTab === 'mobile' && <MobileResponsiveManager />}
        {settingsTab === 'github' && <GitHubInfo />}
      </Suspense>
    </Box>
  );
}

export default App;
