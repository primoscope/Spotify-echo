const express = require('express');
const { swaggerSpec, swaggerUi } = require('../middleware/swagger');

const router = express.Router();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive Swagger/OpenAPI documentation for EchoTune AI API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: API documentation page
 */

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(swaggerSpec, {
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1976d2 }
    .swagger-ui .info .description { color: #666 }
  `,
    customSiteTitle: 'EchoTune AI API Documentation',
  })
);

// Serve raw OpenAPI spec as JSON
router.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/docs/health:
 *   get:
 *     summary: Documentation health check
 *     description: Verify that API documentation is working correctly
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Documentation is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 version:
 *                   type: string
 *                   example: 2.1.0
 *                 endpoints:
 *                   type: number
 *                   description: Number of documented endpoints
 */
router.get('/health', (req, res) => {
  const paths = Object.keys(swaggerSpec.paths || {});
  res.json({
    status: 'healthy',
    version: swaggerSpec.info.version,
    endpoints: paths.length,
    spec_url: `${req.protocol}://${req.get('host')}/api/docs/openapi.json`,
  });
});

module.exports = router;
