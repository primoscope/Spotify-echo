#!/usr/bin/env node

/**
 * Music Research Automation for EchoTune AI
 * 
 * Features:
 * - Automated music trend research using Perplexity API
 * - Genre analysis and emerging artist discovery
 * - Music industry insights and competitive analysis
 * - Integration with recommendation algorithms
 * - Weekly research reports for strategy planning
 */

const fs = require('fs').promises;
const path = require('path');

class MusicResearchAutomator {
  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.researchCache = new Map();
    this.researchResults = {
      trends: [],
      artists: [],
      genres: [],
      industry: [],
      insights: []
    };
    
    if (!this.perplexityApiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY not found. Research features will be limited.');
    }
  }

  async runWeeklyMusicResearch() {
    console.log('🎵 Starting Weekly Music Research Automation...\n');

    try {
      await Promise.all([
        this.researchMusicTrends(),
        this.discoverEmergingArtists(),
        this.analyzeGenreEvolution(),
        this.monitorIndustryDevelopments(),
        this.competitiveAnalysis()
      ]);

      await this.generateMusicResearchReport();
      await this.updateRecommendationData();
      
      console.log('✅ Weekly music research completed successfully!');
      
    } catch (error) {
      console.error('❌ Music research failed:', error.message);
      throw error;
    }
  }

  async researchMusicTrends() {
    console.log('📈 Researching Current Music Trends...');

    const trendQueries = [
      'Latest music trends and viral songs in 2025, include streaming data and social media impact',
      'Emerging music genres and subgenres gaining popularity in 2025',
      'Current music production trends and audio engineering innovations',
      'Music streaming platform algorithm changes and their impact on discovery'
    ];

    for (const query of trendQueries) {
      try {
        const research = await this.performPerplexityResearch(query, {
          category: 'trends',
          domains: ['spotify.com', 'billboard.com', 'musicindustryresearch.com', 'pitchfork.com']
        });

        this.researchResults.trends.push({
          query: query,
          findings: research.content,
          sources: research.citations,
          timestamp: new Date().toISOString(),
          relevanceScore: this.calculateRelevanceScore(research.content)
        });

        console.log(`  ✅ Trend research completed: ${query.substring(0, 50)}...`);
        
      } catch (error) {
        console.log(`  ❌ Trend research failed: ${error.message}`);
      }
    }
  }

  async discoverEmergingArtists() {
    console.log('🎤 Discovering Emerging Artists...');

    const artistQueries = [
      'Breakout artists and new musicians gaining popularity in 2025, include streaming numbers',
      'Independent artists and labels making significant impact in music discovery',
      'Rising artists in electronic, indie, hip-hop, and alternative genres',
      'Artists with innovative approaches to music distribution and fan engagement'
    ];

    for (const query of artistQueries) {
      try {
        const research = await this.performPerplexityResearch(query, {
          category: 'artists',
          domains: ['spotify.com', 'soundcloud.com', 'bandcamp.com', 'musicbusinessworldwide.com']
        });

        const artistData = this.extractArtistInformation(research.content);
        
        this.researchResults.artists.push({
          query: query,
          artists: artistData,
          sources: research.citations,
          timestamp: new Date().toISOString(),
          potentialForRecommendation: this.assessRecommendationPotential(artistData)
        });

        console.log(`  ✅ Artist discovery completed: Found ${artistData.length} potential artists`);
        
      } catch (error) {
        console.log(`  ❌ Artist discovery failed: ${error.message}`);
      }
    }
  }

  async analyzeGenreEvolution() {
    console.log('🎼 Analyzing Genre Evolution...');

    const genres = ['electronic', 'indie', 'hip-hop', 'pop', 'rock', 'r&b', 'folk', 'jazz'];
    
    for (const genre of genres) {
      try {
        const query = `${genre} music evolution and subgenres in 2025, include audio characteristics and cultural influences`;
        
        const research = await this.performPerplexityResearch(query, {
          category: 'genres',
          domains: ['allmusic.com', 'musictheory.org', 'everynoise.com']
        });

        const genreAnalysis = {
          genre: genre,
          evolution: research.content,
          subgenres: this.extractSubgenres(research.content),
          audioCharacteristics: this.extractAudioFeatures(research.content),
          sources: research.citations,
          timestamp: new Date().toISOString()
        };

        this.researchResults.genres.push(genreAnalysis);
        console.log(`  ✅ ${genre} genre analysis completed`);
        
      } catch (error) {
        console.log(`  ❌ ${genre} genre analysis failed: ${error.message}`);
      }
    }
  }

  async monitorIndustryDevelopments() {
    console.log('🏢 Monitoring Music Industry Developments...');

    const industryQueries = [
      'Music streaming industry developments and algorithm changes in 2025',
      'AI and machine learning applications in music recommendation and discovery',
      'Music licensing, royalties, and artist compensation developments',
      'New music discovery platforms and technologies emerging in 2025'
    ];

    for (const query of industryQueries) {
      try {
        const research = await this.performPerplexityResearch(query, {
          category: 'industry',
          domains: ['musicbusinessworldwide.com', 'midiaresearch.com', 'digitalmusicnews.com']
        });

        const industryInsight = {
          topic: query,
          findings: research.content,
          impact: this.assessIndustryImpact(research.content),
          actionItems: this.generateActionItems(research.content),
          sources: research.citations,
          timestamp: new Date().toISOString()
        };

        this.researchResults.industry.push(industryInsight);
        console.log(`  ✅ Industry research completed: ${query.substring(0, 40)}...`);
        
      } catch (error) {
        console.log(`  ❌ Industry research failed: ${error.message}`);
      }
    }
  }

  async competitiveAnalysis() {
    console.log('🔍 Performing Competitive Analysis...');

    const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Tidal'];
    
    for (const platform of platforms) {
      try {
        const query = `${platform} music discovery features, recommendation algorithms, and user experience innovations in 2025`;
        
        const research = await this.performPerplexityResearch(query, {
          category: 'competitive',
          domains: ['techcrunch.com', 'theverge.com', 'musictech.net']
        });

        const competitiveInsight = {
          platform: platform,
          features: this.extractFeatures(research.content),
          strengths: this.identifyStrengths(research.content),
          opportunities: this.identifyOpportunities(research.content),
          sources: research.citations,
          timestamp: new Date().toISOString()
        };

        this.researchResults.insights.push(competitiveInsight);
        console.log(`  ✅ ${platform} competitive analysis completed`);
        
      } catch (error) {
        console.log(`  ❌ ${platform} competitive analysis failed: ${error.message}`);
      }
    }
  }

  async performPerplexityResearch(query, options = {}) {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(query, options);
    if (this.researchCache.has(cacheKey)) {
      return this.researchCache.get(cacheKey);
    }

    try {
      const axios = require('axios');
      
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'llama-3.1-sonar-huge-128k-online',
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        stream: false,
        return_citations: true,
        search_domain_filter: options.domains || []
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const result = {
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.researchCache.set(cacheKey, result);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return result;
      
    } catch (error) {
      console.error('Perplexity API error:', error.message);
      throw new Error(`Research failed: ${error.message}`);
    }
  }

  extractArtistInformation(content) {
    // Extract artist names and information from research content
    const artistPattern = /(?:artist|musician|band)[\s\w]*?([A-Z][a-zA-Z\s]+)(?:\s|,|\.)/gi;
    const matches = content.match(artistPattern) || [];
    
    return matches.slice(0, 10).map(match => ({
      name: match.trim(),
      context: this.getContextAroundMatch(content, match),
      potentialGenres: this.extractGenresFromContext(content, match)
    }));
  }

  extractSubgenres(content) {
    const subgenrePattern = /([\w-]+(?:\s[\w-]+)?)\s*(?:music|genre|style)/gi;
    const matches = content.match(subgenrePattern) || [];
    return [...new Set(matches.slice(0, 8))];
  }

  extractAudioFeatures(content) {
    const features = ['tempo', 'rhythm', 'melody', 'harmony', 'timbre', 'dynamics'];
    const extractedFeatures = {};
    
    features.forEach(feature => {
      const pattern = new RegExp(`${feature}[^.]*`, 'gi');
      const match = content.match(pattern);
      if (match) {
        extractedFeatures[feature] = match[0];
      }
    });
    
    return extractedFeatures;
  }

  calculateRelevanceScore(content) {
    // Simple relevance scoring based on music-related keywords
    const musicKeywords = ['music', 'artist', 'song', 'album', 'genre', 'streaming', 'playlist'];
    const words = content.toLowerCase().split(/\s+/);
    const relevantWords = words.filter(word => musicKeywords.some(keyword => word.includes(keyword)));
    
    return Math.min(relevantWords.length / words.length, 1.0);
  }

  assessRecommendationPotential(artists) {
    // Assess how suitable these artists are for recommendations
    return artists.filter(artist => 
      artist.context.toLowerCase().includes('popular') ||
      artist.context.toLowerCase().includes('trending') ||
      artist.context.toLowerCase().includes('streaming')
    ).length / Math.max(artists.length, 1);
  }

  assessIndustryImpact(content) {
    const impactKeywords = ['significant', 'major', 'important', 'breakthrough', 'revolutionary'];
    const hasHighImpact = impactKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    return hasHighImpact ? 'high' : 'medium';
  }

  generateActionItems(content) {
    // Generate actionable insights from industry research
    const actionItems = [];
    
    if (content.toLowerCase().includes('algorithm')) {
      actionItems.push('Review recommendation algorithm updates');
    }
    
    if (content.toLowerCase().includes('user experience')) {
      actionItems.push('Evaluate UX improvements for music discovery');
    }
    
    if (content.toLowerCase().includes('ai') || content.toLowerCase().includes('machine learning')) {
      actionItems.push('Investigate new AI/ML applications for music recommendations');
    }
    
    return actionItems;
  }

  extractFeatures(content) {
    const featurePattern = /(?:feature|capability|function)[\s\w]*?([a-zA-Z\s]+)(?:\s|,|\.)/gi;
    const matches = content.match(featurePattern) || [];
    return matches.slice(0, 5).map(match => match.trim());
  }

  identifyStrengths(content) {
    const strengthKeywords = ['strong', 'excellent', 'superior', 'advanced', 'innovative'];
    const sentences = content.split(/[.!?]/);
    
    return sentences.filter(sentence => 
      strengthKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    ).slice(0, 3);
  }

  identifyOpportunities(content) {
    const opportunityKeywords = ['opportunity', 'potential', 'gap', 'lacking', 'could improve'];
    const sentences = content.split(/[.!?]/);
    
    return sentences.filter(sentence => 
      opportunityKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    ).slice(0, 3);
  }

  async generateMusicResearchReport() {
    console.log('📊 Generating Music Research Report...');

    const report = {
      reportInfo: {
        title: 'Weekly Music Research Report',
        generated: new Date().toISOString(),
        period: this.getReportPeriod(),
        totalResearches: this.getTotalResearchCount()
      },
      executiveSummary: this.generateExecutiveSummary(),
      trends: {
        summary: `${this.researchResults.trends.length} trend analyses completed`,
        keyFindings: this.researchResults.trends.slice(0, 3),
        recommendations: this.generateTrendRecommendations()
      },
      artists: {
        summary: `${this.researchResults.artists.length} artist discovery sessions`,
        emergingArtists: this.getTopEmergingArtists(),
        recommendationPotential: this.calculateAverageRecommendationPotential()
      },
      genres: {
        summary: `${this.researchResults.genres.length} genres analyzed`,
        evolutionInsights: this.getGenreEvolutionInsights(),
        newSubgenres: this.getNewSubgenres()
      },
      industry: {
        summary: `${this.researchResults.industry.length} industry insights`,
        keyDevelopments: this.getKeyIndustryDevelopments(),
        actionItems: this.getAllActionItems()
      },
      competitive: {
        summary: `${this.researchResults.insights.length} platforms analyzed`,
        opportunities: this.getCompetitiveOpportunities(),
        threats: this.getCompetitiveThreats()
      },
      recommendations: this.generateOverallRecommendations()
    };

    // Save detailed report
    const reportPath = path.join('automation-artifacts', 'music-research-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate summary for display
    this.displayReportSummary(report);
    
    console.log(`📄 Full report saved to: ${reportPath}`);
  }

  generateExecutiveSummary() {
    const totalFindings = this.getTotalResearchCount();
    const avgRelevance = this.calculateAverageRelevanceScore();
    
    return `This week's music research covered ${totalFindings} different areas with an average relevance score of ${(avgRelevance * 100).toFixed(1)}%. Key focus areas included emerging trends, artist discovery, genre evolution, and competitive analysis.`;
  }

  generateTrendRecommendations() {
    const trends = this.researchResults.trends;
    const recommendations = [];
    
    trends.forEach(trend => {
      if (trend.relevanceScore > 0.7) {
        recommendations.push(`Consider integrating insights from: ${trend.query.substring(0, 60)}...`);
      }
    });
    
    return recommendations.slice(0, 3);
  }

  async updateRecommendationData() {
    console.log('🔄 Updating Recommendation Algorithm Data...');

    const updateData = {
      trends: this.researchResults.trends.filter(t => t.relevanceScore > 0.6),
      artists: this.getHighPotentialArtists(),
      genres: this.researchResults.genres,
      lastUpdated: new Date().toISOString()
    };

    // Save update data for recommendation system
    const updatePath = path.join('automation-artifacts', 'recommendation-updates.json');
    await fs.writeFile(updatePath, JSON.stringify(updateData, null, 2));

    console.log(`  ✅ Recommendation data updated: ${updatePath}`);
    console.log(`  📈 ${updateData.trends.length} trend insights available for integration`);
    console.log(`  🎤 ${updateData.artists.length} high-potential artists identified`);
  }

  displayReportSummary(report) {
    console.log('\n📋 MUSIC RESEARCH SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📅 Period: ${report.reportInfo.period}`);
    console.log(`🔬 Total Research Items: ${report.reportInfo.totalResearches}`);
    console.log(`📈 Trends Analyzed: ${this.researchResults.trends.length}`);
    console.log(`🎤 Artists Discovered: ${this.researchResults.artists.length}`);
    console.log(`🎼 Genres Studied: ${this.researchResults.genres.length}`);
    console.log(`🏢 Industry Insights: ${this.researchResults.industry.length}`);
    console.log(`🔍 Competitive Analysis: ${this.researchResults.insights.length}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  // Helper methods
  generateCacheKey(query, options) {
    return `${query}_${JSON.stringify(options)}`.replace(/\s+/g, '_').toLowerCase();
  }

  getContextAroundMatch(content, match) {
    const index = content.indexOf(match);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + match.length + 50);
    return content.substring(start, end);
  }

  extractGenresFromContext(content, artistMatch) {
    const context = this.getContextAroundMatch(content, artistMatch);
    const genres = ['rock', 'pop', 'hip-hop', 'electronic', 'indie', 'folk', 'jazz', 'classical'];
    return genres.filter(genre => context.toLowerCase().includes(genre));
  }

  getReportPeriod() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return `${weekAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;
  }

  getTotalResearchCount() {
    return this.researchResults.trends.length + 
           this.researchResults.artists.length + 
           this.researchResults.genres.length + 
           this.researchResults.industry.length + 
           this.researchResults.insights.length;
  }

  calculateAverageRelevanceScore() {
    const allScores = this.researchResults.trends.map(t => t.relevanceScore);
    return allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  }

  getTopEmergingArtists() {
    return this.researchResults.artists
      .flatMap(a => a.artists)
      .filter(artist => artist.potentialGenres.length > 0)
      .slice(0, 10);
  }

  calculateAverageRecommendationPotential() {
    const potentials = this.researchResults.artists.map(a => a.potentialForRecommendation);
    return potentials.length > 0 ? potentials.reduce((a, b) => a + b, 0) / potentials.length : 0;
  }

  getGenreEvolutionInsights() {
    return this.researchResults.genres.map(g => ({
      genre: g.genre,
      subgenres: g.subgenres.length,
      evolution: g.evolution.substring(0, 100) + '...'
    }));
  }

  getNewSubgenres() {
    return this.researchResults.genres.flatMap(g => g.subgenres).slice(0, 10);
  }

  getKeyIndustryDevelopments() {
    return this.researchResults.industry
      .filter(i => i.impact === 'high')
      .map(i => i.topic);
  }

  getAllActionItems() {
    return this.researchResults.industry.flatMap(i => i.actionItems);
  }

  getCompetitiveOpportunities() {
    return this.researchResults.insights.flatMap(i => i.opportunities).slice(0, 5);
  }

  getCompetitiveThreats() {
    return this.researchResults.insights.flatMap(i => i.strengths).slice(0, 5);
  }

  getHighPotentialArtists() {
    return this.researchResults.artists
      .filter(a => a.potentialForRecommendation > 0.5)
      .flatMap(a => a.artists);
  }

  generateOverallRecommendations() {
    const recommendations = [];
    
    // Based on trends
    if (this.researchResults.trends.length > 0) {
      recommendations.push('Update recommendation algorithms with latest music trends');
    }
    
    // Based on artists
    if (this.getHighPotentialArtists().length > 5) {
      recommendations.push('Integrate emerging artists into discovery playlists');
    }
    
    // Based on industry insights
    if (this.getAllActionItems().length > 0) {
      recommendations.push('Implement industry best practices for user engagement');
    }
    
    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const automator = new MusicResearchAutomator();
  automator.runWeeklyMusicResearch().catch(console.error);
}

module.exports = MusicResearchAutomator;