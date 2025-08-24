'use strict';
const express = require('express');
const router = express.Router();
router.get('/', (req, res) => { res.json({ ok: true, service: 'echotune-api', timestamp: new Date().toISOString(), uptime_seconds: process.uptime(), node: process.version }); });
module.exports = router;