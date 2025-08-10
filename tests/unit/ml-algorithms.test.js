const { describe, it, expect } = require('@jest/globals');

const collaborative = require('../../src/ml/collaborative-filter');
const contentFilter = require('../../src/ml/content-filter');
const basicEngine = require('../../src/ml/recommendation-engine');

function makeUsers() {
  return [
    { id: 'u1', likes: ['t1', 't2', 't3'] },
    { id: 'u2', likes: ['t2', 't3', 't4'] },
    { id: 'u3', likes: ['t3', 't5'] },
  ];
}

function makeTracks() {
  return {
    t1: { id: 't1', vectors: [0.9, 0.1, 0.0] },
    t2: { id: 't2', vectors: [0.8, 0.2, 0.0] },
    t3: { id: 't3', vectors: [0.7, 0.3, 0.0] },
    t4: { id: 't4', vectors: [0.1, 0.9, 0.5] },
    t5: { id: 't5', vectors: [0.0, 0.1, 0.9] },
  };
}

describe('ML Algorithms', () => {
  it('collaborative filtering suggests neighbor-liked tracks', () => {
    const users = makeUsers();
    const recs = collaborative.generateRecommendations('u1', users, { limit: 5 });
    const trackIds = recs.map((r) => r.id);
    expect(trackIds).toContain('t4');
    expect(trackIds).toContain('t5');
  });

  it('content filter ranks by cosine similarity', () => {
    const tracks = makeTracks();
    const seed = tracks.t1;
    const recs = contentFilter.recommendSimilarTracks(seed, Object.values(tracks), { limit: 3 });
    expect(recs[0].id).toBe('t2');
    expect(recs.map((r) => r.id)).not.toContain('t1');
  });

  it('engine merges collaborative and content-based scores', async () => {
    const users = makeUsers();
    const tracks = makeTracks();
    const engine = basicEngine.createEngine({
      collaborative,
      contentFilter,
    });
    const result = await engine.generate('u2', { seedTrackId: 't3' }, { users, tracks, limit: 5 });
    expect(result.success).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    const ids = result.recommendations.map((r) => r.id);
    expect(ids).toContain('t1');
  });
});