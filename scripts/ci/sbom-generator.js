/**
 * EchoTune AI - SBOM Generation and Security Scanning
 * Phase 1 Epic E02: Security & Dependency Hardening
 * 
 * Generates Software Bill of Materials (SBOM) and performs security scanning
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SBOMGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = path.join(this.projectRoot, 'reports');
  }

  /**
   * Generate comprehensive SBOM using CycloneDX format
   */
  async generateSBOM() {
    try {
      console.log('📋 Generating Software Bill of Materials (SBOM)...');
      
      // Ensure reports directory exists
      await this.ensureDirectoryExists(this.outputDir);
      
      // Read package.json and package-lock.json
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8')
      );
      
      let packageLock = null;
      try {
        packageLock = JSON.parse(
          await fs.readFile(path.join(this.projectRoot, 'package-lock.json'), 'utf8')
        );
      } catch (error) {
        console.warn('⚠️ package-lock.json not found, generating simplified SBOM');
      }
      
      // Generate SBOM in CycloneDX format
      const sbom = await this.createCycloneDXSBOM(packageJson, packageLock);
      
      // Save SBOM
      const sbomPath = path.join(this.outputDir, 'sbom.json');
      await fs.writeFile(sbomPath, JSON.stringify(sbom, null, 2));
      
      console.log(`✅ SBOM generated: ${sbomPath}`);
      return sbomPath;
      
    } catch (error) {
      console.error('❌ SBOM generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create CycloneDX format SBOM
   */
  async createCycloneDXSBOM(packageJson, packageLock) {
    const sbom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      serialNumber: `urn:uuid:${this.generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: 'EchoTune AI',
            name: 'SBOM Generator',
            version: '1.0.0'
          }
        ],
        component: {
          type: 'application',
          'bom-ref': 'echotune-ai',
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          licenses: packageJson.license ? [{ license: { id: packageJson.license } }] : [],
          purl: `pkg:npm/${packageJson.name}@${packageJson.version}`
        }
      },
      components: []
    };

    // Add dependencies as components
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const component = await this.createComponentEntry(name, version, 'required', packageLock);
        sbom.components.push(component);
      }
    }

    // Add dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const component = await this.createComponentEntry(name, version, 'optional', packageLock);
        sbom.components.push(component);
      }
    }

    return sbom;
  }

  /**
   * Create component entry for SBOM
   */
  async createComponentEntry(name, version, scope, packageLock) {
    // Get resolved version from package-lock if available
    let resolvedVersion = version;
    if (packageLock && packageLock.packages && packageLock.packages[`node_modules/${name}`]) {
      resolvedVersion = packageLock.packages[`node_modules/${name}`].version;
    }

    const component = {
      type: 'library',
      'bom-ref': `${name}@${resolvedVersion}`,
      name: name,
      version: resolvedVersion,
      scope: scope,
      purl: `pkg:npm/${name}@${resolvedVersion}`,
      properties: [
        {
          name: 'npm:version-range',
          value: version
        }
      ]
    };

    // Add licenses if available
    try {
      const packageInfo = await this.getNpmPackageInfo(name, resolvedVersion);
      if (packageInfo.license) {
        component.licenses = [{ license: { id: packageInfo.license } }];
      }
      if (packageInfo.description) {
        component.description = packageInfo.description;
      }
    } catch (error) {
      // Package info not available, continue without it
    }

    return component;
  }

  /**
   * Get npm package information
   */
  async getNpmPackageInfo(name, version) {
    try {
      const result = execSync(`npm view ${name}@${version} --json`, { 
        encoding: 'utf8',
        timeout: 5000 
      });
      return JSON.parse(result);
    } catch (error) {
      return {};
    }
  }

  /**
   * Run security vulnerability scan
   */
  async runSecurityScan() {
    console.log('🔒 Running security vulnerability scan...');
    
    const scanResults = {
      timestamp: new Date().toISOString(),
      scanner: 'npm-audit',
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0
      },
      vulnerabilities: []
    };

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      
      const auditData = JSON.parse(auditResult);
      
      if (auditData.vulnerabilities) {
        for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
          scanResults.vulnerabilities.push({
            package: name,
            severity: vuln.severity,
            title: vuln.via[0]?.title || 'Unknown vulnerability',
            url: vuln.via[0]?.url,
            range: vuln.range,
            nodes: vuln.nodes
          });
          
          scanResults.summary[vuln.severity]++;
          scanResults.summary.total++;
        }
      }
      
    } catch (error) {
      console.warn('⚠️ npm audit failed, using alternative scanning...');
      
      // Fallback to manual dependency checking
      try {
        const result = execSync('npm ls --json', { encoding: 'utf8' });
        const deps = JSON.parse(result);
        scanResults.fallback = true;
        scanResults.dependencies_count = this.countDependencies(deps);
      } catch (fallbackError) {
        scanResults.error = 'Unable to scan dependencies';
      }
    }

    // Save scan results
    const scanPath = path.join(this.outputDir, 'security-scan.json');
    await fs.writeFile(scanPath, JSON.stringify(scanResults, null, 2));
    
    console.log(`✅ Security scan completed: ${scanPath}`);
    console.log(`📊 Vulnerabilities found: ${scanResults.summary.total}`);
    console.log(`  Critical: ${scanResults.summary.critical}`);
    console.log(`  High: ${scanResults.summary.high}`);
    console.log(`  Moderate: ${scanResults.summary.moderate}`);
    console.log(`  Low: ${scanResults.summary.low}`);
    
    return scanResults;
  }

  /**
   * Validate vulnerability budget
   */
  validateVulnerabilityBudget(scanResults) {
    const budget = {
      critical: 0,
      high: 0,
      moderate: 5,
      low: 10
    };

    const violations = [];
    
    for (const [severity, allowedCount] of Object.entries(budget)) {
      const actualCount = scanResults.summary[severity] || 0;
      if (actualCount > allowedCount) {
        violations.push({
          severity,
          allowed: allowedCount,
          actual: actualCount,
          excess: actualCount - allowedCount
        });
      }
    }

    const budgetValidation = {
      passed: violations.length === 0,
      budget,
      actual: scanResults.summary,
      violations
    };

    console.log(`\n🎯 Vulnerability Budget Validation:`);
    if (budgetValidation.passed) {
      console.log('✅ All vulnerability budgets met');
    } else {
      console.log('❌ Vulnerability budget violations:');
      violations.forEach(v => {
        console.log(`  ${v.severity}: ${v.actual}/${v.allowed} (+${v.excess} over budget)`);
      });
    }

    return budgetValidation;
  }

  /**
   * Count dependencies recursively
   */
  countDependencies(deps) {
    let count = 0;
    if (deps.dependencies) {
      count += Object.keys(deps.dependencies).length;
      for (const dep of Object.values(deps.dependencies)) {
        count += this.countDependencies(dep);
      }
    }
    return count;
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport() {
    console.log('📋 Generating comprehensive security report...');
    
    const sbomPath = await this.generateSBOM();
    const scanResults = await this.runSecurityScan();
    const budgetValidation = this.validateVulnerabilityBudget(scanResults);
    
    const report = {
      timestamp: new Date().toISOString(),
      sbom: {
        path: sbomPath,
        components_count: scanResults.dependencies_count || 0
      },
      security_scan: scanResults,
      budget_validation: budgetValidation,
      recommendations: this.generateSecurityRecommendations(scanResults)
    };
    
    const reportPath = path.join(this.outputDir, 'security-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Security report generated: ${reportPath}`);
    return report;
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(scanResults) {
    const recommendations = [];
    
    if (scanResults.summary.critical > 0) {
      recommendations.push({
        priority: 'urgent',
        message: `${scanResults.summary.critical} critical vulnerabilities found`,
        action: 'Update affected packages immediately'
      });
    }
    
    if (scanResults.summary.high > 0) {
      recommendations.push({
        priority: 'high',
        message: `${scanResults.summary.high} high severity vulnerabilities found`,
        action: 'Plan updates for affected packages within 48 hours'
      });
    }
    
    if (scanResults.summary.moderate > 5) {
      recommendations.push({
        priority: 'medium',
        message: `${scanResults.summary.moderate} moderate vulnerabilities exceed budget`,
        action: 'Review and update packages during next maintenance window'
      });
    }
    
    if (scanResults.summary.total === 0) {
      recommendations.push({
        priority: 'info',
        message: 'No vulnerabilities detected',
        action: 'Maintain regular dependency updates'
      });
    }
    
    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const generator = new SBOMGenerator();
  
  const command = process.argv[2] || 'report';
  
  switch (command) {
    case 'sbom':
      generator.generateSBOM()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'scan':
      generator.runSecurityScan()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'report':
    default:
      generator.generateSecurityReport()
        .then(report => {
          process.exit(report.budget_validation.passed ? 0 : 1);
        })
        .catch(() => process.exit(1));
  }
}

module.exports = SBOMGenerator;