#!/bin/bash

# Script to ensure required labels exist in the repository
# This should be run during repository setup or workflow initialization

echo "🏷️ Ensuring required labels exist..."

# Required labels for automation
declare -A LABELS=(
    ["copilot-coding-agent"]="0366d6:PR created by Copilot coding agent"
    ["automation"]="28a745:Automated workflow or process"
    ["documentation"]="0075ca:Documentation improvements or updates"
    ["enhancement"]="a2eeef:New feature or request"
    ["bug"]="d73a4a:Something isn't working"
)

# Create labels if they don't exist
for label in "${!LABELS[@]}"; do
    IFS=':' read -r color description <<< "${LABELS[$label]}"
    
    echo "Checking label: $label"
    if ! gh label list --json name --jq '.[].name' | grep -q "^${label}$"; then
        echo "Creating label: $label"
        gh label create "$label" \
            --description "$description" \
            --color "$color" || echo "Failed to create label: $label"
    else
        echo "Label already exists: $label"
    fi
done

echo "✅ Label check complete"