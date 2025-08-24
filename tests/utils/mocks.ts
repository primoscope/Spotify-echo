/**
 * Comprehensive mock system for E2E testing
 * Provides deterministic testing with live service fallback
 */

export interface SpotifyMockData {
  authUrl: string;
  accessToken: string;
  refreshToken: string;
  profile: any;
  tracks: any[];
  albums: any[];
  artists: any[];
}

export interface LLMMockData {
  responses: Record<string, string>;
  models: string[];
  usage: { requests: number; tokens: number };
}

export interface DatabaseMockData {
  users: any[];
  listeningHistory: any[];
  recommendations: any[];
}

export class MockProvider {
  private spotify: SpotifyMockData;
  private llm: LLMMockData;
  private database: DatabaseMockData;

  constructor() {
    this.spotify = this.createSpotifyMock();
    this.llm = this.createLLMMock();
    this.database = this.createDatabaseMock();
  }

  private createSpotifyMock(): SpotifyMockData {
    return {
      authUrl: 'https://accounts.spotify.com/authorize?client_id=test&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-private%20user-read-email&state=test_state',
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      profile: {
        id: 'test_user_' + Date.now(),
        display_name: 'Test User',
        email: 'test@example.com',
        images: [{ url: 'https://via.placeholder.com/300x300?text=Test+User' }]
      },
      tracks: [
        {
          id: 'track_1',
          name: 'Test Song 1',
          artists: [{ name: 'Test Artist 1' }],
          album: { name: 'Test Album 1' },
          duration_ms: 180000,
          preview_url: 'https://via.placeholder.com/audio'
        },
        {
          id: 'track_2',
          name: 'Test Song 2',
          artists: [{ name: 'Test Artist 2' }],
          album: { name: 'Test Album 2' },
          duration_ms: 210000,
          preview_url: 'https://via.placeholder.com/audio'
        }
      ],
      albums: [
        {
          id: 'album_1',
          name: 'Test Album 1',
          artists: [{ name: 'Test Artist 1' }],
          images: [{ url: 'https://via.placeholder.com/300x300?text=Album+1' }]
        }
      ],
      artists: [
        {
          id: 'artist_1',
          name: 'Test Artist 1',
          genres: ['pop', 'rock'],
          images: [{ url: 'https://via.placeholder.com/300x300?text=Artist+1' }]
        }
      ]
    };
  }

  private createLLMMock(): LLMMockData {
    return {
      responses: {
        'default': 'This is a mock response from the AI provider for testing purposes.',
        'music recommendation': 'Based on your listening history, I recommend these tracks: Test Song 1 by Test Artist 1, and Test Song 2 by Test Artist 2.',
        'artist info': 'Test Artist 1 is a popular artist known for their hits in pop and rock genres.',
        'playlist creation': 'I\'ve created a test playlist with your favorite tracks.',
        'mood music': 'Here are some upbeat songs for your current mood: Test Song 1, Test Song 2.'
      },
      models: ['mock-model', 'test-llm-v1', 'test-chat-model'],
      usage: { requests: 0, tokens: 0 }
    };
  }

  private createDatabaseMock(): DatabaseMockData {
    return {
      users: [
        {
          id: 'user_1',
          spotifyId: 'test_user_' + Date.now(),
          email: 'test@example.com',
          displayName: 'Test User',
          createdAt: new Date(),
          lastActive: new Date()
        }
      ],
      listeningHistory: [
        {
          userId: 'user_1',
          trackId: 'track_1',
          trackName: 'Test Song 1',
          artist: 'Test Artist 1',
          playedAt: new Date(Date.now() - 86400000), // 1 day ago
          playCount: 5
        },
        {
          userId: 'user_1',
          trackId: 'track_2',
          trackName: 'Test Song 2',
          artist: 'Test Artist 2',
          playedAt: new Date(Date.now() - 43200000), // 12 hours ago
          playCount: 3
        }
      ],
      recommendations: [
        {
          userId: 'user_1',
          trackId: 'track_1',
          score: 0.95,
          reason: 'Based on your listening history',
          createdAt: new Date(),
          clicked: false
        },
        {
          userId: 'user_1',
          trackId: 'track_2',
          score: 0.87,
          reason: 'Similar to your favorite artists',
          createdAt: new Date(),
          clicked: false
        }
      ]
    };
  }

  // Mock API response interceptors
  public async setupSpotifyMocks(page: any): Promise<void> {
    await page.route('**/api/spotify/**', async (route: any) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            authUrl: this.spotify.authUrl,
            state: 'test_state_' + Date.now()
          })
        });
      } else if (url.includes('/auth/callback')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            accessToken: this.spotify.accessToken,
            refreshToken: this.spotify.refreshToken,
            user: this.spotify.profile
          })
        });
      } else if (url.includes('/profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.spotify.profile)
        });
      } else if (url.includes('/tracks')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tracks: this.spotify.tracks })
        });
      } else {
        // Default mock response for other Spotify endpoints
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: null })
        });
      }
    });
  }

  public async setupLLMMocks(page: any): Promise<void> {
    await page.route('**/api/chat/**', async (route: any) => {
      const request = route.request();
      const body = request.postDataJSON();
      const message = body?.message || '';
      
      // Determine response based on message content
      let response = this.llm.responses.default;
      
      if (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('music')) {
        response = this.llm.responses['music recommendation'];
      } else if (message.toLowerCase().includes('artist')) {
        response = this.llm.responses['artist info'];
      } else if (message.toLowerCase().includes('playlist')) {
        response = this.llm.responses['playlist creation'];
      } else if (message.toLowerCase().includes('mood')) {
        response = this.llm.responses['mood music'];
      }

      this.llm.usage.requests++;
      this.llm.usage.tokens += response.length;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: response,
          model: this.llm.models[0],
          usage: this.llm.usage
        })
      });
    });
  }

  public async setupDatabaseMocks(page: any): Promise<void> {
    await page.route('**/api/db/**', async (route: any) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/users') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.database.users)
        });
      } else if (url.includes('/listening-history') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.database.listeningHistory)
        });
      } else if (url.includes('/recommendations') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.database.recommendations)
        });
      } else {
        // Default database mock response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      }
    });
  }

  // Network failure simulation
  public async simulateNetworkFailure(page: any, endpoints: string[] = ['**']): Promise<void> {
    for (const endpoint of endpoints) {
      await page.route(endpoint, async (route: any) => {
        await route.abort('internetdisconnected');
      });
    }
  }

  // Performance monitoring
  public async setupPerformanceMonitoring(page: any): Promise<void> {
    await page.addInitScript(() => {
      window.testMetrics = {
        apiCalls: [],
        loadTimes: {},
        errors: []
      };

      // Monitor fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          window.testMetrics.apiCalls.push({
            url: args[0],
            duration: endTime - startTime,
            status: response.status,
            success: response.ok
          });
          return response;
        } catch (error) {
          const endTime = performance.now();
          window.testMetrics.errors.push({
            url: args[0],
            duration: endTime - startTime,
            error: error.message
          });
          throw error;
        }
      };
    });
  }

  // Get mock data for assertions
  public getSpotifyData(): SpotifyMockData {
    return this.spotify;
  }

  public getLLMData(): LLMMockData {
    return this.llm;
  }

  public getDatabaseData(): DatabaseMockData {
    return this.database;
  }

  // Reset all mocks
  public reset(): void {
    this.spotify = this.createSpotifyMock();
    this.llm = this.createLLMMock();
    this.database = this.createDatabaseMock();
  }
}

export default MockProvider;