/**
 * Screenshot management utility for E2E testing
 * Provides standardized screenshot naming and metadata tracking
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotMetadata {
  testName: string;
  stepNumber: number;
  stepName: string;
  timestamp: string;
  status: 'success' | 'failure';
  url?: string;
  viewport?: { width: number; height: number };
  performance?: {
    loadTime: number;
    requestCount: number;
    errorCount: number;
  };
}

export class ScreenshotManager {
  private baseDir: string;
  private testMetadata: Map<string, ScreenshotMetadata[]>;

  constructor(baseDir: string = 'artifacts/screenshots') {
    this.baseDir = baseDir;
    this.testMetadata = new Map();
  }

  /**
   * Generate standardized screenshot filename
   * Format: {specName}/{twoDigitStep}-{shortSlug}-{status}.png
   */
  public generateFilename(
    specName: string,
    stepNumber: number,
    stepName: string,
    status: 'success' | 'failure'
  ): string {
    const twoDigitStep = stepNumber.toString().padStart(2, '0');
    const shortSlug = this.createSlug(stepName);
    return `${specName}/${twoDigitStep}-${shortSlug}-${status}.png`;
  }

  /**
   * Create URL-safe slug from step name
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  /**
   * Take screenshot with metadata tracking
   */
  public async takeScreenshot(
    page: any,
    testInfo: any,
    stepNumber: number,
    stepName: string,
    status: 'success' | 'failure'
  ): Promise<string> {
    const specName = this.getSpecName(testInfo);
    const filename = this.generateFilename(specName, stepNumber, stepName, status);
    const fullPath = path.join(this.baseDir, filename);

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

    // Mask sensitive data before screenshot
    await this.maskSensitiveData(page);

    // Take screenshot
    await page.screenshot({
      path: fullPath,
      fullPage: true
    });

    // Collect metadata
    const metadata: ScreenshotMetadata = {
      testName: testInfo.title,
      stepNumber,
      stepName,
      timestamp: new Date().toISOString(),
      status,
      url: await page.url().catch(() => 'unknown'),
      viewport: await page.viewportSize().catch(() => undefined),
      performance: await this.collectPerformanceData(page)
    };

    // Store metadata
    const testKey = `${specName}-${testInfo.title}`;
    if (!this.testMetadata.has(testKey)) {
      this.testMetadata.set(testKey, []);
    }
    this.testMetadata.get(testKey)!.push(metadata);

    console.log(`📸 Screenshot saved: ${filename}`);
    return fullPath;
  }

  /**
   * Mask sensitive data in the page before screenshot
   */
  private async maskSensitiveData(page: any): Promise<void> {
    try {
      await page.addStyleTag({
        content: `
          /* Mask sensitive data */
          [data-testid*="token"],
          [data-testid*="key"],
          [data-testid*="secret"],
          .sensitive-data,
          .auth-token,
          .api-key {
            background: #000 !important;
            color: #000 !important;
            text-shadow: none !important;
          }
          
          /* Mask form inputs that might contain sensitive data */
          input[type="password"],
          input[name*="token"],
          input[name*="key"],
          input[name*="secret"] {
            background: #000 !important;
            color: #000 !important;
            -webkit-text-security: disc !important;
          }
        `
      });
    } catch (error) {
      console.warn('⚠️ Failed to mask sensitive data:', error.message);
    }
  }

  /**
   * Collect performance data from the page
   */
  private async collectPerformanceData(page: any): Promise<any> {
    try {
      return await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        const resources = performance.getEntriesByType('resource');
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          requestCount: resources.length,
          errorCount: window.testMetrics?.errors?.length || 0
        };
      });
    } catch (error) {
      console.warn('⚠️ Failed to collect performance data:', error.message);
      return {
        loadTime: 0,
        requestCount: 0,
        errorCount: 0
      };
    }
  }

  /**
   * Get spec name from test info
   */
  private getSpecName(testInfo: any): string {
    return testInfo.file
      .split('/')
      .pop()
      ?.replace('.spec.ts', '')
      ?.replace('.test.ts', '') || 'unknown';
  }

  /**
   * Generate comprehensive test report
   */
  public async generateReport(): Promise<void> {
    const reportPath = path.join(this.baseDir, 'test-report.json');
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTests: this.testMetadata.size,
        totalScreenshots: Array.from(this.testMetadata.values()).reduce((acc, arr) => acc + arr.length, 0),
        successfulSteps: this.countByStatus('success'),
        failedSteps: this.countByStatus('failure')
      },
      tests: Object.fromEntries(this.testMetadata)
    };

    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Screenshot report generated: ${reportPath}`);
  }

  /**
   * Count screenshots by status
   */
  private countByStatus(status: 'success' | 'failure'): number {
    return Array.from(this.testMetadata.values())
      .flat()
      .filter(metadata => metadata.status === status)
      .length;
  }

  /**
   * Clean up old screenshots (keep last N test runs)
   */
  public async cleanup(keepRuns: number = 5): Promise<void> {
    try {
      const entries = await fs.promises.readdir(this.baseDir, { withFileTypes: true });
      const directories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
          name: entry.name,
          path: path.join(this.baseDir, entry.name),
          stat: fs.statSync(path.join(this.baseDir, entry.name))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Keep only the most recent directories
      const toDelete = directories.slice(keepRuns);
      
      for (const dir of toDelete) {
        await fs.promises.rm(dir.path, { recursive: true, force: true });
        console.log(`🗑️ Cleaned up old screenshots: ${dir.name}`);
      }

      if (toDelete.length > 0) {
        console.log(`✅ Cleanup completed: removed ${toDelete.length} old test runs`);
      }
    } catch (error) {
      console.warn('⚠️ Screenshot cleanup failed:', error.message);
    }
  }

  /**
   * Get metadata for a specific test
   */
  public getTestMetadata(specName: string, testTitle: string): ScreenshotMetadata[] {
    const testKey = `${specName}-${testTitle}`;
    return this.testMetadata.get(testKey) || [];
  }

  /**
   * Clear all metadata
   */
  public clearMetadata(): void {
    this.testMetadata.clear();
  }
}

export default ScreenshotManager;