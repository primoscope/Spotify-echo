# Validation Scripts

This directory contains repository validation tools for EchoTune AI.

## Scripts

- `generate-validation-report.js` - Main validation report generator
- `index.js` - Entry point and utilities

## Usage

```bash
# Run full repository validation
npm run validate:repo

# Run all validation including MCP health checks  
npm run validate:all
```

## Output

- `VALIDATION_REPORT.md` - Human-readable validation report
- `reports/validation-report.json` - Machine-readable validation data