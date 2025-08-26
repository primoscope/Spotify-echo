/**
 * Distributed Transaction Coordinator
 * 
 * Provides Two-Phase Commit (2PC) and Saga pattern implementation
 * for managing distributed transactions across microservices
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

// Transaction states
const TransactionState = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  PREPARED: 'prepared',
  COMMITTING: 'committing',
  COMMITTED: 'committed',
  ABORTING: 'aborting',
  ABORTED: 'aborted',
  FAILED: 'failed'
};

// Saga compensation actions
const CompensationAction = {
  RETRY: 'retry',
  COMPENSATE: 'compensate',
  ABORT: 'abort'
};

class DistributedTransactionCoordinator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      defaultTimeout: options.defaultTimeout || 30000,
      maxRetries: options.maxRetries || 3,
      enableSagaPattern: options.enableSagaPattern !== false,
      enable2PC: options.enable2PC !== false,
      enableCompensation: options.enableCompensation !== false,
      persistTransactions: options.persistTransactions !== false,
      ...options
    };

    // Transaction management
    this.transactions = new Map(); // transactionId -> transaction
    this.participants = new Map(); // serviceId -> participant info
    this.sagas = new Map(); // sagaId -> saga definition
    this.compensationActions = new Map(); // transactionId -> compensation stack
    
    // Metrics and monitoring
    this.metrics = {
      transactionsStarted: 0,
      transactionsCommitted: 0,
      transactionsAborted: 0,
      transactionsFailed: 0,
      sagasExecuted: 0,
      compensationsExecuted: 0,
      averageTransactionTime: 0
    };

    console.log('🔄 Distributed Transaction Coordinator initialized');
  }

  /**
   * Register a participant service
   */
  registerParticipant(serviceId, config) {
    const participant = {
      serviceId,
      endpoint: config.endpoint,
      timeout: config.timeout || this.config.defaultTimeout,
      retries: config.retries || this.config.maxRetries,
      supportsCompensation: config.supportsCompensation !== false,
      healthCheck: config.healthCheck,
      registeredAt: new Date().toISOString()
    };

    this.participants.set(serviceId, participant);
    console.log(`🔗 Participant registered: ${serviceId}`);
    
    return participant;
  }

  /**
   * Start a new distributed transaction
   */
  async startTransaction(transactionRequest) {
    const transactionId = uuidv4();
    const startTime = Date.now();
    
    const transaction = {
      id: transactionId,
      type: transactionRequest.type || '2pc',
      participants: transactionRequest.participants || [],
      state: TransactionState.PENDING,
      startTime,
      timeout: transactionRequest.timeout || this.config.defaultTimeout,
      context: transactionRequest.context || {},
      operations: transactionRequest.operations || [],
      compensations: [],
      retryCount: 0,
      maxRetries: transactionRequest.maxRetries || this.config.maxRetries
    };

    this.transactions.set(transactionId, transaction);
    this.metrics.transactionsStarted++;

    console.log(`🚀 Transaction started: ${transactionId} (type: ${transaction.type})`);
    this.emit('transactionStarted', transaction);

    try {
      let result;
      
      if (transaction.type === 'saga') {
        result = await this.executeSaga(transaction);
      } else {
        result = await this.execute2PC(transaction);
      }
      
      this.recordTransactionMetrics(transaction, Date.now() - startTime);
      return result;
      
    } catch (error) {
      console.error(`❌ Transaction failed: ${transactionId}:`, error);
      await this.abortTransaction(transactionId, error);
      throw error;
    }
  }

  /**
   * Execute Two-Phase Commit protocol
   */
  async execute2PC(transaction) {
    console.log(`🔄 Executing 2PC for transaction ${transaction.id}`);
    
    try {
      // Phase 1: Prepare
      transaction.state = TransactionState.PREPARING;
      this.emit('transactionStateChanged', transaction);
      
      const prepareResults = await this.preparePhase(transaction);
      
      if (prepareResults.every(result => result.vote === 'commit')) {
        transaction.state = TransactionState.PREPARED;
        
        // Phase 2: Commit
        transaction.state = TransactionState.COMMITTING;
        this.emit('transactionStateChanged', transaction);
        
        await this.commitPhase(transaction);
        
        transaction.state = TransactionState.COMMITTED;
        this.metrics.transactionsCommitted++;
        
        console.log(`✅ Transaction committed: ${transaction.id}`);
        this.emit('transactionCommitted', transaction);
        
        return { status: 'committed', transactionId: transaction.id };
        
      } else {
        // At least one participant voted to abort
        await this.abortTransaction(transaction.id, new Error('Participant voted to abort'));
        return { status: 'aborted', transactionId: transaction.id };
      }
      
    } catch (error) {
      await this.abortTransaction(transaction.id, error);
      throw error;
    }
  }

  /**
   * Execute Saga pattern
   */
  async executeSaga(transaction) {
    console.log(`🎭 Executing Saga for transaction ${transaction.id}`);
    
    const compensations = [];
    let currentStep = 0;
    
    try {
      for (const operation of transaction.operations) {
        console.log(`📝 Executing saga step ${currentStep + 1}/${transaction.operations.length}: ${operation.name}`);
        
        const result = await this.executeOperation(operation, transaction);
        
        // Store compensation action if provided
        if (operation.compensation) {
          compensations.unshift({ // Add to front for reverse execution
            operation: operation.compensation,
            context: result.compensationContext || {}
          });
        }
        
        currentStep++;
      }
      
      transaction.state = TransactionState.COMMITTED;
      this.metrics.transactionsCommitted++;
      this.metrics.sagasExecuted++;
      
      console.log(`✅ Saga completed successfully: ${transaction.id}`);
      this.emit('sagaCompleted', transaction);
      
      return { status: 'committed', transactionId: transaction.id, stepsCompleted: currentStep };
      
    } catch (error) {
      console.error(`❌ Saga failed at step ${currentStep + 1}: ${error.message}`);
      
      // Execute compensations in reverse order
      if (this.config.enableCompensation && compensations.length > 0) {
        await this.executeCompensations(transaction, compensations);
      }
      
      transaction.state = TransactionState.ABORTED;
      this.metrics.transactionsAborted++;
      
      throw error;
    }
  }

  /**
   * Prepare phase for 2PC
   */
  async preparePhase(transaction) {
    const preparePromises = transaction.participants.map(async (participantId) => {
      const participant = this.participants.get(participantId);
      if (!participant) {
        throw new Error(`Participant not found: ${participantId}`);
      }

      try {
        // Send prepare request to participant
        const result = await this.sendPrepareRequest(participant, transaction);
        return { participantId, vote: result.vote, data: result.data };
        
      } catch (error) {
        console.error(`❌ Prepare failed for participant ${participantId}:`, error);
        return { participantId, vote: 'abort', error: error.message };
      }
    });

    return await Promise.all(preparePromises);
  }

  /**
   * Commit phase for 2PC
   */
  async commitPhase(transaction) {
    const commitPromises = transaction.participants.map(async (participantId) => {
      const participant = this.participants.get(participantId);
      if (!participant) {
        throw new Error(`Participant not found: ${participantId}`);
      }

      try {
        await this.sendCommitRequest(participant, transaction);
        return { participantId, status: 'committed' };
        
      } catch (error) {
        console.error(`❌ Commit failed for participant ${participantId}:`, error);
        // In 2PC, commit phase failures require manual intervention
        return { participantId, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(commitPromises);
    
    // Check for commit failures
    const failures = results.filter(result => result.status === 'failed');
    if (failures.length > 0) {
      console.warn(`⚠️ Some participants failed to commit:`, failures);
      // This requires manual intervention in production
    }
    
    return results;
  }

  /**
   * Execute operation for saga
   */
  async executeOperation(operation, transaction) {
    // This is a simplified implementation
    // In real scenarios, this would make actual service calls
    console.log(`⚡ Executing operation: ${operation.name}`);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.9) { // 10% failure rate for demonstration
          reject(new Error(`Operation ${operation.name} failed`));
        } else {
          resolve({
            success: true,
            data: operation.data,
            compensationContext: { operationId: operation.name, timestamp: new Date().toISOString() }
          });
        }
      }, Math.random() * 100); // Random delay
    });
  }

  /**
   * Execute compensation actions
   */
  async executeCompensations(transaction, compensations) {
    console.log(`🔄 Executing ${compensations.length} compensations for transaction ${transaction.id}`);
    
    for (const compensation of compensations) {
      try {
        await this.executeOperation(compensation.operation, transaction);
        this.metrics.compensationsExecuted++;
        console.log(`✅ Compensation executed: ${compensation.operation.name}`);
        
      } catch (error) {
        console.error(`❌ Compensation failed: ${compensation.operation.name}:`, error);
        // Continue with remaining compensations
      }
    }
  }

  /**
   * Abort transaction
   */
  async abortTransaction(transactionId, reason) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return;
    }

    console.log(`🚫 Aborting transaction: ${transactionId} - ${reason.message}`);
    
    transaction.state = TransactionState.ABORTING;
    this.emit('transactionStateChanged', transaction);

    // Send abort to all participants
    const abortPromises = transaction.participants.map(async (participantId) => {
      const participant = this.participants.get(participantId);
      if (participant) {
        try {
          await this.sendAbortRequest(participant, transaction);
        } catch (error) {
          console.error(`❌ Abort failed for participant ${participantId}:`, error);
        }
      }
    });

    await Promise.all(abortPromises);
    
    transaction.state = TransactionState.ABORTED;
    this.metrics.transactionsAborted++;
    
    this.emit('transactionAborted', transaction);
  }

  /**
   * Send prepare request to participant (simplified)
   */
  async sendPrepareRequest(participant, transaction) {
    // Simplified implementation - in real scenarios, this would make HTTP/gRPC calls
    return new Promise((resolve) => {
      setTimeout(() => {
        // 95% success rate for prepare phase
        const vote = Math.random() > 0.05 ? 'commit' : 'abort';
        resolve({ vote, data: { participantId: participant.serviceId } });
      }, Math.random() * 50);
    });
  }

  /**
   * Send commit request to participant (simplified)
   */
  async sendCommitRequest(participant, transaction) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.02) { // 98% success rate for commit
          resolve({ status: 'committed' });
        } else {
          reject(new Error('Commit failed'));
        }
      }, Math.random() * 30);
    });
  }

  /**
   * Send abort request to participant (simplified)
   */
  async sendAbortRequest(participant, transaction) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'aborted' });
      }, Math.random() * 20);
    });
  }

  /**
   * Record transaction metrics
   */
  recordTransactionMetrics(transaction, duration) {
    this.metrics.averageTransactionTime = 
      (this.metrics.averageTransactionTime * (this.metrics.transactionsCommitted - 1) + duration) / 
      this.metrics.transactionsCommitted;
  }

  /**
   * Get coordinator statistics
   */
  getStatistics() {
    return {
      activeTransactions: Array.from(this.transactions.values()).filter(
        t => ![TransactionState.COMMITTED, TransactionState.ABORTED, TransactionState.FAILED].includes(t.state)
      ).length,
      totalTransactions: this.transactions.size,
      registeredParticipants: this.participants.size,
      metrics: this.metrics
    };
  }

  /**
   * Health check for the coordinator
   */
  async healthCheck() {
    const stats = this.getStatistics();
    
    // Check participant health
    const participantHealth = [];
    for (const [serviceId, participant] of this.participants.entries()) {
      if (participant.healthCheck) {
        try {
          const isHealthy = await participant.healthCheck();
          participantHealth.push({ serviceId, status: isHealthy ? 'healthy' : 'unhealthy' });
        } catch (error) {
          participantHealth.push({ serviceId, status: 'error', error: error.message });
        }
      }
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: stats,
      participants: participantHealth,
      config: {
        sagaPattern: this.config.enableSagaPattern,
        twoPhaseCommit: this.config.enable2PC,
        compensation: this.config.enableCompensation
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Distributed Transaction Coordinator...');
    
    // Wait for active transactions to complete
    const activeTransactions = Array.from(this.transactions.values()).filter(
      t => ![TransactionState.COMMITTED, TransactionState.ABORTED, TransactionState.FAILED].includes(t.state)
    );
    
    if (activeTransactions.length > 0) {
      console.log(`⏳ Waiting for ${activeTransactions.length} active transactions to complete...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    this.removeAllListeners();
    console.log('✅ Distributed Transaction Coordinator shutdown complete');
  }
}

// Singleton instance
let coordinatorInstance = null;

/**
 * Get or create Distributed Transaction Coordinator instance
 */
function getTransactionCoordinator(options = {}) {
  if (!coordinatorInstance) {
    coordinatorInstance = new DistributedTransactionCoordinator(options);
  }
  return coordinatorInstance;
}

module.exports = {
  DistributedTransactionCoordinator,
  TransactionState,
  CompensationAction,
  getTransactionCoordinator
};