'use strict';
const express = require('express');
const router = express.Router();
const { register } = require('../../infra/observability/metrics');
router.get('/', async (req, res) => { try { res.set('Content-Type', register.contentType); res.end(await register.metrics()); } catch (err) { res.status(500).send(`# Metrics collection error\n${err.message}`); } });
module.exports = router;