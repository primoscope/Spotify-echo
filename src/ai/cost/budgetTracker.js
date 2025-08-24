/**
 * Budget Tracker for AI/Vertex AI Cost Management
 * Provides cost tracking, budget enforcement, and alerting capabilities
 */

const fs = require('fs');
const path = require('path');
const { register } = require('../../infra/observability/metrics');
const logger = require('../../infra/observability/logger');

// Custom error class for budget violations
class BudgetExceededError extends Error {
  constructor(budgetStatus) {
    super(`Monthly AI budget exceeded: $${budgetStatus.spentUsd.toFixed(2)} / $${budgetStatus.budgetUsd}`);
    this.name = 'BudgetExceededError';
    this.budgetStatus = budgetStatus;
  }
}

class BudgetTracker {
  constructor() {
    this.logger = logger;
    
    // Configuration from environment variables
    this.config = {
      monthlyBudgetUsd: parseFloat(process.env.AI_MONTHLY_BUDGET_USD) || 250,
      alertThreshold: parseFloat(process.env.AI_BUDGET_ALERT_THRESHOLD) || 0.8,
      hardStop: process.env.AI_BUDGET_HARD_STOP === 'true',
      allowOverride: process.env.ALLOW_BUDGET_OVERRIDE === '1',
      stateFilePath: path.join(__dirname, '../../../data/tmp/ai_cost_state.json')
    };
    
    // In-memory accumulator with rolling month tracking
    this.monthlySpending = new Map(); // YYYY-MM -> { spentUsd, records[] }
    this.alertsEmitted = new Set(); // Track which months have had alerts
    
    // Prometheus metrics for budget tracking
    this.createMetrics();
    
    // Load existing state
    this.loadState();
    
    this.logger.info('Budget tracker initialized', {
      monthlyBudget: this.config.monthlyBudgetUsd,
      alertThreshold: this.config.alertThreshold,
      hardStop: this.config.hardStop,
      stateFile: this.config.stateFilePath
    });
  }
  
