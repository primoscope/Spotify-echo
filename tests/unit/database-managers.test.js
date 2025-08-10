const { describe, it, expect } = require('@jest/globals');

const mongoManager = require('../../src/database/mongodb-manager');

describe('Database Managers', () => {
  it('mongodb manager exposes expected interface', () => {
    expect(typeof mongoManager.isConnected).toBe('function');
    expect(typeof mongoManager.getDatabase).toBe('function');
  });

  it('handles missing connection gracefully (no crash)', () => {
    const connected = mongoManager.isConnected();
    // May be false in unit env; just ensure a boolean and no throw
    expect(typeof connected).toBe('boolean');
  });
});