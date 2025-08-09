const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// OpenAPI/Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EchoTune AI API',
      version: '2.1.0',
      description: 'Next-generation music recommendation system with conversational AI',
      contact: {
        name: 'EchoTune AI Team',
        url: 'https://github.com/dzp5103/Spotify-echo',
        email: 'support@echotune-ai.com',
      },
      license: {
        name: 'MIT',
        url: 'https://github.com/dzp5103/Spotify-echo/blob/main/LICENSE',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        spotifyAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.spotify.com/authorize',
              tokenUrl: 'https://accounts.spotify.com/api/token',
              scopes: {
                'user-read-private': 'Read user profile',
                'user-read-email': 'Read user email',
                'user-read-playback-state': 'Read playback state',
                'user-read-recently-played': 'Read recently played tracks',
                'user-top-read': 'Read top artists and tracks',
                'playlist-read-private': 'Read private playlists',
                'playlist-modify-public': 'Modify public playlists',
                'playlist-modify-private': 'Modify private playlists',
              },
            },
          },
        },
      },
      schemas: {
        Track: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Spotify track ID',
            },
            name: {
              type: 'string',
              description: 'Track name',
            },
            artists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
            album: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      height: { type: 'number' },
                      width: { type: 'number' },
                    },
                  },
                },
              },
            },
            duration_ms: {
              type: 'number',
              description: 'Track duration in milliseconds',
            },
            popularity: {
              type: 'number',
              description: 'Track popularity (0-100)',
            },
            preview_url: {
              type: 'string',
              description: 'Preview URL for the track',
            },
          },
        },
        Recommendation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Recommendation ID',
            },
            track: {
              $ref: '#/components/schemas/Track',
            },
            score: {
              type: 'number',
              description: 'Recommendation score (0-1)',
            },
            reason: {
              type: 'string',
              description: 'Reason for recommendation',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'User message',
            },
            provider: {
              type: 'string',
              enum: ['openai', 'gemini', 'azure', 'openrouter', 'mock'],
              description: 'AI provider to use',
            },
            context: {
              type: 'object',
              description: 'Additional context for the conversation',
            },
          },
          required: ['message'],
        },
        ChatResponse: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'AI response',
            },
            recommendations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Recommendation',
              },
            },
            intent: {
              type: 'object',
              description: 'Detected user intent',
            },
            provider: {
              type: 'string',
              description: 'AI provider used',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/api/routes/*.js', './src/api/middleware/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerOptions,
};
