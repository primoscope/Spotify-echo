/**
 * Validation integration tests
 * Tests validation middleware and error responses
 */

const request = require('supertest');
const { app } = require('../../src/server');

describe('/internal/example-validation', () => {
  test('should validate correct input', async () => {
    const validInput = {
      name: 'Test Name',
      limit: 50
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(validInput)
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      received: validInput
    });
  });

  test('should apply default values', async () => {
    const inputWithDefaults = {
      name: 'Test Name'
      // limit should default to 10
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(inputWithDefaults)
      .expect(200);

    expect(response.body.received).toMatchObject({
      name: 'Test Name',
      limit: 10
    });
  });

  test('should return 400 with E_VALIDATION for missing name', async () => {
    const invalidInput = {
      limit: 25
      // missing required name field
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'E_VALIDATION',
        message: 'Invalid request'
      }
    });

    expect(response.body.error).toHaveProperty('details');
    expect(response.body.error.details).toHaveProperty('field', 'body');
    expect(response.body.error.details).toHaveProperty('issues');
    expect(Array.isArray(response.body.error.details.issues)).toBe(true);
  });

  test('should return 400 with E_VALIDATION for invalid limit', async () => {
    const invalidInput = {
      name: 'Test Name',
      limit: 150 // exceeds max of 100
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'E_VALIDATION',
        message: 'Invalid request'
      }
    });

    expect(response.body.error.details.issues).toBeDefined();
    
    // Find the limit validation error
    const limitError = response.body.error.details.issues.find(
      issue => issue.path.includes('limit')
    );
    expect(limitError).toBeDefined();
  });

  test('should return 400 with E_VALIDATION for negative limit', async () => {
    const invalidInput = {
      name: 'Test Name',
      limit: -5
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body.error.code).toBe('E_VALIDATION');
  });

  test('should return 400 with E_VALIDATION for empty name', async () => {
    const invalidInput = {
      name: '',
      limit: 10
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body.error.code).toBe('E_VALIDATION');
  });

  test('should return 400 with E_VALIDATION for wrong data types', async () => {
    const invalidInput = {
      name: 123, // should be string
      limit: 'not a number' // should be number
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body.error.code).toBe('E_VALIDATION');
    expect(response.body.error.details.issues.length).toBeGreaterThan(0);
  });

  test('should handle empty request body', async () => {
    const response = await request(app)
      .post('/internal/example-validation')
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('E_VALIDATION');
  });

  test('should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/internal/example-validation')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}')
      .expect(400);

    // This should be handled by Express JSON parser before reaching validation
    expect(response.status).toBe(400);
  });

  test('should preserve request structure in error response', async () => {
    const invalidInput = {
      name: '', // invalid
      limit: 50  // valid
    };

    const response = await request(app)
      .post('/internal/example-validation')
      .send(invalidInput)
      .expect(400);

    expect(response.body.error).toHaveProperty('timestamp');
    expect(response.body.error.code).toBe('E_VALIDATION');
    expect(response.body.error.message).toBe('Invalid request');
    expect(response.body.error.details.field).toBe('body');
  });
});