// Optional agentops integration
let agentops = null;
try {
  agentops = require('agentops');
} catch (error) {
  // AgentOps not available, use mock implementation
}

/**
 * AgentOps Manual Trace Management Example
 * Implements the manual trace management pattern from AgentOps documentation
 */
class AgentOpsTraceManager {
  constructor() {
    this.activeTraces = new Map();
    this.enabled = !!agentops;
    
    if (!this.enabled) {
      console.log('📊 AgentOps tracing disabled - using mock implementation');
    }
  }

  /**
   * Start a manual trace with custom configuration
   */
  startTrace(name, tags = []) {
    if (!this.enabled || !process.env.AGENTOPS_API_KEY) {
      return null;
    }

    try {
      const trace = agentops.start_trace({
        name,
        tags: [...tags, 'manual-workflow']
      });
      
      this.activeTraces.set(trace.id || name, trace);
      console.log(`🔍 AgentOps trace started: ${name}`);
      return trace;
    } catch (error) {
      console.error('Failed to start AgentOps trace:', error);
      return null;
    }
  }

  /**
   * End a trace with success or failure state
   */
  endTrace(trace, endState = 'Success', metadata = {}) {
    if (!trace || !this.enabled || !process.env.AGENTOPS_API_KEY) {
      return;
    }

    try {
      agentops.end_trace(trace, { 
        end_state: endState,
        ...metadata
      });
      
      // Remove from active traces
      const traceKey = trace.id || trace.name;
      if (traceKey && this.activeTraces.has(traceKey)) {
        this.activeTraces.delete(traceKey);
      }
      
      console.log(`🔍 AgentOps trace ended: ${trace.name || 'unnamed'} (${endState})`);
    } catch (error) {
      console.error('Failed to end AgentOps trace:', error);
    }
  }

  /**
   * Implementation of the manual trace management example from the documentation
   */
  async executeManualWorkflow(taskDescription) {
    const trace = this.startTrace('MyManualWorkflow', ['manual-flow']);
    
    try {
      // Simulate the main agent workflow
      const result = await this.performTask(taskDescription);
      
      // Simulate tool usage
      const toolResult = await this.webSearch(`info for ${result}`);
      
      this.endTrace(trace, 'Success', { 
        task: taskDescription,
        result,
        toolResult 
      });
      
      return { result, toolResult };
    } catch (error) {
      if (trace) {
        this.endTrace(trace, 'Fail', { 
          error: error.message,
          task: taskDescription 
        });
      }
      throw error;
    }
  }

  /**
   * Simulate main agent task execution
   */
  async performTask(taskDescription) {
    // This would be replaced with actual agent logic
    console.log(`🤖 Executing task: ${taskDescription}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return `Task completed: ${taskDescription}`;
  }

  /**
   * Simulate web search tool
   */
  async webSearch(query) {
    // This would be replaced with actual web search functionality
    console.log(`🔍 Web searching: ${query}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return `Search results for: ${query}`;
  }

  /**
   * Enhanced trace management for LLM provider operations
   */
  async traceLLMOperation(operationName, providerName, operation) {
    const trace = this.startTrace(`LLM-${operationName}`, [
      'llm-operation',
      providerName,
      'ai-workflow'
    ]);

    try {
      const result = await operation();
      
      this.endTrace(trace, 'Success', {
        provider: providerName,
        operation: operationName,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      if (trace) {
        this.endTrace(trace, 'Fail', {
          provider: providerName,
          operation: operationName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }

  /**
   * Trace Spotify API operations
   */
  async traceSpotifyOperation(operationName, operation) {
    const trace = this.startTrace(`Spotify-${operationName}`, [
      'spotify-api',
      'music-operation',
      'external-api'
    ]);

    try {
      const result = await operation();
      
      this.endTrace(trace, 'Success', {
        api: 'spotify',
        operation: operationName,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      if (trace) {
        this.endTrace(trace, 'Fail', {
          api: 'spotify',
          operation: operationName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }

  /**
   * Get active traces count for monitoring
   */
  getActiveTracesCount() {
    return this.activeTraces.size;
  }

  /**
   * Clean up any remaining active traces (useful for shutdown)
   */
  cleanupActiveTraces() {
    for (const [key, trace] of this.activeTraces.entries()) {
      this.endTrace(trace, 'Interrupted', { 
        reason: 'Application shutdown' 
      });
    }
    this.activeTraces.clear();
  }
}

// Export singleton instance
const traceManager = new AgentOpsTraceManager();

module.exports = {
  AgentOpsTraceManager,
  traceManager
};