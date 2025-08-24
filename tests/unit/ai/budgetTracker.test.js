/**
 * Tests for Budget Tracker (Phase 2 Vertex AI)
 */

const fs = require('fs');
const path = require('path');
const { BudgetTracker, BudgetExceededError } = require('../../src/ai/cost/budgetTracker');

// Mock logger to avoid issues in tests
jest.mock('../../src/infra/observability/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock prom-client register
jest.mock('../../src/infra/observability/metrics', () => ({
  register: {
    registerMetric: jest.fn()
  }
}));

describe('BudgetTracker', () => {
  let budgetTracker;
  let testStateDir;

  beforeEach(() => {
    // Create temporary directory for test state files
    testStateDir = path.join(__dirname, '../../../data/tmp/test');
    
    // Clean environment
    delete process.env.AI_MONTHLY_BUDGET_USD;
    delete process.env.AI_BUDGET_ALERT_THRESHOLD;
    delete process.env.AI_BUDGET_HARD_STOP;
    delete process.env.ALLOW_BUDGET_OVERRIDE;
    
    // Mock Date for consistent testing
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(7); // August (0-indexed)
    
    budgetTracker = new BudgetTracker();
    budgetTracker.config.stateFilePath = path.join(testStateDir, 'test_ai_cost_state.json');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testStateDir)) {
      fs.rmSync(testStateDir, { recursive: true, force: true });
    }
    
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(budgetTracker.config.monthlyBudgetUsd).toBe(250);
      expect(budgetTracker.config.alertThreshold).toBe(0.8);
      expect(budgetTracker.config.hardStop).toBe(false);
      expect(budgetTracker.config.allowOverride).toBe(false);
    });

    it('should load configuration from environment variables', () => {
      process.env.AI_MONTHLY_BUDGET_USD = '100';
      process.env.AI_BUDGET_ALERT_THRESHOLD = '0.75';
      process.env.AI_BUDGET_HARD_STOP = 'true';
      process.env.ALLOW_BUDGET_OVERRIDE = '1';

      const tracker = new BudgetTracker();
      
      expect(tracker.config.monthlyBudgetUsd).toBe(100);
      expect(tracker.config.alertThreshold).toBe(0.75);
      expect(tracker.config.hardStop).toBe(true);
      expect(tracker.config.allowOverride).toBe(true);
    });
  });

  describe('recordCost', () => {
    it('should record AI cost correctly', () => {
      const result = budgetTracker.recordCost('gpt-4', 'openai', 5.50);
      
      expect(result.spentUsd).toBe(5.50);
      expect(result.month).toBe('2024-08');
      expect(result.budgetUsd).toBe(250);
      expect(result.pct).toBeCloseTo(5.50 / 250);
      expect(result.recordCount).toBe(1);
    });

    it('should accumulate multiple costs', () => {
      budgetTracker.recordCost('gpt-4', 'openai', 5.50);
      budgetTracker.recordCost('gemini-pro', 'google', 2.25);
      const result = budgetTracker.recordCost('claude-3', 'anthropic', 3.75);
      
      expect(result.spentUsd).toBe(11.50);
      expect(result.recordCount).toBe(3);
    });

    it('should save state to file', () => {
      budgetTracker.recordCost('gpt-4', 'openai', 5.50);
      
      expect(fs.existsSync(budgetTracker.config.stateFilePath)).toBe(true);
      
      const savedData = JSON.parse(fs.readFileSync(budgetTracker.config.stateFilePath, 'utf8'));
      expect(savedData.monthlySpending['2024-08'].spentUsd).toBe(5.50);
      expect(savedData.monthlySpending['2024-08'].records).toHaveLength(1);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return correct budget status', () => {
      budgetTracker.recordCost('gpt-4', 'openai', 200); // 80% of $250 budget
      
      const status = budgetTracker.getBudgetStatus();
      
      expect(status.spentUsd).toBe(200);
      expect(status.budgetUsd).toBe(250);
      expect(status.pct).toBe(0.8);
      expect(status.remainingUsd).toBe(50);
      expect(status.hardStopActive).toBe(false);
    });

    it('should indicate hard stop when budget exceeded', () => {
      process.env.AI_BUDGET_HARD_STOP = 'true';
      const tracker = new BudgetTracker();
      
      tracker.recordCost('gpt-4', 'openai', 260); // Exceeds $250 budget
      
      const status = tracker.getBudgetStatus();
      
      expect(status.hardStopActive).toBe(true);
      expect(status.remainingUsd).toBe(0);
    });
  });

  describe('budget enforcement', () => {
    it('should not throw error when budget not exceeded', () => {
      budgetTracker.recordCost('gpt-4', 'openai', 100);
      
      expect(() => budgetTracker.checkBudgetEnforcement()).not.toThrow();
    });

    it('should throw BudgetExceededError when hard stop enabled and budget exceeded', () => {
      process.env.AI_BUDGET_HARD_STOP = 'true';
      const tracker = new BudgetTracker();
      
      tracker.recordCost('gpt-4', 'openai', 260);
      
      expect(() => tracker.checkBudgetEnforcement()).toThrow(BudgetExceededError);
    });

    it('should not throw when budget exceeded but override allowed', () => {
      process.env.AI_BUDGET_HARD_STOP = 'true';
      process.env.ALLOW_BUDGET_OVERRIDE = '1';
      const tracker = new BudgetTracker();
      
      tracker.recordCost('gpt-4', 'openai', 260);
      
      expect(() => tracker.checkBudgetEnforcement()).not.toThrow();
    });
  });

  describe('alert thresholds', () => {
    it('should emit alert when threshold exceeded', () => {
      const loggerMock = require('../../src/infra/observability/logger');
      
      budgetTracker.recordCost('gpt-4', 'openai', 200); // 80% of budget, triggers alert
      
      expect(loggerMock.warn).toHaveBeenCalledWith('budget_alert', expect.objectContaining({
        type: 'budget_alert',
        alert_type: 'threshold'
      }));
    });

    it('should emit exceeded alert when budget exceeded', () => {
      process.env.AI_BUDGET_HARD_STOP = 'true';
      const tracker = new BudgetTracker();
      const loggerMock = require('../../src/infra/observability/logger');
      
      tracker.recordCost('gpt-4', 'openai', 260);
      
      expect(loggerMock.warn).toHaveBeenCalledWith('budget_alert', expect.objectContaining({
        type: 'budget_alert',
        alert_type: 'exceeded'
      }));
    });
  });

  describe('getSpendingReport', () => {
    it('should generate detailed spending report', () => {
      budgetTracker.recordCost('gpt-4', 'openai', 10.00);
      budgetTracker.recordCost('gpt-3.5', 'openai', 5.00);
      budgetTracker.recordCost('gemini-pro', 'google', 7.50);
      
      const report = budgetTracker.getSpendingReport();
      
      expect(report.month).toBe('2024-08');
      expect(report.totalSpent).toBe(22.50);
      expect(report.totalRecords).toBe(3);
      
      expect(report.byProvider.openai.costUsd).toBe(15.00);
      expect(report.byProvider.openai.count).toBe(2);
      expect(report.byProvider.google.costUsd).toBe(7.50);
      expect(report.byProvider.google.count).toBe(1);
      
      expect(report.byModel['gpt-4'].costUsd).toBe(10.00);
      expect(report.byModel['gemini-pro'].costUsd).toBe(7.50);
    });
  });
});