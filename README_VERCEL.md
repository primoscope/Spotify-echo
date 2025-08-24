# 🚀 EchoTune AI - Vercel Deployment

## Quick Start

```bash
# 1. Setup environment variables
npm run vercel:setup

# 2. Deploy to Vercel
npm run deploy:vercel

# 3. Or deploy to production directly
npm run deploy:vercel -- --prod
```

## 🏗️ Project Overview

EchoTune AI is a music recommendation platform that integrates with Spotify and uses AI to provide personalized music suggestions. This deployment guide covers deploying the full-stack application to Vercel.

## 📋 Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account
- [Redis Cloud](https://redis.com/try-free/) account (optional)
- [Spotify Developer](https://developer.spotify.com/) account

## 🔧 Environment Setup

### Option 1: Interactive Setup (Recommended)

```bash
npm run vercel:setup
```

This will:
- Generate secure secrets automatically
- Prompt for required API keys
- Create `.env.production.vercel` file
- Generate Vercel environment setup commands

### Option 2: Manual Setup

1. Copy `.env.production.vercel` to `.env.production.vercel.local`
2. Update with your actual values
3. Set environment variables in Vercel dashboard

## 🚀 Deployment Steps

### 1. Initial Setup

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link to existing project or create new one
vercel link
```

### 2. Environment Variables

```bash
# Set environment variables (after running vercel:setup)
./vercel-env-commands.sh

# Or manually set each variable
vercel env add MONGODB_URI production
vercel env add SPOTIFY_CLIENT_ID production
vercel env add SPOTIFY_CLIENT_SECRET production
# ... continue for all required variables
```

### 3. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📁 Project Structure

```
/
├── api/                          # Vercel serverless functions
│   ├── index.js                 # Main API entry point
│   └── health.js                # Health check endpoint
├── src/                          # Source code
│   ├── frontend/                # React frontend
│   ├── api/                     # API routes and logic
│   └── ...                      # Other source files
├── vercel.json                  # Vercel configuration
├── .vercelignore                # Files to exclude from deployment
├── .env.production.vercel       # Production environment template
└── package.json                 # Dependencies and scripts
```

## 🔐 Required Environment Variables

### Core Configuration
```bash
NODE_ENV=production
DOMAIN=your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Security
```bash
JWT_SECRET=32_character_random_string
SESSION_SECRET=32_character_random_string
ENCRYPTION_KEY=32_character_random_string
```

### Spotify API
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/auth/callback
```

### Database
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune
REDIS_URL=redis://username:password@redis-host:port
```

### AI Providers (Optional)
```bash
OPENAI_API_KEY=sk-your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🛠️ Available Scripts

```bash
# Environment setup
npm run vercel:setup              # Interactive environment setup

# Deployment
npm run deploy:vercel             # Full deployment process
npm run deploy:vercel:check       # Check prerequisites only
npm run deploy:vercel:build       # Build project only
npm run deploy:vercel:env         # Set environment variables only
npm run deploy:vercel:quick       # Deploy only (assumes setup complete)

# Development
npm run build                     # Build frontend
npm run dev                       # Start development server
npm run test                      # Run tests
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Environment Variable "MONGODB_URI" references Secret "mongodb_uri", which does not exist

**Solution**: Set environment variables directly in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add `MONGODB_URI` with your MongoDB connection string
4. Set environment (Production, Preview, Development)

#### 2. Build Failures

**Check**:
- All dependencies are in `package.json`
- Build script is correct: `"build": "vite build"`
- Node.js version is compatible (18+)

#### 3. API Routes Not Working

**Verify**:
- API functions are in `/api` directory
- Functions export properly for Vercel
- Routes are configured in `vercel.json`

#### 4. CORS Issues

**Update CORS configuration**:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-app.vercel.app'],
  credentials: true
}));
```

### Debug Commands

```bash
# Check Vercel project status
vercel status

# View deployment logs
vercel logs

# List environment variables
vercel env ls

# Test locally
vercel dev
```

## 📊 Monitoring & Analytics

### Health Checks
- Use `/api/health` endpoint for monitoring
- Set up uptime monitoring
- Monitor API response times

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance metrics
- Track user behavior

### Error Tracking
- Integrate Sentry for error monitoring
- Set up Vercel function logs
- Monitor build and deployment success rates

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use Vercel's built-in secret management
- Rotate secrets regularly

### API Security
- Implement rate limiting
- Use HTTPS only
- Validate all inputs
- Implement proper authentication

### CORS Configuration
- Restrict origins to trusted domains
- Limit allowed methods and headers
- Use credentials carefully

## 🚀 Performance Optimization

### Build Optimization
- Use `.vercelignore` to exclude unnecessary files
- Optimize bundle size with Vite
- Implement code splitting

### API Optimization
- Use serverless functions efficiently
- Implement caching strategies
- Optimize database queries

### Frontend Optimization
- Implement lazy loading
- Use CDN for static assets
- Optimize images and media

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] API endpoints working
- [ ] Frontend building successfully
- [ ] CORS configured correctly
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Health checks working
- [ ] Monitoring set up
- [ ] SSL/HTTPS enabled
- [ ] Performance optimized
- [ ] Error handling implemented

## 🔄 Continuous Deployment

### GitHub Integration
- Connect GitHub repository
- Enable automatic deployments
- Set up branch protection rules

### Environment Promotion
- Deploy to preview on PR
- Promote to production on merge
- Use environment-specific configurations

### Rollback Strategy
- Keep previous deployments
- Implement quick rollback
- Monitor deployment health

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with production config
4. Check Vercel status page
5. Contact Vercel support if needed

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Deployment](https://vercel.com/docs/deployments)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Redis Cloud](https://docs.redis.com/)
- [Spotify Developer](https://developer.spotify.com/documentation)

## 🎯 Next Steps

After successful deployment:
1. Configure custom domain (optional)
2. Set up monitoring and alerting
3. Implement CI/CD pipeline
4. Add performance monitoring
5. Set up backup strategies
6. Plan scaling strategies

---

**Happy Deploying! 🚀**

For questions or issues, please refer to the main project documentation or create an issue in the repository.