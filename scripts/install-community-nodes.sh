#!/bin/bash
# Community Nodes Installation Script for n8n

echo "🧩 Installing n8n community nodes..."

# Install SuperCode node
echo "Installing @kenkaiii/n8n-nodes-supercode..."
docker exec echotune-n8n npm install @kenkaiii/n8n-nodes-supercode

# Install DeepSeek node  
echo "Installing n8n-nodes-deepseek..."
docker exec echotune-n8n npm install n8n-nodes-deepseek

# Install MCP node
echo "Installing n8n-nodes-mcp..."
docker exec echotune-n8n npm install n8n-nodes-mcp

# Restart n8n to load new nodes
echo "Restarting n8n container..."
docker restart echotune-n8n

echo "✅ Community nodes installation completed!"
echo "Please verify nodes are available in the n8n interface."