/**
 * Validation Scripts Entry Point
 * 
 * Provides utilities and main entry point for repository validation
 */

const RepositoryValidator = require('./generate-validation-report');

module.exports = {
  RepositoryValidator,
  
  // Utility function to run validation
  async runValidation() {
    const validator = new RepositoryValidator();
    await validator.validate();
  },
  
  // Quick validation check (returns boolean)
  async quickCheck() {
    try {
      const validator = new RepositoryValidator();
      await validator.validate();
      
      // Check if there are any critical findings
      const hasCritical = validator.findings.some(f => f.severity === 'Critical');
      return !hasCritical;
    } catch (error) {
      console.error('Validation check failed:', error.message);
      return false;
    }
  }
};