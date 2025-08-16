const { describe, it, expect, beforeEach } = require('@jest/globals');
const spotifyApi = require('../../src/spotify/api-service');

// Mock global fetch used by api-service
global.fetch = jest.fn();

describe('Spotify API Service (mocked)', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('gets user profile', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user123', display_name: 'Test' }) });
    const profile = await spotifyApi.getUserProfile('token');
    expect(profile.id).toBe('user123');
  });

  it('searches tracks', async () => {
    const items = [{ id: 't1' }, { id: 't2' }];
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ tracks: { items } }) });
    const results = await spotifyApi.searchTracks('query', 'token');
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('t1');
  });

  it('handles API errors', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) });
    await expect(spotifyApi.getUserProfile('bad-token')).rejects.toThrow();
  });
});