const express = require('express');
const router = express.Router();
const { success } = require('../utils/response-formatter');

router.get('/health', (req, res) => {
  const body = success({ status: 'ok', ts: new Date().toISOString() });
  res.status(200).json(body);
});

module.exports = router;