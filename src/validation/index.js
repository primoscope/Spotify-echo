'use strict';
const { z } = require('zod');
function validate(schema, prop = 'body') {
  return (req, res, next) => {
    try {
      req[prop] = schema.parse(req[prop]);
      next();
    } catch (e) {
      return res.status(400).json({ error: { message: 'Invalid request', details: e.errors } });
    }
  };
}
module.exports = { z, validate };