/**
 * Advanced Music Discovery Component
 * 
 * Enhanced music discovery interface with explainable AI recommendations,
 * multiple discovery modes, and real-time user interaction tracking.
 * 
 * Features:
 * - 5 Discovery modes (Smart, Mood-based, Trending, Social, AI Radio)
 * - Explainable AI recommendations with detailed reasoning
 * - Real-time feedback integration
 * - Advanced filtering and customization
 * - Context-aware suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdvancedMusicDiscovery.css';

const AdvancedMusicDiscovery = ({ userId, onTrackSelect, onPlaylistCreate }) => {
  const [discoveryMode, setDiscoveryMode] = useState('smart');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    genre: '',
    mood: 'neutral',
    activity: 'listening',
    energy: 50,
    danceability: 50,
    valence: 50
  });
  const [showExplanations, setShowExplanations] = useState(true);
  const [contextMode, setContextMode] = useState('auto');

  const discoveryModes = {
    smart: {
      name: 'Smart Discovery',
      icon: '🧠',
      description: 'AI-powered recommendations based on your complete listening profile'
    },
    mood: {
      name: 'Mood-based',
      icon: '🎭',
      description: 'Music that matches your current emotional state'
    },
    trending: {
      name: 'Trending Now',
      icon: '🔥',
      description: 'What\'s popular and rising in your favorite genres'
    },
    social: {
      name: 'Social Discovery',
      icon: '👥',
      description: 'Discover what your friends and similar users are enjoying'
    },
    radio: {
      name: 'AI Radio',
      icon: '📻',
      description: 'Continuous discovery with real-time adaptation to your feedback'
    }
  };

  useEffect(() => {
    if (userId) {
      generateRecommendations();
    }
  }, [userId, discoveryMode, filters]);

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const context = {
        mode: discoveryMode,
        filters,
        contextMode,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/recommendations/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          context,
          options: {
            limit: 20,
            includeExplanations: showExplanations,
            diversityFactor: 0.3,
            freshnessFactor: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);

      // Track discovery event
      trackDiscoveryEvent('recommendations_generated', {
        mode: discoveryMode,
        count: data.recommendations?.length || 0,
        context
      });

    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackInteraction = async (track, action) => {
    try {
      // Send feedback to recommendation engine
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          trackId: track.trackId,
          feedback: {
            action,
            context: {
              discoveryMode,
              filters,
              timestamp: new Date().toISOString()
            }
          }
        })
      });

      // Update UI immediately for better UX
      setRecommendations(prev => prev.map(rec => 
        rec.trackId === track.trackId 
          ? { ...rec, userFeedback: action, interacted: true }
          : rec
      ));

      // Handle specific actions
      switch (action) {
        case 'play':
          onTrackSelect?.(track);
          break;
        case 'like':
          // Add to liked tracks
          break;
        case 'dislike':
          // Remove from current recommendations if in radio mode
          if (discoveryMode === 'radio') {
            setRecommendations(prev => prev.filter(rec => rec.trackId !== track.trackId));
          }
          break;
      }

      // Track interaction
      trackDiscoveryEvent('track_interaction', {
        trackId: track.trackId,
        action,
        mode: discoveryMode
      });

    } catch (error) {
      console.error('Error processing track interaction:', error);
    }
  };

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  const createPlaylistFromRecommendations = async () => {
    const likedTracks = recommendations.filter(rec => rec.userFeedback === 'like' || rec.interacted);
    if (likedTracks.length === 0) {
      alert('Like some tracks first to create a playlist!');
      return;
    }

    const playlistName = `${discoveryModes[discoveryMode].name} Mix - ${new Date().toLocaleDateString()}`;
    const trackUris = likedTracks.map(track => track.uri || `spotify:track:${track.trackId}`);

    try {
      await onPlaylistCreate?.({
        name: playlistName,
        tracks: trackUris,
        description: `Created from ${discoveryModes[discoveryMode].description.toLowerCase()}`
      });

      trackDiscoveryEvent('playlist_created', {
        mode: discoveryMode,
        trackCount: trackUris.length,
        playlistName
      });

    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const trackDiscoveryEvent = async (eventType, data) => {
    try {
      await fetch('/api/analytics/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          eventType,
          eventData: data,
          timestamp: new Date().toISOString(),
          component: 'AdvancedMusicDiscovery'
        })
      });
    } catch (error) {
      console.error('Error tracking discovery event:', error);
    }
  };

  return (
    <div className="advanced-music-discovery">
      {/* Header with Mode Selection */}
      <div className="discovery-header">
        <h2>🎵 Advanced Music Discovery</h2>
        <div className="discovery-modes">
          {Object.entries(discoveryModes).map(([mode, config]) => (
            <motion.button
              key={mode}
              className={`mode-button ${discoveryMode === mode ? 'active' : ''}`}
              onClick={() => setDiscoveryMode(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mode-icon">{config.icon}</span>
              <span className="mode-name">{config.name}</span>
            </motion.button>
          ))}
        </div>
        <p className="mode-description">
          {discoveryModes[discoveryMode].description}
        </p>
      </div>

      {/* Advanced Filters */}
      <motion.div 
        className="discovery-filters"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
      >
        <div className="filter-group">
          <label>Mood</label>
          <select 
            value={filters.mood} 
            onChange={(e) => handleFilterChange('mood', e.target.value)}
          >
            <option value="neutral">Neutral</option>
            <option value="happy">Happy</option>
            <option value="energetic">Energetic</option>
            <option value="calm">Calm</option>
            <option value="melancholy">Melancholy</option>
            <option value="focused">Focused</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Activity</label>
          <select 
            value={filters.activity} 
            onChange={(e) => handleFilterChange('activity', e.target.value)}
          >
            <option value="listening">Casual Listening</option>
            <option value="workout">Workout</option>
            <option value="study">Study/Focus</option>
            <option value="party">Party</option>
            <option value="relax">Relaxation</option>
            <option value="commute">Commuting</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Energy Level: {filters.energy}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.energy}
            onChange={(e) => handleFilterChange('energy', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        <div className="filter-group">
          <label>Danceability: {filters.danceability}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.danceability}
            onChange={(e) => handleFilterChange('danceability', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        <div className="filter-group">
          <label>Positivity: {filters.valence}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.valence}
            onChange={(e) => handleFilterChange('valence', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        <div className="filter-actions">
          <button onClick={generateRecommendations} disabled={loading}>
            🔄 Refresh Recommendations
          </button>
          <label className="toggle-explanations">
            <input
              type="checkbox"
              checked={showExplanations}
              onChange={(e) => setShowExplanations(e.target.checked)}
            />
            Show AI Explanations
          </label>
        </div>
      </motion.div>

      {/* Recommendations Display */}
      <div className="recommendations-container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating personalized recommendations...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>❌ Error: {error}</p>
            <button onClick={generateRecommendations}>Try Again</button>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="empty-state">
            <p>🎵 No recommendations available</p>
            <p>Try adjusting your filters or switching discovery modes</p>
          </div>
        )}

        <AnimatePresence>
          {recommendations.length > 0 && (
            <motion.div
              className="recommendations-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {recommendations.map((track, index) => (
                <RecommendationCard
                  key={track.trackId}
                  track={track}
                  index={index}
                  showExplanations={showExplanations}
                  onInteraction={handleTrackInteraction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Creation */}
        {recommendations.some(rec => rec.userFeedback === 'like') && (
          <motion.div
            className="playlist-creation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button 
              className="create-playlist-btn"
              onClick={createPlaylistFromRecommendations}
            >
              📝 Create Playlist from Liked Tracks
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Recommendation Card Component
 */
const RecommendationCard = ({ track, index, showExplanations, onInteraction }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`recommendation-card ${track.interacted ? 'interacted' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      <div className="track-info">
        <div className="track-main">
          <img 
            src={track.albumArt || '/default-album.png'} 
            alt={`${track.name} album art`}
            className="album-art"
          />
          <div className="track-details">
            <h3 className="track-name">{track.name || 'Unknown Track'}</h3>
            <p className="track-artist">{track.artist || 'Unknown Artist'}</p>
            <p className="track-album">{track.album || 'Unknown Album'}</p>
            <div className="track-meta">
              <span className="track-rank">#{track.rank}</span>
              <span className="confidence-score">
                {Math.round(track.finalScore * 100)}% match
              </span>
            </div>
          </div>
        </div>

        <div className="track-actions">
          <button
            className={`action-btn ${track.userFeedback === 'like' ? 'active' : ''}`}
            onClick={() => onInteraction(track, 'like')}
            title="Like this track"
          >
            ❤️
          </button>
          <button
            className="action-btn"
            onClick={() => onInteraction(track, 'play')}
            title="Play this track"
          >
            ▶️
          </button>
          <button
            className={`action-btn ${track.userFeedback === 'dislike' ? 'active' : ''}`}
            onClick={() => onInteraction(track, 'dislike')}
            title="Not interested"
          >
            👎
          </button>
          {showExplanations && track.explanation && (
            <button
              className={`explanation-toggle ${expanded ? 'expanded' : ''}`}
              onClick={() => setExpanded(!expanded)}
              title="Show/hide explanation"
            >
              🤔
            </button>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      <AnimatePresence>
        {expanded && showExplanations && track.explanation && (
          <motion.div
            className="ai-explanation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="explanation-content">
              <h4>🤖 Why we recommend this:</h4>
              <p className="primary-reason">{track.explanation.primary}</p>
              
              {track.explanation.secondary && track.explanation.secondary.length > 0 && (
                <div className="secondary-reasons">
                  {track.explanation.secondary.map((reason, idx) => (
                    <p key={idx} className="secondary-reason">• {reason}</p>
                  ))}
                </div>
              )}

              <div className="explanation-factors">
                <div className="factor-bars">
                  {Object.entries(track.explanation.factors || {}).map(([factor, value]) => (
                    <div key={factor} className="factor-bar">
                      <span className="factor-label">{factor}</span>
                      <div className="factor-progress">
                        <div 
                          className="factor-fill"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <span className="factor-value">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Features Visualization */}
      {track.audioFeatures && (
        <div className="audio-features">
          {Object.entries(track.audioFeatures).slice(0, 3).map(([feature, value]) => (
            <div key={feature} className="feature-indicator">
              <span className="feature-name">{feature}</span>
              <div className="feature-bar">
                <div 
                  className="feature-value"
                  style={{ width: `${value * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdvancedMusicDiscovery;