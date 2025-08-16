/**
 * Automated Configuration Detection and Setup System
 * Repository analysis, MCP server implementation, and best practice templates
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Configuration interfaces
interface RepositoryStructure {
  rootPath: string;
  packageJson?: any;
  cursorRules?: string;
  cursorRulesDir?: string[];
  mcpConfig?: any;
  envFiles: string[];
  scripts: string[];
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  projectType: string;
  frameworks: string[];
  languages: string[];
  testingFrameworks: string[];
}

interface CursorConfiguration {
  rules: {
    general: string[];
    languageSpecific: Record<string, string[]>;
    frameworkSpecific: Record<string, string[]>;
    testing: string[];
    performance: string[];
    security: string[];
  };
  mcpServers: MCPServerConfig[];
  contextManagement: {
    includePatterns: string[];
    excludePatterns: string[];
    maxFiles: number;
    smartInclusion: boolean;
  };
  environmentVariables: EnvironmentVariable[];
}

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  description: string;
  category: 'core' | 'ai' | 'development' | 'testing' | 'automation';
  required: boolean;
  autoStart: boolean;
}

interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  category: 'api' | 'database' | 'security' | 'deployment' | 'development';
  sensitive: boolean;
}

interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  projectTypes: string[];
  frameworks: string[];
  files: {
    path: string;
    content: string;
    overwrite: boolean;
  }[];
  mcpServers: MCPServerConfig[];
  environmentVariables: EnvironmentVariable[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
}

// Main configuration detection and setup class
export class AutomatedConfigDetector extends EventEmitter {
  private rootPath: string;
  private repositoryStructure?: RepositoryStructure;
  private detectedConfiguration?: CursorConfiguration;
  private availableTemplates: ConfigurationTemplate[] = [];

  constructor(rootPath: string = process.cwd()) {
    super();
    this.rootPath = rootPath;
    this.loadDefaultTemplates();
  }

  // Analyze repository structure and detect configuration needs
  async analyzeRepository(): Promise<RepositoryStructure> {
    this.emit('analysis_started', { path: this.rootPath });
    
    const structure: RepositoryStructure = {
      rootPath: this.rootPath,
      envFiles: [],
      scripts: [],
      dependencies: {
        production: {},
        development: {}
      },
      projectType: 'unknown',
      frameworks: [],
      languages: [],
      testingFrameworks: []
    };

    try {
      // Analyze package.json
      const packageJsonPath = path.join(this.rootPath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        structure.packageJson = packageJson;
        structure.dependencies.production = packageJson.dependencies || {};
        structure.dependencies.development = packageJson.devDependencies || {};
        
        // Extract scripts
        structure.scripts = Object.keys(packageJson.scripts || {});
      }

      // Detect project type and frameworks
      structure.projectType = await this.detectProjectType(structure);
      structure.frameworks = await this.detectFrameworks(structure);
      structure.languages = await this.detectLanguages();
      structure.testingFrameworks = await this.detectTestingFrameworks(structure);

      // Check for existing Cursor configuration
      const cursorRulesPath = path.join(this.rootPath, '.cursorrules');
      if (await this.fileExists(cursorRulesPath)) {
        structure.cursorRules = await fs.readFile(cursorRulesPath, 'utf-8');
      }

      // Check for .cursor/rules directory
      const cursorRulesDir = path.join(this.rootPath, '.cursor', 'rules');
      if (await this.directoryExists(cursorRulesDir)) {
        const ruleFiles = await fs.readdir(cursorRulesDir);
        structure.cursorRulesDir = ruleFiles.filter(f => f.endsWith('.md') || f.endsWith('.mdc'));
      }

      // Check for MCP configuration
      const mcpConfigPath = path.join(this.rootPath, '.cursor', 'mcp.json');
      if (await this.fileExists(mcpConfigPath)) {
        structure.mcpConfig = JSON.parse(await fs.readFile(mcpConfigPath, 'utf-8'));
      }

      // Find environment files
      const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];
      for (const envFile of envFiles) {
        if (await this.fileExists(path.join(this.rootPath, envFile))) {
          structure.envFiles.push(envFile);
        }
      }

      this.repositoryStructure = structure;
      this.emit('analysis_completed', structure);
      
      return structure;
    } catch (error) {
      this.emit('analysis_failed', error);
      throw error;
    }
  }

  // Generate optimal Cursor configuration based on analysis
  async generateConfiguration(): Promise<CursorConfiguration> {
    if (!this.repositoryStructure) {
      await this.analyzeRepository();
    }

    const structure = this.repositoryStructure!;
    this.emit('configuration_generation_started', structure.projectType);

    const config: CursorConfiguration = {
      rules: {
        general: this.getGeneralRules(),
        languageSpecific: this.getLanguageSpecificRules(structure.languages),
        frameworkSpecific: this.getFrameworkSpecificRules(structure.frameworks),
        testing: this.getTestingRules(structure.testingFrameworks),
        performance: this.getPerformanceRules(structure.projectType),
        security: this.getSecurityRules(structure.projectType)
      },
      mcpServers: this.generateMCPServers(structure),
      contextManagement: this.generateContextManagement(structure),
      environmentVariables: this.generateEnvironmentVariables(structure)
    };

    this.detectedConfiguration = config;
    this.emit('configuration_generated', config);
    
    return config;
  }

  // Apply configuration to repository
  async applyConfiguration(
    config?: CursorConfiguration,
    options: {
      createBackups: boolean;
      overwriteExisting: boolean;
      dryRun: boolean;
    } = {
      createBackups: true,
      overwriteExisting: false,
      dryRun: false
    }
  ): Promise<void> {
    const configuration = config || this.detectedConfiguration;
    if (!configuration) {
      throw new Error('No configuration available. Run generateConfiguration() first.');
    }

    this.emit('configuration_application_started', { dryRun: options.dryRun });

    try {
      // Create backup if requested
      if (options.createBackups && !options.dryRun) {
        await this.createConfigurationBackup();
      }

      // Apply .cursorrules
      await this.applyCursorRules(configuration, options);

      // Apply MCP configuration
      await this.applyMCPConfiguration(configuration, options);

      // Apply context management configuration
      await this.applyContextConfiguration(configuration, options);

      // Generate environment variable template
      await this.generateEnvironmentTemplate(configuration, options);

      // Apply recommended scripts
      await this.applyRecommendedScripts(configuration, options);

      this.emit('configuration_applied', { success: true, dryRun: options.dryRun });
    } catch (error) {
      this.emit('configuration_application_failed', error);
      throw error;
    }
  }

  // Detect project type based on structure analysis
  private async detectProjectType(structure: RepositoryStructure): Promise<string> {
    const deps = { ...structure.dependencies.production, ...structure.dependencies.development };
    
    if (deps.react && deps.next) return 'next';
    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps['@angular/core']) return 'angular';
    if (structure.packageJson) return 'node';
    
    // Check for Python files
    try {
      const files = await fs.readdir(this.rootPath);
      if (files.some(f => f.endsWith('.py')) || files.includes('requirements.txt')) {
        return 'python';
      }
    } catch (error) {
      // Ignore error
    }
    
    return 'unknown';
  }

  // Detect frameworks in use
  private async detectFrameworks(structure: RepositoryStructure): Promise<string[]> {
    const frameworks: string[] = [];
    const deps = { ...structure.dependencies.production, ...structure.dependencies.development };
    
    const frameworkMap: Record<string, string> = {
      'express': 'Express.js',
      'fastify': 'Fastify',
      'koa': 'Koa.js',
      'mongoose': 'MongoDB/Mongoose',
      'sequelize': 'Sequelize ORM',
      'typeorm': 'TypeORM',
      'prisma': 'Prisma',
      'socket.io': 'Socket.io',
      'redis': 'Redis',
      'axios': 'Axios HTTP',
      'lodash': 'Lodash',
      'moment': 'Moment.js',
      'dayjs': 'Day.js',
      'material-ui': 'Material-UI',
      '@mui/material': 'Material-UI v5',
      'bootstrap': 'Bootstrap',
      'tailwindcss': 'Tailwind CSS',
      'styled-components': 'Styled Components',
      'emotion': 'Emotion CSS'
    };
    
    for (const [dep, framework] of Object.entries(frameworkMap)) {
      if (deps[dep]) {
        frameworks.push(framework);
      }
    }
    
    return frameworks;
  }

  // Detect languages used in the project
  private async detectLanguages(): Promise<string[]> {
    const languages: string[] = [];
    
    try {
      const files = await this.getFilesByExtension(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs']);
      
      if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
        languages.push('TypeScript');
      }
      if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
        languages.push('JavaScript');
      }
      if (files.some(f => f.endsWith('.py'))) {
        languages.push('Python');
      }
      if (files.some(f => f.endsWith('.java'))) {
        languages.push('Java');
      }
      if (files.some(f => f.endsWith('.go'))) {
        languages.push('Go');
      }
      if (files.some(f => f.endsWith('.rs'))) {
        languages.push('Rust');
      }
    } catch (error) {
      // Fallback to JavaScript if detection fails
      languages.push('JavaScript');
    }
    
    return languages;
  }

  // Detect testing frameworks
  private async detectTestingFrameworks(structure: RepositoryStructure): Promise<string[]> {
    const frameworks: string[] = [];
    const deps = { ...structure.dependencies.production, ...structure.dependencies.development };
    
    const testingMap: Record<string, string> = {
      'jest': 'Jest',
      'mocha': 'Mocha',
      'chai': 'Chai',
      'jasmine': 'Jasmine',
      'cypress': 'Cypress',
      'playwright': 'Playwright',
      'puppeteer': 'Puppeteer',
      'supertest': 'Supertest',
      'testing-library': 'Testing Library',
      '@testing-library/react': 'React Testing Library',
      'vitest': 'Vitest'
    };
    
    for (const [dep, framework] of Object.entries(testingMap)) {
      if (deps[dep] || Object.keys(deps).some(d => d.includes(dep))) {
        frameworks.push(framework);
      }
    }
    
    return frameworks;
  }

  // Generate general rules for any project
  private getGeneralRules(): string[] {
    return [
      'Always write clean, readable, and maintainable code',
      'Follow established coding conventions and style guides',
      'Include comprehensive error handling and logging',
      'Write meaningful commit messages following conventional commits',
      'Add appropriate comments for complex logic',
      'Ensure code is well-documented with JSDoc or equivalent',
      'Implement proper input validation and sanitization',
      'Follow security best practices for the technology stack',
      'Optimize for performance without sacrificing readability',
      'Write testable code with appropriate test coverage'
    ];
  }

  // Generate language-specific rules
  private getLanguageSpecificRules(languages: string[]): Record<string, string[]> {
    const rules: Record<string, string[]> = {};
    
    if (languages.includes('JavaScript')) {
      rules.javascript = [
        'Use const/let instead of var',
        'Prefer arrow functions for callbacks',
        'Use async/await over Promises.then() when possible',
        'Implement proper error boundaries',
        'Use strict equality (===) comparisons',
        'Avoid global variables and use modules'
      ];
    }
    
    if (languages.includes('TypeScript')) {
      rules.typescript = [
        'Always specify explicit types for function parameters and return values',
        'Use interfaces for object shapes and type definitions',
        'Enable strict mode in tsconfig.json',
        'Avoid using "any" type - use specific types or unknown',
        'Use generic types for reusable components',
        'Implement proper type guards for runtime type checking'
      ];
    }
    
    if (languages.includes('Python')) {
      rules.python = [
        'Follow PEP 8 style guidelines',
        'Use type hints for function parameters and return values',
        'Implement proper exception handling with specific exception types',
        'Use virtual environments for dependency management',
        'Write docstrings for all functions and classes',
        'Use list comprehensions and generator expressions appropriately'
      ];
    }
    
    return rules;
  }

  // Generate framework-specific rules
  private getFrameworkSpecificRules(frameworks: string[]): Record<string, string[]> {
    const rules: Record<string, string[]> = {};
    
    if (frameworks.some(f => f.includes('React'))) {
      rules.react = [
        'Use functional components with hooks over class components',
        'Implement proper key props for list items',
        'Use useCallback and useMemo for performance optimization',
        'Implement proper error boundaries',
        'Follow React component naming conventions (PascalCase)',
        'Use prop-types or TypeScript for prop validation'
      ];
    }
    
    if (frameworks.includes('Express.js')) {
      rules.express = [
        'Implement proper middleware for error handling',
        'Use helmet for security headers',
        'Implement rate limiting for API endpoints',
        'Use proper HTTP status codes',
        'Validate request data with middleware',
        'Implement proper logging with request/response tracking'
      ];
    }
    
    if (frameworks.includes('MongoDB/Mongoose')) {
      rules.mongodb = [
        'Define proper schema validation',
        'Use indexes for query optimization',
        'Implement proper connection pooling',
        'Use transactions for multi-document operations',
        'Validate data before saving to database',
        'Implement proper error handling for database operations'
      ];
    }
    
    return rules;
  }

  // Generate testing rules
  private getTestingRules(testingFrameworks: string[]): string[] {
    const rules = [
      'Write tests for all new features and bug fixes',
      'Aim for at least 80% code coverage',
      'Write unit tests for individual functions/components',
      'Write integration tests for API endpoints',
      'Use descriptive test names that explain what is being tested',
      'Follow the AAA pattern: Arrange, Act, Assert'
    ];
    
    if (testingFrameworks.includes('Jest')) {
      rules.push('Use Jest mocking capabilities for external dependencies');
      rules.push('Group related tests using describe blocks');
    }
    
    if (testingFrameworks.includes('Cypress') || testingFrameworks.includes('Playwright')) {
      rules.push('Write end-to-end tests for critical user journeys');
      rules.push('Use data-testid attributes for test element selection');
    }
    
    return rules;
  }

  // Generate performance rules
  private getPerformanceRules(projectType: string): string[] {
    const rules = [
      'Optimize images and assets for web delivery',
      'Implement proper caching strategies',
      'Minimize bundle size and use code splitting',
      'Optimize database queries and use indexes',
      'Implement proper error handling to prevent crashes'
    ];
    
    if (projectType === 'react' || projectType === 'next') {
      rules.push('Use React.memo and useMemo for expensive computations');
      rules.push('Implement lazy loading for components and routes');
      rules.push('Optimize re-renders by minimizing prop drilling');
    }
    
    if (projectType === 'node') {
      rules.push('Use clustering for CPU-intensive operations');
      rules.push('Implement proper memory management');
      rules.push('Use streaming for large data processing');
    }
    
    return rules;
  }

  // Generate security rules
  private getSecurityRules(projectType: string): string[] {
    const rules = [
      'Never commit secrets or API keys to version control',
      'Use environment variables for sensitive configuration',
      'Implement proper input validation and sanitization',
      'Use HTTPS for all production deployments',
      'Implement proper authentication and authorization',
      'Keep dependencies up to date and audit for vulnerabilities'
    ];
    
    if (projectType.includes('node') || projectType.includes('express')) {
      rules.push('Use helmet.js for security headers');
      rules.push('Implement rate limiting for API endpoints');
      rules.push('Use bcrypt for password hashing');
      rules.push('Implement CSRF protection');
    }
    
    return rules;
  }

  // Generate MCP server configurations
  private generateMCPServers(structure: RepositoryStructure): MCPServerConfig[] {
    const servers: MCPServerConfig[] = [];
    
    // Core servers for any project
    servers.push({
      name: 'filesystem',
      command: 'node',
      args: ['node_modules/@modelcontextprotocol/server-filesystem/dist/index.js'],
      env: {
        'ALLOWED_DIRECTORIES': process.cwd()
      },
      description: 'File system operations and repository management',
      category: 'core',
      required: true,
      autoStart: true
    });
    
    servers.push({
      name: 'perplexity',
      command: 'node',
      args: ['./src/api/testing/perplexity-mcp-server.js'],
      env: {
        'PERPLEXITY_API_KEY': '${PERPLEXITY_API_KEY}'
      },
      description: 'Perplexity API integration for research and analysis',
      category: 'ai',
      required: false,
      autoStart: true
    });
    
    // Testing framework servers
    if (structure.testingFrameworks.length > 0) {
      servers.push({
        name: 'testing',
        command: 'node',
        args: ['./src/api/testing/testing-mcp-server.js'],
        env: {},
        description: 'Automated testing and quality assurance',
        category: 'testing',
        required: false,
        autoStart: true
      });
    }
    
    // Browser automation for web projects
    if (['react', 'next', 'vue', 'angular'].includes(structure.projectType)) {
      servers.push({
        name: 'browser',
        command: 'npx',
        args: ['@modelcontextprotocol/server-puppeteer'],
        env: {
          'PUPPETEER_HEADLESS': 'true'
        },
        description: 'Browser automation and web testing',
        category: 'automation',
        required: false,
        autoStart: false
      });
    }
    
    // Database servers based on dependencies
    const deps = { ...structure.dependencies.production, ...structure.dependencies.development };
    if (deps.mongodb || deps.mongoose) {
      servers.push({
        name: 'mongodb',
        command: 'node',
        args: ['./src/api/testing/mongodb-mcp-server.js'],
        env: {
          'MONGODB_URI': '${MONGODB_URI}'
        },
        description: 'MongoDB database operations and management',
        category: 'development',
        required: false,
        autoStart: true
      });
    }
    
    // GitHub integration for all projects
    servers.push({
      name: 'github',
      command: 'node',
      args: ['./src/api/testing/github-mcp-server.js'],
      env: {
        'GITHUB_TOKEN': '${GITHUB_TOKEN}'
      },
      description: 'GitHub repository operations and CI/CD integration',
      category: 'development',
      required: false,
      autoStart: false
    });
    
    return servers;
  }

  // Generate context management configuration
  private generateContextManagement(structure: RepositoryStructure): any {
    const config = {
      includePatterns: [
        '**/*.{js,ts,jsx,tsx}',
        '**/*.{md,mdx}',
        'package.json',
        '.cursorrules',
        '.cursor/**/*.{md,mdc,json}'
      ],
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.min.js',
        '**/*.log',
        'coverage/**',
        '.git/**'
      ],
      maxFiles: 150,
      smartInclusion: true
    };
    
    // Add language-specific patterns
    if (structure.languages.includes('Python')) {
      config.includePatterns.push('**/*.py');
      config.excludePatterns.push('**/__pycache__/**', '*.pyc');
    }
    
    // Add framework-specific patterns
    if (structure.projectType === 'next') {
      config.includePatterns.push('next.config.js', 'pages/**/*.{js,ts,jsx,tsx}');
      config.excludePatterns.push('.next/**');
    }
    
    if (structure.frameworks.some(f => f.includes('CSS'))) {
      config.includePatterns.push('**/*.{css,scss,sass,less}');
    }
    
    return config;
  }

  // Generate environment variables configuration
  private generateEnvironmentVariables(structure: RepositoryStructure): EnvironmentVariable[] {
    const variables: EnvironmentVariable[] = [];
    
    // Common variables
    variables.push({
      name: 'NODE_ENV',
      description: 'Node.js environment (development, production, test)',
      required: true,
      defaultValue: 'development',
      category: 'development',
      sensitive: false
    });
    
    // API keys based on detected integrations
    variables.push({
      name: 'PERPLEXITY_API_KEY',
      description: 'Perplexity API key for research functionality',
      required: false,
      category: 'api',
      sensitive: true
    });
    
    variables.push({
      name: 'GITHUB_TOKEN',
      description: 'GitHub personal access token for repository operations',
      required: false,
      category: 'api',
      sensitive: true
    });
    
    // Database variables
    const deps = { ...structure.dependencies.production, ...structure.dependencies.development };
    if (deps.mongodb || deps.mongoose) {
      variables.push({
        name: 'MONGODB_URI',
        description: 'MongoDB connection string',
        required: false,
        defaultValue: 'mongodb://localhost:27017/echotune',
        category: 'database',
        sensitive: true
      });
    }
    
    if (deps.redis) {
      variables.push({
        name: 'REDIS_URL',
        description: 'Redis connection URL',
        required: false,
        defaultValue: 'redis://localhost:6379',
        category: 'database',
        sensitive: false
      });
    }
    
    // Security variables
    variables.push({
      name: 'JWT_SECRET',
      description: 'JWT token signing secret',
      required: false,
      category: 'security',
      sensitive: true
    });
    
    variables.push({
      name: 'SESSION_SECRET',
      description: 'Session cookie signing secret',
      required: false,
      category: 'security',
      sensitive: true
    });
    
    return variables;
  }

  // Apply .cursorrules configuration
  private async applyCursorRules(config: CursorConfiguration, options: any): Promise<void> {
    const rulesContent = this.generateCursorRulesContent(config);
    const rulesPath = path.join(this.rootPath, '.cursorrules');
    
    if (options.dryRun) {
      this.emit('dry_run_file_change', { path: rulesPath, action: 'create/update' });
      return;
    }
    
    if (await this.fileExists(rulesPath) && !options.overwriteExisting) {
      this.emit('file_skipped', { path: rulesPath, reason: 'exists' });
      return;
    }
    
    await fs.writeFile(rulesPath, rulesContent);
    this.emit('file_created', { path: rulesPath });
  }

  // Apply MCP configuration
  private async applyMCPConfiguration(config: CursorConfiguration, options: any): Promise<void> {
    const mcpConfig = {
      mcpServers: {}
    };
    
    for (const server of config.mcpServers) {
      mcpConfig.mcpServers[server.name] = {
        command: server.command,
        args: server.args,
        env: server.env,
        description: server.description
      };
    }
    
    const mcpDir = path.join(this.rootPath, '.cursor');
    const mcpPath = path.join(mcpDir, 'mcp.json');
    
    if (options.dryRun) {
      this.emit('dry_run_file_change', { path: mcpPath, action: 'create/update' });
      return;
    }
    
    await fs.mkdir(mcpDir, { recursive: true });
    
    if (await this.fileExists(mcpPath) && !options.overwriteExisting) {
      this.emit('file_skipped', { path: mcpPath, reason: 'exists' });
      return;
    }
    
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2));
    this.emit('file_created', { path: mcpPath });
  }

  // Apply context management configuration
  private async applyContextConfiguration(config: CursorConfiguration, options: any): Promise<void> {
    const contextConfig = {
      include: config.contextManagement.includePatterns,
      exclude: config.contextManagement.excludePatterns,
      maxFiles: config.contextManagement.maxFiles,
      smartInclusion: config.contextManagement.smartInclusion
    };
    
    const contextPath = path.join(this.rootPath, '.cursor', 'context.json');
    
    if (options.dryRun) {
      this.emit('dry_run_file_change', { path: contextPath, action: 'create/update' });
      return;
    }
    
    if (await this.fileExists(contextPath) && !options.overwriteExisting) {
      this.emit('file_skipped', { path: contextPath, reason: 'exists' });
      return;
    }
    
    await fs.writeFile(contextPath, JSON.stringify(contextConfig, null, 2));
    this.emit('file_created', { path: contextPath });
  }

  // Generate environment template
  private async generateEnvironmentTemplate(config: CursorConfiguration, options: any): Promise<void> {
    let envContent = '# Environment Variables Configuration\n';
    envContent += '# Generated by Automated Config Detection\n\n';
    
    const categories = Array.from(new Set(config.environmentVariables.map(v => v.category)));
    
    for (const category of categories) {
      envContent += `# ${category.toUpperCase()} CONFIGURATION\n`;
      
      const categoryVars = config.environmentVariables.filter(v => v.category === category);
      for (const variable of categoryVars) {
        envContent += `# ${variable.description}\n`;
        if (variable.required) {
          envContent += `# REQUIRED\n`;
        }
        
        const value = variable.defaultValue || (variable.sensitive ? 'your_secret_key_here' : '');
        envContent += `${variable.name}=${value}\n\n`;
      }
    }
    
    const envPath = path.join(this.rootPath, '.env.example');
    
    if (options.dryRun) {
      this.emit('dry_run_file_change', { path: envPath, action: 'create/update' });
      return;
    }
    
    if (await this.fileExists(envPath) && !options.overwriteExisting) {
      this.emit('file_skipped', { path: envPath, reason: 'exists' });
      return;
    }
    
    await fs.writeFile(envPath, envContent);
    this.emit('file_created', { path: envPath });
  }

  // Apply recommended scripts
  private async applyRecommendedScripts(config: CursorConfiguration, options: any): Promise<void> {
    if (!this.repositoryStructure?.packageJson) return;
    
    const recommendedScripts = {
      'test:perplexity': 'node src/api/testing/test-perplexity-integration.js',
      'test:mcp': 'node src/api/testing/test-mcp-servers.js',
      'validate:config': 'node src/api/testing/validate-configuration.js',
      'health:check': 'node src/api/testing/health-check.js'
    };
    
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    const packageJson = { ...this.repositoryStructure.packageJson };
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    let hasChanges = false;
    for (const [script, command] of Object.entries(recommendedScripts)) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        hasChanges = true;
      }
    }
    
    if (!hasChanges) return;
    
    if (options.dryRun) {
      this.emit('dry_run_file_change', { path: packageJsonPath, action: 'update scripts' });
      return;
    }
    
    if (!options.overwriteExisting) {
      this.emit('file_skipped', { path: packageJsonPath, reason: 'script merge only' });
      return;
    }
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.emit('file_updated', { path: packageJsonPath, changes: 'scripts' });
  }

  // Generate .cursorrules content
  private generateCursorRulesContent(config: CursorConfiguration): string {
    let content = '# Cursor AI Rules Configuration\n';
    content += '# Generated by Automated Configuration Detection\n\n';
    
    content += '## General Development Rules\n';
    for (const rule of config.rules.general) {
      content += `- ${rule}\n`;
    }
    content += '\n';
    
    // Language-specific rules
    for (const [language, rules] of Object.entries(config.rules.languageSpecific)) {
      content += `## ${language} Specific Rules\n`;
      for (const rule of rules) {
        content += `- ${rule}\n`;
      }
      content += '\n';
    }
    
    // Framework-specific rules
    for (const [framework, rules] of Object.entries(config.rules.frameworkSpecific)) {
      content += `## ${framework} Specific Rules\n`;
      for (const rule of rules) {
        content += `- ${rule}\n`;
      }
      content += '\n';
    }
    
    // Testing rules
    if (config.rules.testing.length > 0) {
      content += '## Testing Rules\n';
      for (const rule of config.rules.testing) {
        content += `- ${rule}\n`;
      }
      content += '\n';
    }
    
    // Performance rules
    if (config.rules.performance.length > 0) {
      content += '## Performance Rules\n';
      for (const rule of config.rules.performance) {
        content += `- ${rule}\n`;
      }
      content += '\n';
    }
    
    // Security rules
    if (config.rules.security.length > 0) {
      content += '## Security Rules\n';
      for (const rule of config.rules.security) {
        content += `- ${rule}\n`;
      }
      content += '\n';
    }
    
    // MCP Server information
    content += '## Available MCP Servers\n';
    for (const server of config.mcpServers) {
      content += `- **${server.name}**: ${server.description}\n`;
    }
    
    return content;
  }

  // Create configuration backup
  private async createConfigurationBackup(): Promise<void> {
    const backupDir = path.join(this.rootPath, '.cursor', 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const filesToBackup = [
      '.cursorrules',
      '.cursor/mcp.json',
      '.cursor/context.json',
      '.env.example'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(this.rootPath, file);
      if (await this.fileExists(sourcePath)) {
        const backupPath = path.join(backupDir, `${file.replace(/[\/\\]/g, '_')}.${timestamp}.backup`);
        await fs.copyFile(sourcePath, backupPath);
        this.emit('backup_created', { original: sourcePath, backup: backupPath });
      }
    }
  }

  // Load default configuration templates
  private loadDefaultTemplates(): void {
    // This would typically load templates from a configuration file or database
    // For now, we'll define basic templates inline
    this.availableTemplates = [
      {
        id: 'node-basic',
        name: 'Node.js Basic Setup',
        description: 'Basic Node.js project with Express and testing',
        projectTypes: ['node'],
        frameworks: ['Express.js'],
        files: [],
        mcpServers: [],
        environmentVariables: [],
        scripts: {},
        dependencies: {}
      }
      // More templates would be added here
    ];
  }

  // Utility methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async getFilesByExtension(extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string, depth: number = 0): Promise<void> => {
      if (depth > 3) return; // Limit depth to avoid infinite recursion
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') && entry.name !== '.cursorrules') continue;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
            await scanDirectory(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scanDirectory(this.rootPath);
    return files;
  }

  // Get configuration status
  getConfigurationStatus(): {
    hasAnalysis: boolean;
    hasConfiguration: boolean;
    recommendedServers: number;
    detectedLanguages: string[];
    detectedFrameworks: string[];
  } {
    return {
      hasAnalysis: !!this.repositoryStructure,
      hasConfiguration: !!this.detectedConfiguration,
      recommendedServers: this.detectedConfiguration?.mcpServers?.length || 0,
      detectedLanguages: this.repositoryStructure?.languages || [],
      detectedFrameworks: this.repositoryStructure?.frameworks || []
    };
  }
}

// Export types
export type {
  RepositoryStructure,
  CursorConfiguration,
  MCPServerConfig,
  EnvironmentVariable,
  ConfigurationTemplate
};