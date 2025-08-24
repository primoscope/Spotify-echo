/**
 * EchoTune AI - Multi-Agent Workflow Configurations
 * 
 * Predefined workflows for common tasks:
 * - Music Recommendation Pipeline
 * - Analytics and Insights Generation
 * - Chat and Support Automation
 * - Research and Analysis
 */

const workflowConfigs = {
    // Music Recommendation Pipeline
    musicRecommendationPipeline: {
        name: 'musicRecommendationPipeline',
        description: 'Multi-agent workflow for generating personalized music recommendations',
        entryPoint: 'userInput',
        agents: [
            {
                name: 'userInput',
                type: 'chat',
                description: 'Processes user input and preferences'
            },
            {
                name: 'analytics',
                type: 'analytics',
                description: 'Analyzes user data and listening patterns'
            },
            {
                name: 'recommendation',
                type: 'recommendation',
                description: 'Generates personalized music recommendations'
            },
            {
                name: 'automation',
                type: 'automation',
                description: 'Executes playlist creation and updates'
            }
        ],
        edges: [
            { from: 'userInput', to: 'analytics' },
            { from: 'analytics', to: 'recommendation' },
            { from: 'recommendation', to: 'automation' }
        ]
    },

    // Analytics and Insights Generation
    analyticsInsightsPipeline: {
        name: 'analyticsInsightsPipeline',
        description: 'Multi-agent workflow for generating comprehensive analytics insights',
        entryPoint: 'dataCollection',
        agents: [
            {
                name: 'dataCollection',
                type: 'automation',
                description: 'Collects and aggregates data from various sources'
            },
            {
                name: 'analytics',
                type: 'analytics',
                description: 'Processes data and generates insights'
            },
            {
                name: 'research',
                type: 'research',
                description: 'Researches trends and provides context'
            },
            {
                name: 'reporting',
                type: 'chat',
                description: 'Generates comprehensive reports and summaries'
            }
        ],
        edges: [
            { from: 'dataCollection', to: 'analytics' },
            { from: 'analytics', to: 'research' },
            { from: 'research', to: 'reporting' }
        ]
    },

    // Chat and Support Automation
    chatSupportPipeline: {
        name: 'chatSupportPipeline',
        description: 'Multi-agent workflow for automated chat support and assistance',
        entryPoint: 'chatInput',
        agents: [
            {
                name: 'chatInput',
                type: 'chat',
                description: 'Processes user chat input and intent'
            },
            {
                name: 'research',
                type: 'research',
                description: 'Researches relevant information and solutions'
            },
            {
                name: 'recommendation',
                type: 'recommendation',
                description: 'Provides personalized recommendations and solutions'
            },
            {
                name: 'followUp',
                type: 'chat',
                description: 'Handles follow-up questions and provides additional support'
            }
        ],
        edges: [
            { from: 'chatInput', to: 'research' },
            { from: 'research', to: 'recommendation' },
            { from: 'recommendation', to: 'followUp' }
        ]
    },

    // Research and Analysis Pipeline
    researchAnalysisPipeline: {
        name: 'researchAnalysisPipeline',
        description: 'Multi-agent workflow for comprehensive research and analysis',
        entryPoint: 'researchQuery',
        agents: [
            {
                name: 'researchQuery',
                type: 'chat',
                description: 'Processes research queries and objectives'
            },
            {
                name: 'research',
                type: 'research',
                description: 'Conducts primary research and data collection'
            },
            {
                name: 'analytics',
                type: 'analytics',
                description: 'Analyzes research data and identifies patterns'
            },
            {
                name: 'synthesis',
                type: 'chat',
                description: 'Synthesizes findings and generates insights'
            }
        ],
        edges: [
            { from: 'researchQuery', to: 'research' },
            { from: 'research', to: 'analytics' },
            { from: 'analytics', to: 'synthesis' }
        ]
    },

    // Performance Optimization Pipeline
    performanceOptimizationPipeline: {
        name: 'performanceOptimizationPipeline',
        description: 'Multi-agent workflow for system performance optimization',
        entryPoint: 'performanceMonitor',
        agents: [
            {
                name: 'performanceMonitor',
                type: 'automation',
                description: 'Monitors system performance metrics'
            },
            {
                name: 'analytics',
                type: 'analytics',
                description: 'Analyzes performance data and identifies bottlenecks'
            },
            {
                name: 'research',
                type: 'research',
                description: 'Researches optimization strategies and best practices'
            },
            {
                name: 'optimization',
                type: 'automation',
                description: 'Implements performance optimizations'
            }
        ],
        edges: [
            { from: 'performanceMonitor', to: 'analytics' },
            { from: 'analytics', to: 'research' },
            { from: 'research', to: 'optimization' }
        ]
    },

    // Security and Compliance Pipeline
    securityCompliancePipeline: {
        name: 'securityCompliancePipeline',
        description: 'Multi-agent workflow for security scanning and compliance checks',
        entryPoint: 'securityScan',
        agents: [
            {
                name: 'securityScan',
                type: 'automation',
                description: 'Performs security vulnerability scanning'
            },
            {
                name: 'research',
                type: 'research',
                description: 'Researches security threats and compliance requirements'
            },
            {
                name: 'analytics',
                type: 'analytics',
                description: 'Analyzes security findings and compliance gaps'
            },
            {
                name: 'remediation',
                type: 'automation',
                description: 'Implements security fixes and compliance measures'
            }
        ],
        edges: [
            { from: 'securityScan', to: 'research' },
            { from: 'research', to: 'analytics' },
            { from: 'analytics', to: 'remediation' }
        ]
    }
};

module.exports = workflowConfigs;