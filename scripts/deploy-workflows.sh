#!/bin/bash
# Workflow Deployment Script

echo "⚡ Deploying n8n workflow templates..."

# Load and deploy comprehensive workflow templates
node scripts/n8n-comprehensive-workflow-templates.js

# Deploy GitHub coding agent workflows
node scripts/n8n-github-coding-agent-comprehensive.js

echo "✅ Workflow deployment completed!"