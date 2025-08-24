'use strict';
const { z } = require('zod');
const { createValidationError } = require('../errors/createError');

function validate(schema, prop = 'body') {
  return (req, res, next) => {
    try {
      req[prop] = schema.parse(req[prop]);
      next();
    } catch (e) {
      // Create standardized validation error
      const error = createValidationError('Invalid request', {
        field: prop,
        issues: e.errors
      });
      
      return res.status(error.statusCode).json({ 
        error: { 
          code: error.code,
          message: error.message, 
          details: error.details 
        } 
      });
    }
  };
}

module.exports = { z, validate };