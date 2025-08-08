# 🏗️ EchoTune AI - System Architecture

## Overview

EchoTune AI is a microservices-based music recommendation platform that combines Spotify's Web API with advanced AI/ML capabilities to deliver personalized music discovery experiences.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Web Interface]
        SPA[Single Page App]
        PWA[Progressive Web App]
    end

    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
        LB[Load Balancer]
        SSL[SSL/TLS Termination]
    end

    subgraph "Backend Services"
        API[Express.js API Server]
        MCP[MCP Automation Server]
        ML[Python ML Engine]
        CHAT[AI Chat Service]
    end

    subgraph "AI/ML Layer"
        GEMINI[Google Gemini API]
        OPENAI[OpenAI GPT API]
        MODELS[Custom ML Models]
        REC[Recommendation Engine]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas)]
        REDIS[(Redis Cache)]
        FILES[File Storage]
    end

    subgraph "External Services"
        SPOTIFY[Spotify Web API]
        CDN[Content Delivery Network]
        MONITOR[Monitoring Services]
    end

    UI --> NGINX
    SPA --> NGINX
    PWA --> NGINX

    NGINX --> LB
    LB --> API
    LB --> MCP

    API --> ML
    API --> CHAT
    API --> SPOTIFY

    CHAT --> GEMINI
    CHAT --> OPENAI
    ML --> MODELS
    ML --> REC

    API --> MONGO
    API --> REDIS
    ML --> MONGO
    MCP --> FILES

    API --> MONITOR
    ML --> MONITOR
```

## Component Architecture

### 🎵 Music Recommendation Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant ML
    participant Spotify
    participant Cache

    User->>WebApp: Request recommendations
    WebApp->>API: GET /api/recommendations
    API->>Cache: Check cached results

    alt Cache Hit
        Cache->>API: Return cached data
    else Cache Miss
        API->>ML: Generate recommendations
        ML->>Spotify: Fetch user data
        Spotify->>ML: Return listening history
        ML->>ML: Process with algorithms
        ML->>API: Return recommendations
        API->>Cache: Store results
    end

    API->>WebApp: Return recommendations
    WebApp->>User: Display results
```

### 🤖 AI Chat Interface Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant Intent
    participant LLM
    participant Music
    participant Spotify

    User->>Chat: Send message
    Chat->>Intent: Parse musical intent
    Intent->>Chat: Return structured intent
    Chat->>LLM: Generate response
    LLM->>Chat: Return AI response
    Chat->>Music: Get track recommendations
    Music->>Spotify: Search tracks
    Spotify->>Music: Return track data
    Music->>Chat: Return enriched tracks
    Chat->>User: Complete response with music
