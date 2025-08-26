/**
 * EchoTune AI - Phase 10 Comprehensive Test Suite
 * Tests for Advanced AI/ML Capabilities & Real-Time Recommendations
 */

const express = require('express');
const request = require('supertest');

// Test Configuration
const testConfig = {
  timeout: 10000,
  retries: 3,
  services: ['recommendation', 'inference', 'personalization', 'model_management'],
  endpoints: [
    'overview', 'health/comprehensive', 'services',
    'recommendations/status', 'recommendations/generate', 'recommendations/feedback',
    'inference/status', 'inference/predict', 'inference/batch',
    'personalization/status', 'personalization/profile', 'personalization/interaction',
    'models/status', 'models/metrics', 'analytics', 'integrations',
    'optimize/pipeline', 'report/comprehensive'
  ]
};

/**
 * Phase 10 Test Suite
 */
async function runPhase10Tests() {
  console.log('🧪 Starting Phase 10: Advanced AI/ML Capabilities Test Suite...');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    details: {
      services: {},
      endpoints: {},
      functionality: {}
    },
    timestamp: new Date()
  };
  
  try {
    // Test 1: Service Initialization
    console.log('\n📋 Test 1: Service Initialization...');
    const initResult = await testServiceInitialization();
    updateResults(results, 'Service Initialization', initResult);
    
    // Test 2: Advanced Recommendation Engine
    console.log('\n🎵 Test 2: Advanced Recommendation Engine...');
    const recommendationResult = await testAdvancedRecommendationEngine();
    updateResults(results, 'Advanced Recommendation Engine', recommendationResult);
    
    // Test 3: Real-Time Inference Service
    console.log('\n⚡ Test 3: Real-Time Inference Service...');
    const inferenceResult = await testRealTimeInferenceService();
    updateResults(results, 'Real-Time Inference Service', inferenceResult);
    
    // Test 4: Personalization Engine
    console.log('\n👤 Test 4: Personalization Engine...');
    const personalizationResult = await testPersonalizationEngine();
    updateResults(results, 'Personalization Engine', personalizationResult);
    
    // Test 5: AI Model Management
    console.log('\n🤖 Test 5: AI Model Management...');
    const modelManagementResult = await testAIModelManagement();
    updateResults(results, 'AI Model Management', modelManagementResult);
    
    // Test 6: API Endpoints
    console.log('\n🔍 Test 6: API Endpoints...');
    const apiResult = await testAPIEndpoints();
    updateResults(results, 'API Endpoints', apiResult);
    
    // Test 7: Cross-Service Integration
    console.log('\n🔗 Test 7: Cross-Service Integration...');
    const integrationResult = await testCrossServiceIntegration();
    updateResults(results, 'Cross-Service Integration', integrationResult);
    
    // Test 8: Performance and Optimization
    console.log('\n⚡ Test 8: Performance and Optimization...');
    const performanceResult = await testPerformanceOptimization();
    updateResults(results, 'Performance and Optimization', performanceResult);
    
    // Test 9: Error Handling and Resilience
    console.log('\n🛡️ Test 9: Error Handling and Resilience...');
    const resilienceResult = await testErrorHandlingResilience();
    updateResults(results, 'Error Handling and Resilience', resilienceResult);
    
    // Test 10: Comprehensive Functionality
    console.log('\n🎯 Test 10: Comprehensive Functionality...');
    const comprehensiveResult = await testComprehensiveFunctionality();
    updateResults(results, 'Comprehensive Functionality', comprehensiveResult);
    
  } catch (error) {
    console.error('❌ Critical test suite error:', error);
    results.errors.push(`Critical error: ${error.message}`);
  }
  
  // Generate final report
  const report = generateTestReport(results);
  console.log('\n' + '='.repeat(80));
  console.log('📊 PHASE 10 TEST RESULTS');
  console.log('='.repeat(80));
  console.log(report);
  
  return results;
}

/**
 * Test 1: Service Initialization
 */
