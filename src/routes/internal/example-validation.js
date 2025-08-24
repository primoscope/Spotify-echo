'use strict';
// Only add this route if no existing obvious candidate for validation. Mount at /internal/example-validation
const express = require('express');
const { z, validate } = require('../../validation');
const router = express.Router();
const schema = z.object({
  name: z.string().min(1),
  limit: z.number().int().positive().max(100).default(10)
});
router.post('/', validate(schema), (req, res) => {
  res.json({ ok: true, received: req.body });
});
module.exports = router;