```

## Data Architecture

### 📊 Database Schema (MongoDB)

```mermaid
erDiagram
    USERS ||--o{ LISTENING_HISTORY : has
    USERS ||--o{ RECOMMENDATIONS : receives
    USERS ||--o{ CHAT_SESSIONS : participates
    USERS ||--o{ PLAYLISTS : creates

    USERS {
        ObjectId _id
        string spotify_id
        string display_name
        string email
        object preferences
        datetime created_at
        datetime last_active
    }

    LISTENING_HISTORY {
        ObjectId _id
        ObjectId user_id
        string track_id
        string track_name
        string artist_name
        object audio_features
        datetime played_at
        integer play_count
    }

    RECOMMENDATIONS {
        ObjectId _id
        ObjectId user_id
        array track_ids
        string algorithm_version
        object metadata
        float confidence_score
        datetime generated_at
    }

    CHAT_SESSIONS {
        ObjectId _id
        ObjectId user_id
        array messages
        object context
        datetime started_at
        datetime updated_at
    }

    PLAYLISTS {
        ObjectId _id
        ObjectId user_id
        string spotify_playlist_id
        string name
        array track_ids
        object generation_criteria
        datetime created_at
    }
```

## Technology Stack

### 🖥️ Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: JavaScript (ES2022)
- **ML Engine**: Python 3.8+
- **Process Manager**: PM2

### 🎨 Frontend
- **Framework**: Vanilla JavaScript (Modular)
- **Bundler**: Vite
- **Styling**: CSS3 with CSS Variables
- **PWA**: Service Workers + Web App Manifest

### 🗄️ Data Storage
- **Primary Database**: MongoDB Atlas
- **Caching**: Redis (In-Memory)
- **File Storage**: Local/Cloud Storage
- **Search Engine**: MongoDB Atlas Search

### 🤖 AI/ML Stack
- **LLM APIs**: OpenAI GPT, Google Gemini
- **ML Libraries**: scikit-learn, pandas, numpy
- **Recommendation**: Collaborative Filtering, Content-Based
- **NLP**: Intent recognition, sentiment analysis

### ☁️ Infrastructure
- **Cloud Provider**: DigitalOcean
- **Containerization**: Docker
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Monitoring**: Custom health checks

## Security Architecture

### 🔐 Authentication & Authorization

```mermaid
graph LR
    subgraph "Auth Flow"
        USER[User] --> SPOTIFY_AUTH[Spotify OAuth]
        SPOTIFY_AUTH --> TOKEN[Access Token]
        TOKEN --> API_ACCESS[API Access]
    end

    subgraph "Security Layers"
        HTTPS[HTTPS/TLS]
        CORS[CORS Policy]
        RATE[Rate Limiting]
        VALIDATION[Input Validation]
    end

    API_ACCESS --> HTTPS
    HTTPS --> CORS
    CORS --> RATE
    RATE --> VALIDATION
```

### 🛡️ Security Measures
- **Transport Security**: TLS 1.3 encryption
- **API Security**: OAuth 2.0 with PKCE
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: Per-user and per-endpoint limits
- **CORS**: Strict origin policies
- **Secrets Management**: Environment variables only

## Scalability & Performance

### 📈 Horizontal Scaling Strategy

```mermaid
graph TB
    subgraph "Load Distribution"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end

    subgraph "Cache Layer"
        REDIS1[Redis Primary]
        REDIS2[Redis Replica]
    end

    subgraph "Database Layer"
        MONGO_PRIMARY[MongoDB Primary]
        MONGO_SECONDARY[MongoDB Secondary]
        MONGO_ARBITER[MongoDB Arbiter]
    end

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> REDIS1
    API2 --> REDIS1
    API3 --> REDIS1

    REDIS1 --> REDIS2

    API1 --> MONGO_PRIMARY
    API2 --> MONGO_PRIMARY
    API3 --> MONGO_PRIMARY

    MONGO_PRIMARY --> MONGO_SECONDARY
    MONGO_PRIMARY --> MONGO_ARBITER
```

### ⚡ Performance Optimizations
- **Caching Strategy**: Multi-layer caching (Redis + In-Memory)
- **Database Indexing**: Optimized MongoDB indexes
- **CDN Integration**: Static asset delivery
- **Lazy Loading**: Progressive data loading
- **Connection Pooling**: Database connection optimization

## Deployment Architecture

### 🚀 Production Environment

```mermaid
graph TB
    subgraph "External"
        USERS[Users]
        SPOTIFY_API[Spotify API]
        AI_APIS[AI/ML APIs]
    end

    subgraph "Edge Layer"
        CDN[CloudFront CDN]
        DNS[Route 53 DNS]
    end

    subgraph "Application Layer"
        ALB[Application Load Balancer]
        WEB1[Web Server 1]
        WEB2[Web Server 2]
        API1[API Server 1]
        API2[API Server 2]
    end

    subgraph "Data Layer"
        RDS[MongoDB Atlas]
        CACHE[Redis Cloud]
        S3[File Storage]
    end

    USERS --> DNS
    DNS --> CDN
    CDN --> ALB
    ALB --> WEB1
    ALB --> WEB2
    ALB --> API1
    ALB --> API2

    API1 --> RDS
    API2 --> RDS
    API1 --> CACHE
    API2 --> CACHE

    API1 --> SPOTIFY_API
    API2 --> SPOTIFY_API
    API1 --> AI_APIS
    API2 --> AI_APIS
```

## Monitoring & Observability

### 📊 System Monitoring
- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Business Metrics**: Recommendation accuracy, user engagement
- **Log Aggregation**: Structured logging with correlation IDs

### 🚨 Alerting Strategy
- **Critical Alerts**: Service downtime, high error rates
- **Warning Alerts**: Performance degradation, capacity limits
- **Informational**: Deployment notifications, scaling events

## Development Workflow

### 🔄 CI/CD Pipeline

```mermaid
graph LR
    DEV[Developer] --> GIT[Git Push]
    GIT --> LINT[Linting & Tests]
    LINT --> BUILD[Build & Package]
    BUILD --> DEPLOY_STAGING[Deploy to Staging]
    DEPLOY_STAGING --> E2E[E2E Testing]
    E2E --> DEPLOY_PROD[Deploy to Production]
    DEPLOY_PROD --> MONITOR[Monitor & Verify]
```

### 🧪 Testing Strategy
- **Unit Tests**: Core business logic
- **Integration Tests**: API endpoints and database
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability scanning

## Future Architecture Considerations

### 🔮 Planned Enhancements
- **Microservices Migration**: Split monolith into domain services
- **Event-Driven Architecture**: Implement message queues
- **GraphQL API**: Flexible data fetching layer
- **Real-time Features**: WebSocket integration
- **AI Model Hosting**: Self-hosted ML inference

---

**Last Updated**: January 2024
**Architecture Version**: v1.0
