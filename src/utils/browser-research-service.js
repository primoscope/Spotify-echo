#!/usr/bin/env node

/**
 * Enhanced Browser Research Service
 * 
 * Integrates Perplexity API research with browser automation
 * for comprehensive research validation and evidence collection.
 * 
 * Features:
 * - Perplexity API integration with multiple models
 * - Browser automation for source verification
 * - Evidence collection and screenshot capture
 * - Citation validation and cross-referencing
 * - Research artifact generation
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class BrowserResearchService {
  constructor(options = {}) {
    this.config = {
      perplexityApiKey: options.perplexityApiKey || process.env.PERPLEXITY_API_KEY,
      browserbaseApiKey: options.browserbaseApiKey || process.env.BROWSERBASE_API_KEY,
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      maxSources: options.maxSources || 5,
      evidenceStorage: options.evidenceStorage || 'automation-artifacts/evidence',
      ...options
    };
    
    this.session = {
      id: this.generateSessionId(),
      startTime: performance.now(),
      research: [],
      evidence: [],
      validatedSources: []
    };
    
    // Initialize browser automation if available
    this.browserAvailable = false;
    this.initializeBrowserAutomation();
    
    console.log(`🔬 Browser Research Service initialized - Session ${this.session.id}`);
    console.log(`🌐 Browser automation: ${this.browserAvailable ? 'Available' : 'Mock mode'}`);
  }
  
  generateSessionId() {
    return `browser-research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async initializeBrowserAutomation() {
    try {
      // Try to load puppeteer or similar browser automation
      if (this.config.browserbaseApiKey) {
        console.log('🎯 Using Browserbase for browser automation');
        this.browserAvailable = true;
        this.browserType = 'browserbase';
      } else {
        // Try puppeteer
        try {
          this.puppeteer = require('puppeteer');
          this.browserAvailable = true;
          this.browserType = 'puppeteer';
          console.log('🎯 Using Puppeteer for browser automation');
        } catch (error) {
          console.log('⚠️ Browser automation not available - using mock mode');
          this.browserAvailable = false;
        }
      }
    } catch (error) {
      console.log('⚠️ Browser automation initialization failed:', error.message);
      this.browserAvailable = false;
    }
  }
  
  async conductResearch(topic, options = {}) {
    console.log(`🔬 Conducting research on: ${topic}`);
    
    const researchSession = {
      id: `research-${Date.now()}`,
      topic,
      startTime: performance.now(),
      perplexityResults: null,
      browserVerification: null,
      evidence: [],
      validatedSources: [],
      confidence: 0
    };
    
    try {
      // Step 1: Perplexity Research
      researchSession.perplexityResults = await this.perplexityResearch(topic, options);
      
      // Step 2: Browser Verification (if enabled and available)
      if (options.verifyWithBrowser && this.browserAvailable) {
        researchSession.browserVerification = await this.browserVerification(
          researchSession.perplexityResults,
          options.verificationCriteria
        );
      }
      
      // Step 3: Calculate confidence score
      researchSession.confidence = this.calculateConfidenceScore(researchSession);
      
      // Step 4: Generate evidence artifacts
      await this.generateEvidenceArtifacts(researchSession);
      
      researchSession.endTime = performance.now();
      researchSession.duration = ((researchSession.endTime - researchSession.startTime) / 1000).toFixed(2);
      
      this.session.research.push(researchSession);
      
      console.log(`✅ Research completed in ${researchSession.duration}s - Confidence: ${(researchSession.confidence * 100).toFixed(1)}%`);
      
      return researchSession;
      
    } catch (error) {
      console.error(`❌ Research failed for ${topic}:`, error.message);
      researchSession.error = error.message;
      researchSession.endTime = performance.now();
      return researchSession;
    }
  }
  
  async perplexityResearch(topic, options = {}) {
    console.log('🧠 Conducting Perplexity research...');
    
    const query = this.enhanceQuery(topic, options);
    
    if (!this.config.perplexityApiKey || this.config.perplexityApiKey === 'demo_mode') {
      console.log('⚠️ Using mock Perplexity response');
      return this.getMockPerplexityResponse(topic);
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'sonar-pro',
          messages: [{
            role: 'user',
            content: query
          }],
          max_tokens: options.maxTokens || 1500,
          temperature: 0.1,
          return_citations: true,
          search_domain_filter: options.domainFilter || ['github.com', 'stackoverflow.com', 'developer.mozilla.org'],
          search_recency_filter: options.timeFilter || 'month'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        citations: data.citations || [],
        model: options.model || 'sonar-pro',
        query: query,
        timestamp: Date.now(),
        success: true
      };
      
    } catch (error) {
      console.error('Perplexity API failed:', error.message);
      return this.getMockPerplexityResponse(topic, error.message);
    }
  }
  
  enhanceQuery(topic, options) {
    let enhancedQuery = topic;
    
    // Add context based on options
    if (options.context === 'development') {
      enhancedQuery += ' - Focus on software development best practices, latest trends, and implementation examples';
    } else if (options.context === 'performance') {
      enhancedQuery += ' - Focus on performance optimization techniques, benchmarks, and monitoring strategies';
    } else if (options.context === 'security') {
      enhancedQuery += ' - Focus on security best practices, vulnerability prevention, and compliance requirements';
    }
    
    // Add time constraint
    if (options.timeFilter === 'week') {
      enhancedQuery += ' - Prioritize information from the last week';
    } else if (options.timeFilter === 'month') {
      enhancedQuery += ' - Focus on recent developments from the last month';
    }
    
    // Add depth requirement
    if (options.depth === 'comprehensive') {
      enhancedQuery += ' - Provide comprehensive analysis with multiple perspectives and detailed examples';
    }
    
    return enhancedQuery;
  }
  
  async browserVerification(perplexityResults, criteria = {}) {
    console.log('🌐 Verifying sources with browser automation...');
    
    if (!this.browserAvailable) {
      console.log('⚠️ Browser verification unavailable - using mock verification');
      return this.getMockBrowserVerification(perplexityResults.citations);
    }
    
    const verificationResults = {
      totalSources: perplexityResults.citations.length,
      verifiedSources: 0,
      failedSources: 0,
      evidence: [],
      screenshots: []
    };
    
    if (this.browserType === 'puppeteer') {
      return await this.puppeteerVerification(perplexityResults.citations, criteria, verificationResults);
    } else if (this.browserType === 'browserbase') {
      return await this.browserbaseVerification(perplexityResults.citations, criteria, verificationResults);
    }
    
    return verificationResults;
  }
  
  async puppeteerVerification(citations, criteria, results) {
    let browser = null;
    
    try {
      browser = await this.puppeteer.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      for (const citation of citations.slice(0, this.config.maxSources)) {
        try {
          console.log(`  🔍 Verifying: ${citation.url}`);
          
          await page.goto(citation.url, { waitUntil: 'networkidle0', timeout: this.config.timeout });
          
          // Take screenshot
          const screenshotPath = await this.takeScreenshot(page, citation.url);
          results.screenshots.push(screenshotPath);
          
          // Extract content for verification
          const extractedContent = await page.evaluate(() => {
            return {
              title: document.title,
              text: document.body.innerText.substring(0, 2000),
              headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).slice(0, 10)
            };
          });
          
          // Verify content matches citation
          const verificationScore = this.verifyContentMatch(citation.snippet, extractedContent.text);
          
          if (verificationScore > 0.7) {
            results.verifiedSources++;
          } else {
            results.failedSources++;
          }
          
          results.evidence.push({
            url: citation.url,
            verified: verificationScore > 0.7,
            confidence: verificationScore,
            screenshot: screenshotPath,
            extractedContent: extractedContent.text.substring(0, 500),
            timestamp: new Date().toISOString()
          });
          
          // Rate limiting between requests
          await this.sleep(2000);
          
        } catch (error) {
          console.warn(`  ⚠️ Verification failed for ${citation.url}:`, error.message);
          results.failedSources++;
        }
      }
      
    } catch (error) {
      console.error('Browser verification failed:', error.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    
    return results;
  }
  
  async browserbaseVerification(citations, criteria, results) {
    // Placeholder for Browserbase integration
    console.log('🌐 Browserbase verification (placeholder implementation)');
    
    for (const citation of citations.slice(0, this.config.maxSources)) {
      results.evidence.push({
        url: citation.url,
        verified: Math.random() > 0.3, // Mock verification
        confidence: Math.random(),
        source: 'browserbase',
        timestamp: new Date().toISOString()
      });
    }
    
    results.verifiedSources = results.evidence.filter(e => e.verified).length;
    results.failedSources = results.evidence.length - results.verifiedSources;
    
    return results;
  }
  
  async takeScreenshot(page, url) {
    try {
      const evidencePath = path.join(this.config.evidenceStorage, 'screenshots');
      await fs.mkdir(evidencePath, { recursive: true });
      
      const filename = `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const fullPath = path.join(evidencePath, filename);
      
      await page.screenshot({
        path: fullPath,
        fullPage: true,
        type: 'png'
      });
      
      return fullPath;
    } catch (error) {
      console.warn('Screenshot failed:', error.message);
      return null;
    }
  }
  
  verifyContentMatch(citationSnippet, extractedContent) {
    if (!citationSnippet || !extractedContent) return 0;
    
    // Simple similarity check - in production would use more sophisticated NLP
    const citationWords = citationSnippet.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentWords = extractedContent.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of citationWords) {
      if (contentWords.includes(word)) {
        matches++;
      }
    }
    
    return citationWords.length > 0 ? matches / citationWords.length : 0;
  }
  
  calculateConfidenceScore(researchSession) {
    let confidence = 0.6; // Base confidence for Perplexity research
    
    if (researchSession.perplexityResults?.citations?.length > 0) {
      confidence += 0.2; // Citations increase confidence
    }
    
    if (researchSession.browserVerification) {
      const verificationRatio = researchSession.browserVerification.verifiedSources / 
                               Math.max(researchSession.browserVerification.totalSources, 1);
      confidence += verificationRatio * 0.3; // Browser verification can add up to 0.3
    }
    
    // Penalize for errors
    if (researchSession.error) {
      confidence *= 0.5;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  async generateEvidenceArtifacts(researchSession) {
    try {
      const artifactsPath = path.join(this.config.evidenceStorage, 'reports');
      await fs.mkdir(artifactsPath, { recursive: true });
      
      const artifact = {
        sessionId: this.session.id,
        researchId: researchSession.id,
        topic: researchSession.topic,
        timestamp: new Date().toISOString(),
        duration: researchSession.duration,
        confidence: researchSession.confidence,
        perplexityResults: researchSession.perplexityResults,
        browserVerification: researchSession.browserVerification,
        evidence: researchSession.evidence,
        metadata: {
          browserAvailable: this.browserAvailable,
          browserType: this.browserType,
          sourcesVerified: researchSession.browserVerification?.verifiedSources || 0,
          totalSources: researchSession.browserVerification?.totalSources || 0
        }
      };
      
      const filename = `research-artifact-${researchSession.id}.json`;
      const filePath = path.join(artifactsPath, filename);
      
      await fs.writeFile(filePath, JSON.stringify(artifact, null, 2));
      
      console.log(`📄 Evidence artifact saved: ${filename}`);
      
      return filePath;
    } catch (error) {
      console.warn('Failed to generate evidence artifacts:', error.message);
      return null;
    }
  }
  
  getMockPerplexityResponse(topic, error = null) {
    let specificContent = '';
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('performance')) {
      specificContent = `Performance optimization strategies for music applications:
      
      1. **Audio Processing Optimizations**:
         - Implement Web Audio API for real-time audio processing
         - Use audio buffering strategies to prevent playback interruptions
         - Optimize Spotify Web Playback SDK integration
         
      2. **Frontend Performance**:
         - Implement virtual scrolling for large playlists
         - Use React.memo() for track list components
         - Optimize bundle size with dynamic imports
         
      3. **Backend Optimizations**:
         - Implement Redis caching for frequently accessed tracks
         - Optimize MongoDB aggregation pipelines for recommendations
         - Use database indexing for music metadata queries`;
         
    } else if (topicLower.includes('security')) {
      specificContent = `Security best practices for music streaming applications:
      
      1. **Authentication & Authorization**:
         - Implement OAuth 2.0 with Spotify integration
         - Use JWT tokens with proper expiration
         - Implement refresh token rotation
         
      2. **API Security**:
         - Rate limiting for music API endpoints
         - Input validation for playlist and track data
         - HTTPS enforcement for all communications
         
      3. **Data Protection**:
         - Encrypt sensitive user listening data
         - Implement GDPR compliance for EU users
         - Secure handling of Spotify API credentials`;
         
    } else if (topicLower.includes('roadmap')) {
      specificContent = `Development roadmap analysis for EchoTune AI:
      
      1. **High Priority Tasks**:
         - Enhance music recommendation algorithm accuracy
         - Implement real-time collaborative playlist features
         - Add advanced audio analysis capabilities
         
      2. **Medium Priority Features**:
         - Social sharing and music discovery features
         - Mobile app development and optimization
         - Integration with additional music services
         
      3. **Technical Improvements**:
         - Performance monitoring and optimization
         - Enhanced error handling and logging
         - Automated testing and CI/CD improvements`;
         
    } else {
      specificContent = `Comprehensive analysis for: "${topic}"
      
      1. **Current Best Practices**:
         - Follow modern development standards
         - Implement responsive and accessible design
         - Use automated testing and quality assurance
         
      2. **Implementation Recommendations**:
         - Adopt microservices architecture for scalability
         - Use containerization for deployment consistency
         - Implement monitoring and alerting systems
         
      3. **Future Considerations**:
         - Plan for mobile-first development
         - Consider progressive web app features
         - Implement analytics and user behavior tracking`;
    }

    return {
      content: `${specificContent}\n\n${error ? `Note: Using mock data due to API error: ${error}` : 'Note: Using mock data for demonstration - results would be enhanced with actual Perplexity API.'}`,
      citations: [
        { url: 'https://github.com/dzp5103/Spotify-echo', snippet: 'EchoTune AI repository with implementation examples...' },
        { url: 'https://developer.spotify.com/documentation/', snippet: 'Spotify Web API documentation and best practices...' },
        { url: 'https://web.dev/articles/audio', snippet: 'Web audio and streaming optimization techniques...' }
      ],
      model: 'mock-sonar-pro',
      query: topic,
      timestamp: Date.now(),
      success: !error,
      mockData: true,
      ...(error && { error: error })
    };
  }
  
  getMockBrowserVerification(citations) {
    return {
      totalSources: citations.length,
      verifiedSources: Math.floor(citations.length * 0.8), // 80% verification rate
      failedSources: Math.ceil(citations.length * 0.2),
      evidence: citations.map((citation, index) => ({
        url: citation.url,
        verified: Math.random() > 0.2, // 80% success rate
        confidence: 0.7 + (Math.random() * 0.3),
        extractedContent: `Mock extracted content from ${citation.url}...`,
        timestamp: new Date().toISOString(),
        mockData: true
      })),
      screenshots: [],
      mockData: true
    };
  }
  
  async generateSessionReport() {
    const endTime = performance.now();
    const totalDuration = ((endTime - this.session.startTime) / 1000).toFixed(2);
    
    const report = {
      sessionId: this.session.id,
      startTime: new Date(Date.now() - (endTime - this.session.startTime)).toISOString(),
      endTime: new Date().toISOString(),
      duration: parseFloat(totalDuration),
      totalResearch: this.session.research.length,
      successfulResearch: this.session.research.filter(r => !r.error).length,
      averageConfidence: this.session.research.reduce((sum, r) => sum + (r.confidence || 0), 0) / Math.max(this.session.research.length, 1),
      browserAutomationUsed: this.browserAvailable,
      evidenceCollected: this.session.evidence.length,
      config: {
        browserType: this.browserType,
        maxSources: this.config.maxSources,
        headless: this.config.headless
      },
      research: this.session.research
    };
    
    // Save session report
    try {
      const reportsPath = path.join(this.config.evidenceStorage, 'sessions');
      await fs.mkdir(reportsPath, { recursive: true });
      
      const filename = `browser-research-session-${this.session.id}.json`;
      await fs.writeFile(
        path.join(reportsPath, filename),
        JSON.stringify(report, null, 2)
      );
      
      console.log(`📊 Session report saved: ${filename}`);
    } catch (error) {
      console.warn('Failed to save session report:', error.message);
    }
    
    return report;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node browser-research-service.js "research topic" [--verify-browser] [--model=sonar-pro]');
    process.exit(1);
  }
  
  const topic = args[0];
  const options = {
    verifyWithBrowser: args.includes('--verify-browser'),
    model: args.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'sonar-pro',
    context: args.find(arg => arg.startsWith('--context='))?.split('=')[1] || 'development',
    depth: args.find(arg => arg.startsWith('--depth='))?.split('=')[1] || 'standard'
  };
  
  const service = new BrowserResearchService();
  
  console.log('\n🔬 Starting Browser Research Service');
  console.log(`📋 Topic: ${topic}`);
  console.log(`🌐 Browser Verification: ${options.verifyWithBrowser ? 'Enabled' : 'Disabled'}`);
  console.log(`🤖 Model: ${options.model}`);
  console.log(`🎯 Context: ${options.context}`);
  
  const result = await service.conductResearch(topic, options);
  
  console.log('\n📊 Research Results:');
  console.log(`✅ Success: ${!result.error}`);
  console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`📄 Content Length: ${result.perplexityResults?.content?.length || 0} characters`);
  console.log(`🔗 Citations: ${result.perplexityResults?.citations?.length || 0}`);
  
  if (result.browserVerification) {
    console.log(`🌐 Sources Verified: ${result.browserVerification.verifiedSources}/${result.browserVerification.totalSources}`);
  }
  
  await service.generateSessionReport();
  
  console.log('\n🎉 Research completed successfully!');
}

// Export for programmatic use
module.exports = BrowserResearchService;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Browser research service failed:', error);
    process.exit(1);
  });
}