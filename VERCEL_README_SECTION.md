## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dzp5103/Spotify-echo&env=MONGODB_URI,JWT_SECRET,SESSION_SECRET,REDIS_URL,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,OPENAI_API_KEY,PERPLEXITY_API_KEY&envDescription=Environment%20variables%20for%20EchoTune%20AI&envLink=https://github.com/dzp5103/Spotify-echo/blob/main/vercel.env.txt)

### One-Click Deployment

Click the button above to deploy EchoTune AI to Vercel instantly! The deployment will:

✅ **Auto-detect** your repository and framework  
✅ **Configure** build settings automatically  
✅ **Set up** environment variables (you'll need to configure them)  
✅ **Deploy** your application to a production-ready URL  

### Manual Deployment

If you prefer manual deployment or need to customize the setup:

```bash
# Clone the repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install

# Set up Vercel environment
npm run vercel:setup

# Deploy to Vercel
npm run deploy:vercel
```

### Environment Variables Required

Before deploying, you'll need to configure these environment variables in your Vercel project:

#### 🔐 Required Variables
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_very_long_random_jwt_secret_key
SESSION_SECRET=your_very_long_random_session_secret_key
```

#### 🎵 Spotify Integration (Required for music features)
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

#### 🤖 AI/LLM Providers (Required for chat and recommendations)
```bash
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

#### 📊 Optional but Recommended
```bash
REDIS_URL=redis://username:password@host:port
GOOGLE_API_KEY=your_google_api_key
XAI_API_KEY=your_xai_api_key
```

### Deployment Commands

```bash
# Check deployment status
npm run deploy:vercel:check

# Build for production
npm run deploy:vercel:build

# Set environment variables
npm run deploy:vercel:env

# Quick deployment
npm run deploy:vercel:quick
```

### Custom Domain Setup

1. **Add Domain in Vercel Dashboard**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - HTTPS is enabled by default

### Performance Features

- ⚡ **Edge Functions** for API routes
- 🗜️ **Automatic compression** (Gzip + Brotli)
- 📱 **Responsive design** for all devices
- 🚀 **Fast builds** with Vite
- 📊 **Built-in analytics** and monitoring

### Troubleshooting

#### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs
   
   # Rebuild locally
   npm run build
   ```

2. **Environment Variables**
   ```bash
   # List current variables
   vercel env ls
   
   # Remove and re-add
   vercel env rm VARIABLE_NAME production
   vercel env add VARIABLE_NAME production
   ```

3. **API Routes Not Working**
   - Check `vercel.json` configuration
   - Verify `api/` directory structure
   - Test locally with `npm run dev`

#### Getting Help

- 📚 **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- 💬 **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- 🐛 **Project Issues**: [github.com/dzp5103/Spotify-echo/issues](https://github.com/dzp5103/Spotify-echo/issues)

### Deployment Checklist

- [ ] Repository is public or Vercel has access
- [ ] `vercel.json` is properly configured
- [ ] Environment variables are set
- [ ] Build passes locally (`npm run build`)
- [ ] API routes are working
- [ ] Frontend loads correctly
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate is active
- [ ] Monitoring is set up
- [ ] Performance is optimized

---

**Ready to deploy?** Click the "Deploy with Vercel" button above for instant deployment! 🚀

For detailed instructions, see [DEPLOY_TO_VERCEL.md](./DEPLOY_TO_VERCEL.md)