async function testServiceInitialization() {
  const tests = [];
  
  try {
    // Test Phase10Orchestrator import
    console.log('  🔧 Testing Phase10Orchestrator import...');
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    tests.push({ name: 'Phase10Orchestrator Import', status: 'passed' });
    
    // Test orchestrator initialization
    console.log('  🚀 Testing orchestrator initialization...');
    const orchestrator = new Phase10Orchestrator({
      enableAdvancedRecommendationEngine: true,
      enableRealTimeInference: true,
      enablePersonalizationEngine: true,
      enableAIModelManagement: true
    });
    
    const initialized = await orchestrator.initialize();
    tests.push({ name: 'Orchestrator Initialization', status: initialized ? 'passed' : 'failed' });
    
    // Test service availability
    console.log('  📋 Testing service availability...');
    const status = orchestrator.getStatus();
    const expectedServices = ['recommendation', 'inference', 'personalization', 'model_management'];
    
    expectedServices.forEach(service => {
      const available = status.services.list.includes(service);
      tests.push({ name: `${service} Service Available`, status: available ? 'passed' : 'failed' });
    });
    
    // Test service health
    console.log('  💓 Testing service health...');
    const healthCheck = status.services.healthy >= status.services.total * 0.8; // 80% healthy threshold
    tests.push({ name: 'Service Health Check', status: healthCheck ? 'passed' : 'failed' });
    
    await orchestrator.shutdown();
    tests.push({ name: 'Orchestrator Shutdown', status: 'passed' });
    
  } catch (error) {
    tests.push({ name: 'Service Initialization', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 2: Advanced Recommendation Engine
 */
async function testAdvancedRecommendationEngine() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing AdvancedRecommendationEngineService...');
    const AdvancedRecommendationEngineService = require('../src/infra/AdvancedRecommendationEngineService');
    
    const service = new AdvancedRecommendationEngineService({
      enableRealTimeLearning: true,
      enableExploration: true,
      cacheSize: 1000
    });
    
    // Test initialization
    const initialized = await service.initialize();
    tests.push({ name: 'Recommendation Engine Initialization', status: initialized ? 'passed' : 'failed' });
    
    if (initialized) {
      // Test recommendation generation
      console.log('  🎵 Testing recommendation generation...');
      const recommendations = await service.generateRecommendations('test_user_123', {
        count: 10,
        genre: 'pop',
        mood: 'happy'
      });
      
      tests.push({ 
        name: 'Generate Recommendations', 
        status: Array.isArray(recommendations) && recommendations.length > 0 ? 'passed' : 'failed' 
      });
      
      // Test user feedback processing
      console.log('  📝 Testing user feedback processing...');
      const feedbackResult = await service.updateUserPreferences('test_user_123', {
        type: 'explicit',
        trackId: 'test_track_1',
        rating: 5,
        action: 'like'
      });
      
      tests.push({ name: 'Process User Feedback', status: feedbackResult ? 'passed' : 'failed' });
      
      // Test service status
      const status = service.getStatus();
      tests.push({ 
        name: 'Service Status', 
        status: status.status === 'active' ? 'passed' : 'failed' 
      });
      
      await service.shutdown();
    }
    
  } catch (error) {
    tests.push({ name: 'Advanced Recommendation Engine', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 3: Real-Time Inference Service
 */
async function testRealTimeInferenceService() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing RealTimeInferenceService...');
    const RealTimeInferenceService = require('../src/infra/RealTimeInferenceService');
    
    const service = new RealTimeInferenceService({
      maxLatency: 100,
      batchSize: 10,
      enableCaching: true,
      autoScaling: true
    });
    
    // Test initialization
    const initialized = await service.initialize();
    tests.push({ name: 'Inference Service Initialization', status: initialized ? 'passed' : 'failed' });
    
    if (initialized) {
      // Test single prediction
      console.log('  🔮 Testing single prediction...');
      const prediction = await service.predict('recommendation_model_v1', {
        userId: 'test_user',
        trackFeatures: [0.5, 0.3, 0.8, 0.2]
      });
      
      tests.push({ 
        name: 'Single Prediction', 
        status: prediction && prediction.prediction ? 'passed' : 'failed' 
      });
      
      // Test batch prediction
      console.log('  📦 Testing batch prediction...');
      const batchInputs = [
        { userId: 'user1', features: [0.1, 0.2, 0.3] },
        { userId: 'user2', features: [0.4, 0.5, 0.6] }
      ];
      
      const batchResults = await service.batchPredict('content_similarity_model', batchInputs);
      tests.push({ 
        name: 'Batch Prediction', 
        status: Array.isArray(batchResults) && batchResults.length === batchInputs.length ? 'passed' : 'failed' 
      });
      
      // Test caching
      console.log('  💾 Testing caching functionality...');
      const cachedPrediction = await service.predict('recommendation_model_v1', {
        userId: 'test_user',
        trackFeatures: [0.5, 0.3, 0.8, 0.2]
      });
      
      const status = service.getStatus();
      tests.push({ 
        name: 'Caching Functionality', 
        status: status.metrics.cacheHits > 0 ? 'passed' : 'failed' 
      });
      
      await service.shutdown();
    }
    
  } catch (error) {
    tests.push({ name: 'Real-Time Inference Service', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 4: Personalization Engine
 */
async function testPersonalizationEngine() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing PersonalizationEngineService...');
    const PersonalizationEngineService = require('../src/infra/PersonalizationEngineService');
    
    const service = new PersonalizationEngineService({
      enableContextualPersonalization: true,
      enableTemporalPersonalization: true,
      enableColdStartHandling: true,
      learningRate: 0.02
    });
    
    // Test initialization
    const initialized = await service.initialize();
    tests.push({ name: 'Personalization Engine Initialization', status: initialized ? 'passed' : 'failed' });
    
    if (initialized) {
      // Test personalized recommendations
      console.log('  🎯 Testing personalized recommendations...');
      const personalization = await service.getPersonalizedRecommendations('test_user_456', {
        mood: 'energetic',
        activity: 'workout',
        timeOfDay: 'morning'
      });
      
      tests.push({ 
        name: 'Personalized Recommendations', 
        status: personalization && personalization.personalizationParams ? 'passed' : 'failed' 
      });
      
      // Test interaction processing
      console.log('  📊 Testing interaction processing...');
      const interactionResult = await service.processUserInteraction('test_user_456', {
        type: 'play',
        trackId: 'track_123',
        duration: 180000,
        context: { mood: 'energetic' }
      });
      
      tests.push({ name: 'Process User Interaction', status: interactionResult ? 'passed' : 'failed' });
      
      // Test cold start handling
      console.log('  🥶 Testing cold start handling...');
      const coldStartResult = await service.handleColdStart('new_user_789', {
        age: 25,
        preferredGenres: ['pop', 'rock']
      });
      
      tests.push({ 
        name: 'Cold Start Handling', 
        status: coldStartResult && coldStartResult.coldStart ? 'passed' : 'failed' 
      });
      
      await service.shutdown();
    }
    
  } catch (error) {
    tests.push({ name: 'Personalization Engine', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 5: AI Model Management
 */
async function testAIModelManagement() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing AIModelManagementService...');
    const AIModelManagementService = require('../src/infra/AIModelManagementService');
    
    const service = new AIModelManagementService({
      enableABTesting: true,
      enableModelDriftDetection: true,
      enableAutoRollback: true,
      defaultDeploymentStrategy: 'canary'
    });
    
    // Test initialization
    const initialized = await service.initialize();
    tests.push({ name: 'Model Management Initialization', status: initialized ? 'passed' : 'failed' });
    
    if (initialized) {
      // Test model registration
      console.log('  📝 Testing model registration...');
      const modelDef = {
        name: 'test_recommendation_model',
        type: 'collaborative_filtering',
        version: '1.0.0',
        schema: { input: 'user_features', output: 'recommendations' }
      };
      
      const registeredModel = await service.registerModel(modelDef);
      tests.push({ 
        name: 'Model Registration', 
        status: registeredModel && registeredModel.id ? 'passed' : 'failed' 
      });
      
      if (registeredModel) {
        // Test model deployment
        console.log('  🚀 Testing model deployment...');
        const deployment = await service.deployModel(registeredModel.id, {
          strategy: 'canary',
          trafficPercentage: 10
        });
        
        tests.push({ 
          name: 'Model Deployment', 
          status: deployment && deployment.id ? 'passed' : 'failed' 
        });
        
        // Test performance monitoring
        console.log('  📊 Testing performance monitoring...');
        const monitorResult = await service.monitorModelPerformance(registeredModel.id, {
          latency: 95,
          accuracy: 0.87,
          errorRate: 0.02
        });
        
        tests.push({ name: 'Performance Monitoring', status: monitorResult ? 'passed' : 'failed' });
      }
      
      await service.shutdown();
    }
    
  } catch (error) {
    tests.push({ name: 'AI Model Management', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 6: API Endpoints
 */
async function testAPIEndpoints() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing API endpoint accessibility...');
    
    // Create mock app with Phase 10 orchestrator
    const app = express();
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    const orchestrator = new Phase10Orchestrator();
    await orchestrator.initialize();
    
    app.locals.phase10Orchestrator = orchestrator;
    
    // Mount Phase 10 routes
    const phase10Routes = require('../src/routes/phase10');
    app.use('/api/phase10', phase10Routes);
    
    // Test key endpoints
    const endpointsToTest = [
      { path: '/api/phase10/overview', method: 'GET' },
      { path: '/api/phase10/health/comprehensive', method: 'GET' },
      { path: '/api/phase10/services', method: 'GET' },
      { path: '/api/phase10/analytics', method: 'GET' }
    ];
    
    for (const endpoint of endpointsToTest) {
      try {
        const response = await request(app)[endpoint.method.toLowerCase()](endpoint.path);
        tests.push({ 
          name: `${endpoint.method} ${endpoint.path}`, 
          status: response.status < 500 ? 'passed' : 'failed',
          statusCode: response.status
        });
      } catch (error) {
        tests.push({ 
          name: `${endpoint.method} ${endpoint.path}`, 
          status: 'failed', 
          error: error.message 
        });
      }
    }
    
    await orchestrator.shutdown();
    
  } catch (error) {
    tests.push({ name: 'API Endpoints', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 7: Cross-Service Integration
 */
async function testCrossServiceIntegration() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing cross-service integration...');
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    
    const orchestrator = new Phase10Orchestrator({
      enableCrossServiceOptimization: true,
      enableIntelligentLoadBalancing: true
    });
    
    await orchestrator.initialize();
    
    // Test intelligent recommendations (cross-service)
    console.log('  🎯 Testing intelligent recommendations workflow...');
    const intelligentRecs = await orchestrator.getIntelligentRecommendations('integration_test_user', {
      mood: 'happy',
      activity: 'study',
      context: 'morning'
    });
    
    tests.push({ 
      name: 'Intelligent Recommendations Workflow', 
      status: intelligentRecs && intelligentRecs.recommendations ? 'passed' : 'failed' 
    });
    
    // Test user interaction processing (cross-service)
    console.log('  📊 Testing user interaction workflow...');
    const interactionResult = await orchestrator.processUserInteraction('integration_test_user', {
      type: 'like',
      trackId: 'integration_track_1',
      modelPrediction: true,
      modelId: 'test_model',
      satisfaction: 0.9,
      responseTime: 85
    });
    
    tests.push({ 
      name: 'User Interaction Workflow', 
      status: interactionResult && interactionResult.processed ? 'passed' : 'failed' 
    });
    
    // Test service coordination
    const status = orchestrator.getStatus();
    tests.push({ 
      name: 'Service Coordination', 
      status: status.integrationPatterns && status.integrationPatterns.length > 0 ? 'passed' : 'failed' 
    });
    
    await orchestrator.shutdown();
    
  } catch (error) {
    tests.push({ name: 'Cross-Service Integration', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 8: Performance and Optimization
 */
async function testPerformanceOptimization() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing performance optimization...');
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    
    const orchestrator = new Phase10Orchestrator({
      enableMLPipelineOptimization: true,
      enableAutoTuning: true
    });
    
    await orchestrator.initialize();
    
    // Test ML pipeline optimization
    console.log('  ⚡ Testing ML pipeline optimization...');
    const optimizationResult = await orchestrator.optimizeMLPipeline({
      targetLatency: 100,
      targetAccuracy: 0.9
    });
    
    tests.push({ 
      name: 'ML Pipeline Optimization', 
      status: optimizationResult ? 'passed' : 'failed' 
    });
    
    // Test performance monitoring
    const status = orchestrator.getStatus();
    tests.push({ 
      name: 'Performance Monitoring', 
      status: status.metrics && typeof status.metrics.averageLatency === 'number' ? 'passed' : 'failed' 
    });
    
    await orchestrator.shutdown();
    
  } catch (error) {
    tests.push({ name: 'Performance Optimization', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 9: Error Handling and Resilience
 */
async function testErrorHandlingResilience() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing error handling and resilience...');
    
    // Test invalid input handling
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    const orchestrator = new Phase10Orchestrator();
    await orchestrator.initialize();
    
    // Test with invalid user ID
    try {
      await orchestrator.getIntelligentRecommendations('', {});
      tests.push({ name: 'Invalid Input Handling', status: 'failed' });
    } catch (error) {
      tests.push({ name: 'Invalid Input Handling', status: 'passed' });
    }
    
    // Test service unavailability graceful handling
    const fallbackResult = await orchestrator.getIntelligentRecommendations('test_user', {});
    tests.push({ 
      name: 'Graceful Fallback', 
      status: fallbackResult || fallbackResult === null ? 'passed' : 'failed' 
    });
    
    await orchestrator.shutdown();
    
  } catch (error) {
    tests.push({ name: 'Error Handling and Resilience', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Test 10: Comprehensive Functionality
 */
async function testComprehensiveFunctionality() {
  const tests = [];
  
  try {
    console.log('  🔧 Testing comprehensive functionality...');
    const Phase10Orchestrator = require('../src/infra/Phase10Orchestrator');
    
    const orchestrator = new Phase10Orchestrator({
      enableAdvancedRecommendationEngine: true,
      enableRealTimeInference: true,
      enablePersonalizationEngine: true,
      enableAIModelManagement: true,
      enableCrossServiceOptimization: true
    });
    
    await orchestrator.initialize();
    
    // Test complete user journey
    console.log('  🎯 Testing complete user journey...');
    
    // 1. Get personalized recommendations
    const recommendations = await orchestrator.getIntelligentRecommendations('journey_user', {
      mood: 'chill',
      activity: 'relax'
    });
    
    // 2. Process user interaction
    if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
      await orchestrator.processUserInteraction('journey_user', {
        type: 'play',
        trackId: recommendations.recommendations[0].trackId,
        duration: 120000
      });
    }
    
    // 3. Get analytics
    const analytics = await orchestrator.getAIAnalytics('1h');
    
    tests.push({ 
      name: 'Complete User Journey', 
      status: recommendations && analytics ? 'passed' : 'failed' 
    });
    
    // Test system health after operations
    const finalStatus = orchestrator.getStatus();
    tests.push({ 
      name: 'System Health After Operations', 
      status: finalStatus.status === 'active' ? 'passed' : 'failed' 
    });
    
    await orchestrator.shutdown();
    
  } catch (error) {
    tests.push({ name: 'Comprehensive Functionality', status: 'failed', error: error.message });
  }
  
  return tests;
}

/**
 * Helper Functions
 */
function updateResults(results, testName, tests) {
  results.details.functionality[testName] = tests;
  
  tests.forEach(test => {
    results.total++;
    if (test.status === 'passed') {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(`${testName}: ${test.name} - ${test.error || 'Failed'}`);
    }
  });
}

function generateTestReport(results) {
  const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0';
  
  let report = `
📊 Test Summary:
   Total Tests: ${results.total}
   Passed: ${results.passed}
   Failed: ${results.failed}
   Success Rate: ${successRate}%

🎯 Service Test Results:`;

  for (const [category, tests] of Object.entries(results.details.functionality)) {
    const categoryPassed = tests.filter(t => t.status === 'passed').length;
    const categoryTotal = tests.length;
    const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : '0';
    
    report += `\n   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`;
  }

  if (results.errors.length > 0) {
    report += `\n\n❌ Errors (${results.errors.length}):`;
    results.errors.slice(0, 10).forEach(error => {
      report += `\n   • ${error}`;
    });
    
    if (results.errors.length > 10) {
      report += `\n   • ... and ${results.errors.length - 10} more errors`;
    }
  }

  report += `\n\n✅ Phase 10 Test Status: ${successRate >= 90 ? 'EXCELLENT' : successRate >= 75 ? 'GOOD' : successRate >= 50 ? 'FAIR' : 'NEEDS IMPROVEMENT'}`;
  
  return report;
}

// Run tests if called directly
if (require.main === module) {
  runPhase10Tests().then(results => {
    process.exit(results.passed === results.total ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runPhase10Tests,
  testConfig
};