  createMetrics() {
    // Import prom-client directly to avoid constructor issues
    const client = require('prom-client');
    
    // Create Prometheus metrics for cost tracking
    this.metrics = {
      costSpent: new client.Gauge({
        name: 'ai_cost_monthly_spent_usd',
        help: 'Monthly AI cost spent in USD',
        labelNames: ['month', 'provider']
      }),
      
      budgetUtilization: new client.Gauge({
        name: 'ai_budget_utilization_percent',
        help: 'AI budget utilization percentage',
        labelNames: ['month']
      }),
      
      budgetAlerts: new client.Counter({
        name: 'ai_cost_budget_alert_total',
        help: 'Total budget alert events',
        labelNames: ['month', 'alert_type']
      }),
      
      costPerModel: new client.Counter({
        name: 'ai_cost_per_model_usd_total',
        help: 'Total cost per model in USD',
        labelNames: ['model', 'provider']
      })
    };
    
    // Register metrics with the global registry
    Object.values(this.metrics).forEach(metric => {
      try {
        register.registerMetric(metric);
      } catch (error) {
        // Metric might already be registered, ignore
      }
    });
  }
  
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  loadState() {
    try {
      if (fs.existsSync(this.config.stateFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.config.stateFilePath, 'utf8'));
        
        // Load monthly spending data
        for (const [month, monthData] of Object.entries(data.monthlySpending || {})) {
          this.monthlySpending.set(month, monthData);
        }
        
        // Update metrics with loaded data
        this.updateMetrics();
        
        this.logger.info('Budget state loaded', {
          months: this.monthlySpending.size,
          currentMonthSpent: this.getCurrentMonthSpending().spentUsd
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load budget state', { error: error.message });
    }
  }
  
  saveState() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = {
        lastUpdated: new Date().toISOString(),
        monthlySpending: Object.fromEntries(this.monthlySpending),
        config: this.config
      };
      
      fs.writeFileSync(this.config.stateFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error('Failed to save budget state', { error: error.message });
    }
  }
  
  getCurrentMonthSpending() {
    const currentMonth = this.getCurrentMonth();
    return this.monthlySpending.get(currentMonth) || { spentUsd: 0, records: [] };
  }
  
  /**
   * Record a cost for AI model usage
   * @param {string} model - Model name (e.g., 'gpt-4', 'gemini-pro')
   * @param {string} provider - Provider name (e.g., 'openai', 'google')
   * @param {number} costUsd - Cost in USD
   * @param {Object} metadata - Additional metadata for the cost record
   */
  recordCost(model, provider, costUsd, metadata = {}) {
    const currentMonth = this.getCurrentMonth();
    const timestamp = new Date().toISOString();
    
    // Get or create month data
    let monthData = this.monthlySpending.get(currentMonth);
    if (!monthData) {
      monthData = { spentUsd: 0, records: [] };
      this.monthlySpending.set(currentMonth, monthData);
    }
    
    // Add cost record
    const costRecord = {
      timestamp,
      model,
      provider,
      costUsd,
      ...metadata
    };
    
    monthData.spentUsd += costUsd;
    monthData.records.push(costRecord);
    
    // Update metrics
    this.metrics.costPerModel.inc({ model, provider }, costUsd);
    this.updateMetrics();
    
    // Log structured cost event
    this.logger.info('ai_cost_record', {
      type: 'ai_cost_record',
      model,
      provider,
      cost_usd: costUsd,
      cumulative_month_spent: monthData.spentUsd,
      month: currentMonth,
      ...metadata
    });
    
    // Check budget and emit alerts if needed
    const budgetStatus = this.getBudgetStatus();
    this.checkBudgetThresholds(budgetStatus);
    
    // Save state to disk
    this.saveState();
    
    return budgetStatus;
  }
  
  /**
   * Get current budget status
   * @returns {Object} Budget status object
   */
  getBudgetStatus() {
    const currentMonth = this.getCurrentMonth();
    const monthData = this.getCurrentMonthSpending();
    
    return {
      month: currentMonth,
      spentUsd: monthData.spentUsd,
      budgetUsd: this.config.monthlyBudgetUsd,
      pct: monthData.spentUsd / this.config.monthlyBudgetUsd,
      hardStopActive: this.config.hardStop && monthData.spentUsd >= this.config.monthlyBudgetUsd,
      remainingUsd: Math.max(0, this.config.monthlyBudgetUsd - monthData.spentUsd),
      recordCount: monthData.records.length
    };
  }
  
  updateMetrics() {
    const currentMonth = this.getCurrentMonth();
    const monthData = this.getCurrentMonthSpending();
    
    // Update monthly spent metric
    this.metrics.costSpent.set({ month: currentMonth, provider: 'all' }, monthData.spentUsd);
    
    // Update budget utilization
    const utilization = (monthData.spentUsd / this.config.monthlyBudgetUsd) * 100;
    this.metrics.budgetUtilization.set({ month: currentMonth }, utilization);
  }
  
  checkBudgetThresholds(budgetStatus) {
    const { month, pct } = budgetStatus;
    
    // Check alert threshold
    if (pct >= this.config.alertThreshold && !this.alertsEmitted.has(`${month}-alert`)) {
      this.emitBudgetAlert('threshold', budgetStatus);
      this.alertsEmitted.add(`${month}-alert`);
    }
    
    // Check hard stop
    if (budgetStatus.hardStopActive && !this.alertsEmitted.has(`${month}-exceeded`)) {
      this.emitBudgetAlert('exceeded', budgetStatus);
      this.alertsEmitted.add(`${month}-exceeded`);
    }
  }
  
  emitBudgetAlert(alertType, budgetStatus) {
    // Increment alert metric
    this.metrics.budgetAlerts.inc({ 
      month: budgetStatus.month, 
      alert_type: alertType 
    });
    
    // Log alert
    this.logger.warn('budget_alert', {
      type: 'budget_alert',
      alert_type: alertType,
      month: budgetStatus.month,
      spent_usd: budgetStatus.spentUsd,
      budget_usd: budgetStatus.budgetUsd,
      utilization_pct: (budgetStatus.pct * 100).toFixed(1),
      hard_stop_active: budgetStatus.hardStopActive
    });
  }
  
  /**
   * Check if further AI calls should be allowed
   * @throws {BudgetExceededError} If budget is exceeded and hard stop is enabled
   */
  checkBudgetEnforcement() {
    const budgetStatus = this.getBudgetStatus();
    
    if (budgetStatus.hardStopActive && !this.config.allowOverride) {
      throw new BudgetExceededError(budgetStatus);
    }
    
    return budgetStatus;
  }
  
  /**
   * Get detailed spending report for a specific month
   * @param {string} month - Month in YYYY-MM format (defaults to current month)
   * @returns {Object} Detailed spending report
   */
  getSpendingReport(month = null) {
    const targetMonth = month || this.getCurrentMonth();
    const monthData = this.monthlySpending.get(targetMonth) || { spentUsd: 0, records: [] };
    
    // Group by provider and model
    const byProvider = {};
    const byModel = {};
    
    monthData.records.forEach(record => {
      // By provider
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { costUsd: 0, count: 0 };
      }
      byProvider[record.provider].costUsd += record.costUsd;
      byProvider[record.provider].count += 1;
      
      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { costUsd: 0, count: 0, provider: record.provider };
      }
      byModel[record.model].costUsd += record.costUsd;
      byModel[record.model].count += 1;
    });
    
    return {
      month: targetMonth,
      totalSpent: monthData.spentUsd,
      totalRecords: monthData.records.length,
      byProvider,
      byModel,
      budgetStatus: targetMonth === this.getCurrentMonth() ? this.getBudgetStatus() : null
    };
  }
}

module.exports = { BudgetTracker, BudgetExceededError };