/**
 * Browser Research Automation with Evidence Collection
 * Comprehensive testing suite with performance monitoring and multi-source verification
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PerplexityTestClient, Grok4Integration, TestResult } from './perplexity-test-framework';

// Types for browser research
interface ResearchQuery {
  id: string;
  query: string;
  sources: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  searchFilters?: {
    domains?: string[];
    recency?: 'month' | 'week' | 'day' | 'hour';
    includeImages?: boolean;
  };
}

interface EvidenceItem {
  id: string;
  type: 'citation' | 'image' | 'data' | 'code' | 'document';
  source: string;
  url: string;
  title: string;
  content: string;
  reliability: number;
  timestamp: number;
  metadata: {
    domain: string;
    contentType?: string;
    language?: string;
    wordCount?: number;
    imageCount?: number;
  };
}

interface ResearchSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  queries: ResearchQuery[];
  evidence: EvidenceItem[];
  results: TestResult[];
  performance: {
    totalQueries: number;
    successfulQueries: number;
    averageLatency: number;
    evidenceCollected: number;
    reliabilityScore: number;
  };
  validation: {
    crossReferences: number;
    conflictingEvidence: string[];
    supportingEvidence: string[];
    consensusScore: number;
  };
}

interface BrowserConfig {
  headless: boolean;
  timeout: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  screenshotPath: string;
  evidencePath: string;
}

// Browser automation client
export class BrowserResearchClient extends EventEmitter {
  private perplexityClient: PerplexityTestClient;
  private grok4Client: Grok4Integration;
  private config: BrowserConfig;
  private currentSession?: ResearchSession;
  
  constructor(
    perplexityConfig: any,
    browserConfig?: Partial<BrowserConfig>
  ) {
    super();
    
    this.perplexityClient = new PerplexityTestClient(perplexityConfig);
    this.grok4Client = new Grok4Integration(perplexityConfig);
    
    this.config = {
      headless: true,
      timeout: 30000,
      userAgent: 'EchoTune-Research-Bot/1.0',
      viewport: { width: 1920, height: 1080 },
      screenshotPath: './research-artifacts/screenshots',
      evidencePath: './research-artifacts/evidence',
      ...browserConfig
    };

    // Ensure directories exist
    this.ensureDirectories();
  }

  // Ensure artifact directories exist
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.screenshotPath, { recursive: true });
      await fs.mkdir(this.config.evidencePath, { recursive: true });
    } catch (error) {
      console.warn('Failed to create directories:', error);
    }
  }

  // Start new research session
  async startResearchSession(queries: ResearchQuery[]): Promise<string> {
    const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      queries,
      evidence: [],
      results: [],
      performance: {
        totalQueries: queries.length,
        successfulQueries: 0,
        averageLatency: 0,
        evidenceCollected: 0,
        reliabilityScore: 0
      },
      validation: {
        crossReferences: 0,
        conflictingEvidence: [],
        supportingEvidence: [],
        consensusScore: 0
      }
    };

    this.emit('session_started', { sessionId, queryCount: queries.length });
    
    // Process queries by priority
    const sortedQueries = queries.sort((a, b) => {
      const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    // Execute research with concurrency control
    await this.executeResearchQueries(sortedQueries);
    
    // Perform cross-validation
    await this.performCrossValidation();
    
    // Complete session
    this.currentSession.endTime = Date.now();
    await this.saveResearchSession();
    
    this.emit('session_completed', this.currentSession);
    return sessionId;
  }

  // Execute research queries with evidence collection
  private async executeResearchQueries(queries: ResearchQuery[]): Promise<void> {
    const concurrencyLimit = 3; // Limit concurrent requests
    const chunks = this.chunkArray(queries, concurrencyLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(query => this.processResearchQuery(query));
      await Promise.allSettled(promises);
    }
  }

  // Process individual research query
  private async processResearchQuery(query: ResearchQuery): Promise<void> {
    if (!this.currentSession) return;
    
    try {
      this.emit('query_started', { queryId: query.id, query: query.query });
      
      // Use Grok-4 for complex analysis, Perplexity for general research
      let result: TestResult;
      
      if (query.priority === 'critical' || query.context) {
        // Use Grok-4 for critical queries with validation
        const researchResult = await this.grok4Client.researchWithValidation(
          query.query,
          query.sources
        );
        result = researchResult.primary;
        
        // Add validation results to session
        this.currentSession.validation.consensusScore += researchResult.consensus.confidence;
        this.currentSession.validation.conflictingEvidence.push(...researchResult.consensus.conflictingPoints);
        this.currentSession.validation.supportingEvidence.push(...researchResult.consensus.supportingEvidence);
      } else {
        // Use standard Perplexity API
        result = await this.perplexityClient.chat({
          model: 'llama-3.1-sonar-huge-128k-online',
          messages: [
            {
              role: 'user',
              content: query.context ? `${query.context}\n\nQuery: ${query.query}` : query.query
            }
          ],
          max_tokens: 2000,
          return_citations: true,
          return_images: query.searchFilters?.includeImages || false,
          search_domain_filter: query.searchFilters?.domains,
          search_recency_filter: query.searchFilters?.recency
        });
      }
      
      if (result.success) {
        this.currentSession.performance.successfulQueries++;
        this.currentSession.results.push(result);
        
        // Collect evidence from result
        if (result.citations) {
          for (const citation of result.citations) {
            const evidence = await this.collectEvidence(citation, query);
            this.currentSession.evidence.push(evidence);
          }
        }
        
        // Capture response as evidence
        if (result.response) {
          const responseEvidence = await this.captureResponseEvidence(result.response, query);
          this.currentSession.evidence.push(responseEvidence);
        }
      }
      
      this.emit('query_completed', { 
        queryId: query.id, 
        success: result.success, 
        evidenceCount: result.citations?.length || 0 
      });
      
    } catch (error) {
      this.emit('query_failed', { 
        queryId: query.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  // Collect evidence from citation
  private async collectEvidence(citation: any, query: ResearchQuery): Promise<EvidenceItem> {
    const evidenceId = `evidence_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Parse URL for metadata
      const url = new URL(citation.url);
      const domain = url.hostname;
      
      // Determine content type based on URL and title
      const contentType = this.determineContentType(citation.url, citation.title);
      
      const evidence: EvidenceItem = {
        id: evidenceId,
        type: 'citation',
        source: 'perplexity',
        url: citation.url,
        title: citation.title,
        content: citation.snippet || '',
        reliability: citation.reliability || 0.5,
        timestamp: Date.now(),
        metadata: {
          domain,
          contentType,
          language: this.detectLanguage(citation.title + ' ' + citation.snippet),
          wordCount: (citation.snippet || '').split(' ').length
        }
      };
      
      // Save evidence to file
      await this.saveEvidence(evidence);
      
      return evidence;
      
    } catch (error) {
      // Return minimal evidence on error
      return {
        id: evidenceId,
        type: 'citation',
        source: 'perplexity',
        url: citation.url || '',
        title: citation.title || 'Unknown',
        content: citation.snippet || '',
        reliability: 0.1,
        timestamp: Date.now(),
        metadata: {
          domain: 'unknown',
          contentType: 'text/html'
        }
      };
    }
  }

  // Capture response as evidence
  private async captureResponseEvidence(response: any, query: ResearchQuery): Promise<EvidenceItem> {
    const evidenceId = `response_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const content = response.choices?.[0]?.message?.content || '';
    
    const evidence: EvidenceItem = {
      id: evidenceId,
      type: 'data',
      source: 'ai_response',
      url: '',
      title: `AI Response: ${query.query.substring(0, 50)}...`,
      content,
      reliability: 0.8, // AI responses are generally reliable but not primary sources
      timestamp: Date.now(),
      metadata: {
        domain: 'ai_generated',
        contentType: 'text/plain',
        language: this.detectLanguage(content),
        wordCount: content.split(' ').length
      }
    };
    
    await this.saveEvidence(evidence);
    return evidence;
  }

  // Perform cross-validation of evidence
  private async performCrossValidation(): Promise<void> {
    if (!this.currentSession) return;
    
    const evidenceByTopic = this.groupEvidenceByTopic();
    
    for (const [topic, evidenceList] of Object.entries(evidenceByTopic)) {
      if (evidenceList.length < 2) continue;
      
      // Cross-reference URLs and domains
      const urlSet = new Set(evidenceList.map(e => e.url));
      const domainSet = new Set(evidenceList.map(e => e.metadata.domain));
      
      this.currentSession.validation.crossReferences += urlSet.size;
      
      // Detect conflicting information (simplified)
      const contentSimilarity = this.analyzeContentSimilarity(evidenceList);
      if (contentSimilarity < 0.7) {
        this.currentSession.validation.conflictingEvidence.push(topic);
      } else {
        this.currentSession.validation.supportingEvidence.push(topic);
      }
    }
    
    // Calculate overall consensus score
    const totalTopics = Object.keys(evidenceByTopic).length;
    if (totalTopics > 0) {
      this.currentSession.validation.consensusScore = 
        this.currentSession.validation.supportingEvidence.length / totalTopics;
    }
  }

  // Group evidence by topic (simplified keyword matching)
  private groupEvidenceByTopic(): Record<string, EvidenceItem[]> {
    if (!this.currentSession) return {};
    
    const grouped: Record<string, EvidenceItem[]> = {};
    
    for (const evidence of this.currentSession.evidence) {
      // Extract keywords from title and content
      const keywords = this.extractKeywords(evidence.title + ' ' + evidence.content);
      const topicKey = keywords.slice(0, 3).join('_').toLowerCase();
      
      if (!grouped[topicKey]) {
        grouped[topicKey] = [];
      }
      grouped[topicKey].push(evidence);
    }
    
    return grouped;
  }

  // Analyze content similarity (simplified)
  private analyzeContentSimilarity(evidenceList: EvidenceItem[]): number {
    if (evidenceList.length < 2) return 1.0;
    
    // Simple word overlap analysis
    const allWords = evidenceList.flatMap(e => 
      (e.title + ' ' + e.content).toLowerCase().split(/\W+/).filter(w => w.length > 3)
    );
    
    const wordCounts = new Map<string, number>();
    for (const word of allWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Calculate similarity based on common words
    const commonWords = Array.from(wordCounts.entries())
      .filter(([_, count]) => count > 1)
      .length;
    
    const totalUniqueWords = wordCounts.size;
    return totalUniqueWords > 0 ? commonWords / totalUniqueWords : 0;
  }

  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
    
    // Return top keywords
    return Array.from(wordCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
      'this', 'that', 'these', 'those', 'a', 'an', 'as', 'from', 'up',
      'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
      'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
    ]);
    return stopWords.has(word);
  }

  // Determine content type from URL and title
  private determineContentType(url: string, title: string): string {
    const extension = path.extname(new URL(url).pathname).toLowerCase();
    
    if (['.pdf'].includes(extension)) return 'application/pdf';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) return 'image/*';
    if (['.mp4', '.avi', '.mov', '.wmv'].includes(extension)) return 'video/*';
    if (['.json'].includes(extension)) return 'application/json';
    if (['.xml'].includes(extension)) return 'application/xml';
    
    // Check title for content type hints
    if (title.toLowerCase().includes('github')) return 'text/code';
    if (title.toLowerCase().includes('stack overflow')) return 'text/code';
    if (title.toLowerCase().includes('documentation')) return 'text/documentation';
    
    return 'text/html';
  }

  // Simple language detection
  private detectLanguage(text: string): string {
    // Very basic language detection
    const englishWords = ['the', 'and', 'or', 'is', 'in', 'to', 'of', 'a', 'for'];
    const wordCount = text.toLowerCase().split(/\W+/).length;
    const englishCount = englishWords.reduce((count, word) => 
      count + (text.toLowerCase().includes(word) ? 1 : 0), 0
    );
    
    return (englishCount / englishWords.length) > 0.3 ? 'en' : 'unknown';
  }

  // Save evidence to file
  private async saveEvidence(evidence: EvidenceItem): Promise<void> {
    try {
      const filename = `${evidence.id}.json`;
      const filepath = path.join(this.config.evidencePath, filename);
      await fs.writeFile(filepath, JSON.stringify(evidence, null, 2));
    } catch (error) {
      console.warn('Failed to save evidence:', error);
    }
  }

  // Save research session
  private async saveResearchSession(): Promise<void> {
    if (!this.currentSession) return;
    
    try {
      const filename = `session_${this.currentSession.sessionId}.json`;
      const filepath = path.join(this.config.evidencePath, filename);
      await fs.writeFile(filepath, JSON.stringify(this.currentSession, null, 2));
    } catch (error) {
      console.warn('Failed to save research session:', error);
    }
  }

  // Chunk array for concurrency control
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Get current session performance
  getSessionPerformance(): any {
    if (!this.currentSession) return null;
    
    // Calculate performance metrics
    const totalLatency = this.currentSession.results.reduce((sum, r) => sum + r.duration, 0);
    const avgLatency = this.currentSession.results.length > 0 ? 
      totalLatency / this.currentSession.results.length : 0;
    
    const totalReliability = this.currentSession.evidence.reduce((sum, e) => sum + e.reliability, 0);
    const avgReliability = this.currentSession.evidence.length > 0 ? 
      totalReliability / this.currentSession.evidence.length : 0;
    
    return {
      ...this.currentSession.performance,
      averageLatency: avgLatency,
      evidenceCollected: this.currentSession.evidence.length,
      reliabilityScore: avgReliability,
      consensusScore: this.currentSession.validation.consensusScore
    };
  }

  // Generate research report
  async generateResearchReport(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active research session');
    }
    
    const performance = this.getSessionPerformance();
    const duration = this.currentSession.endTime ? 
      this.currentSession.endTime - this.currentSession.startTime : 
      Date.now() - this.currentSession.startTime;
    
    const report = {
      sessionId: this.currentSession.sessionId,
      summary: {
        duration: `${Math.round(duration / 1000)}s`,
        totalQueries: this.currentSession.queries.length,
        successfulQueries: performance.successfulQueries,
        evidenceCollected: performance.evidenceCollected,
        averageReliability: Math.round(performance.reliabilityScore * 100) / 100,
        consensusScore: Math.round(performance.consensusScore * 100) / 100
      },
      queries: this.currentSession.queries.map(q => ({
        id: q.id,
        query: q.query,
        priority: q.priority,
        evidenceCount: this.currentSession.evidence.filter(e => 
          e.content.toLowerCase().includes(q.query.toLowerCase().split(' ')[0])
        ).length
      })),
      validation: {
        crossReferences: this.currentSession.validation.crossReferences,
        supportingTopics: this.currentSession.validation.supportingEvidence.length,
        conflictingTopics: this.currentSession.validation.conflictingEvidence.length,
        consensusScore: this.currentSession.validation.consensusScore
      },
      topSources: this.getTopSources(),
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(this.config.evidencePath, `report_${this.currentSession.sessionId}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }

  // Get top sources by reliability
  private getTopSources(): Array<{domain: string, count: number, avgReliability: number}> {
    if (!this.currentSession) return [];
    
    const sourceStats = new Map<string, {count: number, totalReliability: number}>();
    
    for (const evidence of this.currentSession.evidence) {
      const domain = evidence.metadata.domain;
      const stats = sourceStats.get(domain) || {count: 0, totalReliability: 0};
      stats.count++;
      stats.totalReliability += evidence.reliability;
      sourceStats.set(domain, stats);
    }
    
    return Array.from(sourceStats.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.count,
        avgReliability: stats.totalReliability / stats.count
      }))
      .sort((a, b) => b.avgReliability - a.avgReliability)
      .slice(0, 10);
  }

  // Generate recommendations for improvement
  private generateRecommendations(): string[] {
    if (!this.currentSession) return [];
    
    const recommendations: string[] = [];
    const performance = this.getSessionPerformance();
    
    if (performance.successfulQueries / this.currentSession.queries.length < 0.8) {
      recommendations.push('Consider refining query formulation to improve success rate');
    }
    
    if (performance.reliabilityScore < 0.6) {
      recommendations.push('Focus on higher-quality sources to improve evidence reliability');
    }
    
    if (performance.consensusScore < 0.7) {
      recommendations.push('Increase source diversity to improve consensus validation');
    }
    
    if (this.currentSession.evidence.length < this.currentSession.queries.length * 2) {
      recommendations.push('Expand search criteria to collect more evidence per query');
    }
    
    return recommendations;
  }
}

// Export types
export type {
  ResearchQuery,
  EvidenceItem,
  ResearchSession,
  BrowserConfig
};