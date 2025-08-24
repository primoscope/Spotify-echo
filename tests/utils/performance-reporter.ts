/**
 * Performance monitoring and bottleneck detection for E2E tests
 */

export interface PerformanceMetrics {
  timestamp: string;
  testName: string;
  stepName: string;
  metrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    requestCount: number;
    responseTime: number;
    errorCount: number;
    memoryUsage?: number;
  };
  thresholds: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  passed: boolean;
  bottlenecks: string[];
}

export class PerformanceReporter {
  private metrics: PerformanceMetrics[] = [];
  private thresholds = {
    loadTime: 3000, // 3 seconds
    firstContentfulPaint: 1500, // 1.5 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1 // 0.1 CLS score
  };

  /**
   * Monitor performance for a test step
   */
  public async monitorStep(
    page: any,
    testName: string,
    stepName: string
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    // Collect Web Vitals and other metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: any = {
            loadTime: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            requestCount: 0,
            responseTime: 0,
            errorCount: 0
          };

          entries.forEach((entry) => {
            switch (entry.entryType) {
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  metrics.firstContentfulPaint = entry.startTime;
                }
                break;
              case 'largest-contentful-paint':
                metrics.largestContentfulPaint = entry.startTime;
                break;
              case 'first-input':
                metrics.firstInputDelay = entry.processingStart - entry.startTime;
                break;
              case 'layout-shift':
                if (!entry.hadRecentInput) {
                  metrics.cumulativeLayoutShift += entry.value;
                }
                break;
              case 'navigation':
                metrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
                break;
            }
          });

          // Count network requests
          const resources = performance.getEntriesByType('resource');
          metrics.requestCount = resources.length;
          
          // Calculate average response time
          if (resources.length > 0) {
            metrics.responseTime = resources.reduce((sum: number, entry: any) => {
              return sum + (entry.responseEnd - entry.requestStart);
            }, 0) / resources.length;
          }

          // Count errors from test metrics if available
          if (window.testMetrics?.errors) {
            metrics.errorCount = window.testMetrics.errors.length;
          }

          resolve(metrics);
        });

        // Observe all performance entry types
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve({
            loadTime: Date.now() - window.performance.timeOrigin,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            requestCount: performance.getEntriesByType('resource').length,
            responseTime: 0,
            errorCount: window.testMetrics?.errors?.length || 0
          });
        }, 5000);
      });
    });

    // Add memory usage if available
    try {
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (memoryInfo) {
        metrics.memoryUsage = memoryInfo.usedJSHeapSize;
      }
    } catch (error) {
      console.warn('⚠️ Memory info not available');
    }

    // Check if metrics pass thresholds
    const passed = this.checkThresholds(metrics);
    
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(metrics);

    const performanceMetrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      testName,
      stepName,
      metrics,
      thresholds: this.thresholds,
      passed,
      bottlenecks
    };

    this.metrics.push(performanceMetrics);
    
    // Log performance summary
    this.logPerformanceSummary(performanceMetrics);

    return performanceMetrics;
  }

  /**
   * Check if metrics pass defined thresholds
   */
  private checkThresholds(metrics: any): boolean {
    return (
      metrics.loadTime <= this.thresholds.loadTime &&
      metrics.firstContentfulPaint <= this.thresholds.firstContentfulPaint &&
      metrics.largestContentfulPaint <= this.thresholds.largestContentfulPaint &&
      metrics.firstInputDelay <= this.thresholds.firstInputDelay &&
      metrics.cumulativeLayoutShift <= this.thresholds.cumulativeLayoutShift
    );
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(metrics: any): string[] {
    const bottlenecks: string[] = [];

    if (metrics.loadTime > this.thresholds.loadTime) {
      bottlenecks.push(`Slow page load: ${metrics.loadTime}ms (threshold: ${this.thresholds.loadTime}ms)`);
    }

    if (metrics.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
      bottlenecks.push(`Slow FCP: ${metrics.firstContentfulPaint}ms (threshold: ${this.thresholds.firstContentfulPaint}ms)`);
    }

    if (metrics.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
      bottlenecks.push(`Slow LCP: ${metrics.largestContentfulPaint}ms (threshold: ${this.thresholds.largestContentfulPaint}ms)`);
    }

    if (metrics.firstInputDelay > this.thresholds.firstInputDelay) {
      bottlenecks.push(`High FID: ${metrics.firstInputDelay}ms (threshold: ${this.thresholds.firstInputDelay}ms)`);
    }

    if (metrics.cumulativeLayoutShift > this.thresholds.cumulativeLayoutShift) {
      bottlenecks.push(`High CLS: ${metrics.cumulativeLayoutShift} (threshold: ${this.thresholds.cumulativeLayoutShift})`);
    }

    if (metrics.requestCount > 50) {
      bottlenecks.push(`High request count: ${metrics.requestCount} requests`);
    }

    if (metrics.responseTime > 1000) {
      bottlenecks.push(`Slow average response time: ${Math.round(metrics.responseTime)}ms`);
    }

    if (metrics.errorCount > 0) {
      bottlenecks.push(`Network errors detected: ${metrics.errorCount} errors`);
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      bottlenecks.push(`High memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
    }

    return bottlenecks;
  }

  /**
   * Log performance summary to console
   */
  private logPerformanceSummary(metrics: PerformanceMetrics): void {
    const status = metrics.passed ? '✅' : '⚠️';
    console.log(`${status} Performance - ${metrics.stepName}:`);
    console.log(`  Load Time: ${Math.round(metrics.metrics.loadTime)}ms`);
    console.log(`  FCP: ${Math.round(metrics.metrics.firstContentfulPaint)}ms`);
    console.log(`  LCP: ${Math.round(metrics.metrics.largestContentfulPaint)}ms`);
    console.log(`  Requests: ${metrics.metrics.requestCount}`);
    
    if (metrics.bottlenecks.length > 0) {
      console.log(`  Bottlenecks:`);
      metrics.bottlenecks.forEach(bottleneck => {
        console.log(`    - ${bottleneck}`);
      });
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(): any {
    const summary = {
      totalSteps: this.metrics.length,
      passedSteps: this.metrics.filter(m => m.passed).length,
      failedSteps: this.metrics.filter(m => !m.passed).length,
      averageLoadTime: this.calculateAverage('loadTime'),
      averageFCP: this.calculateAverage('firstContentfulPaint'),
      averageLCP: this.calculateAverage('largestContentfulPaint'),
      totalBottlenecks: this.metrics.reduce((sum, m) => sum + m.bottlenecks.length, 0),
      commonBottlenecks: this.getCommonBottlenecks()
    };

    return {
      summary,
      details: this.metrics,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate average for a metric
   */
  private calculateAverage(metricName: string): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((total, metric) => {
      return total + (metric.metrics as any)[metricName];
    }, 0);
    
    return Math.round(sum / this.metrics.length);
  }

  /**
   * Get most common bottlenecks
   */
  private getCommonBottlenecks(): Array<{ bottleneck: string; count: number }> {
    const bottleneckCounts: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      metric.bottlenecks.forEach(bottleneck => {
        const key = bottleneck.split(':')[0]; // Get the type of bottleneck
        bottleneckCounts[key] = (bottleneckCounts[key] || 0) + 1;
      });
    });

    return Object.entries(bottleneckCounts)
      .map(([bottleneck, count]) => ({ bottleneck, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Set custom thresholds
   */
  public setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get all metrics
   */
  public getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
}

export default PerformanceReporter;