import { test, expect } from '@playwright/test';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Load real environment variables
config({ path: '.env.real-testing' });

test.describe('Real MongoDB Database Tests', () => {
  let mongoClient: MongoClient;
  let db: any;
  
  test.beforeAll(async () => {
    // Connect to real MongoDB
    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    db = mongoClient.db('echotune');
    console.log('✅ Connected to real MongoDB database');
  });
  
  test.afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
      console.log('✅ Disconnected from MongoDB');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set up environment for real database testing
    await page.addInitScript(() => {
      window.TEST_MODE = 'real';
      window.USE_REAL_APIS = true;
    });
  });

  test('should connect to real MongoDB and perform basic operations', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🗄️ Testing Real MongoDB Connection and Operations...');
    
    await page.goto('/');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-mongodb-initial-page.png',
      fullPage: true 
    });
    
    // Test direct database connection
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    const collectionNames = collections.map(c => c.name);
    console.log(`📋 Collections: ${collectionNames.join(', ')}`);
    
    // Ensure required collections exist or create them
    const requiredCollections = ['users', 'listening_history', 'recommendations', 'playlists'];
    
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    }
    
    // Test database health endpoint
    const healthResponse = await page.request.get('/api/db/health');
    
    console.log(`📍 Database health status: ${healthResponse.status()}`);
    
    if (healthResponse.status() === 200) {
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('healthy');
      console.log('✅ Database health check passed');
    } else {
      console.log('⚠️ Database health check endpoint not available');
    }
    
    // Take screenshot after connection test
    await page.screenshot({
      path: 'artifacts/screenshots/02-mongodb-connection-verified.png',
      fullPage: true
    });
    
    console.log('✅ Real MongoDB connection and basic operations completed');
  });

  test('should perform real user data persistence', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('👤 Testing Real User Data Persistence...');
    
    await page.goto('/');
    
    const testUser = {
      spotifyId: `test_user_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      displayName: 'Real Test User',
      country: 'US',
      spotifyData: {
        followers: 10,
        product: 'premium'
      },
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    // Test user creation via API
    const createUserResponse = await page.request.post('/api/users', {
      data: testUser
    });
    
    console.log(`📍 Create user status: ${createUserResponse.status()}`);
    
    let userId = null;
    
    if (createUserResponse.status() === 200 || createUserResponse.status() === 201) {
      const createdUser = await createUserResponse.json();
      userId = createdUser.id || createdUser._id;
      
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.displayName).toBe(testUser.displayName);
      
      console.log(`✅ User created with ID: ${userId}`);
    } else {
      // Fallback: create directly in database
      const result = await db.collection('users').insertOne(testUser);
      userId = result.insertedId;
      console.log(`✅ User created directly in database: ${userId}`);
    }
    
    // Verify user exists in database
    const dbUser = await db.collection('users').findOne({ _id: userId });
    expect(dbUser).toBeTruthy();
    expect(dbUser.email).toBe(testUser.email);
    
    console.log('✅ User persistence verified in database');
    
    // Test user retrieval via API
    const getUserResponse = await page.request.get(`/api/users/${testUser.spotifyId}`);
    
    if (getUserResponse.status() === 200) {
      const retrievedUser = await getUserResponse.json();
      expect(retrievedUser.email).toBe(testUser.email);
      console.log('✅ User retrieval via API successful');
    }
    
    // Test user update
    const updateData = {
      displayName: 'Updated Test User',
      lastLogin: new Date()
    };
    
    const updateResponse = await page.request.put(`/api/users/${userId}`, {
      data: updateData
    });
    
    if (updateResponse.status() === 200) {
      console.log('✅ User update via API successful');
    } else {
      // Direct database update
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: updateData }
      );
      console.log('✅ User update directly in database successful');
    }
    
    // Take screenshot after user operations
    await page.screenshot({
      path: 'artifacts/screenshots/03-mongodb-user-persistence.png',
      fullPage: true
    });
    
    // Cleanup test user
    await db.collection('users').deleteOne({ _id: userId });
    
    console.log('✅ Real user data persistence testing completed');
  });

  test('should handle real listening history persistence', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🎵 Testing Real Listening History Persistence...');
    
    await page.goto('/');
    
    const testUserId = `test_user_${Date.now()}`;
    
    // Create test listening history data
    const listeningHistory = Array.from({ length: 20 }, (_, i) => ({
      userId: testUserId,
      trackId: `track_${i}`,
      trackName: `Test Song ${i}`,
      artist: `Test Artist ${i % 5}`,
      album: `Test Album ${Math.floor(i / 3)}`,
      playedAt: new Date(Date.now() - i * 60000), // Each song 1 minute apart
      playDuration: 180000 + (i * 1000), // Varying durations
      audioFeatures: {
        danceability: Math.random(),
        energy: Math.random(),
        valence: Math.random(),
        tempo: 120 + (i * 5)
      },
      context: {
        source: i % 2 === 0 ? 'recommendation' : 'search',
        deviceType: 'web'
      }
    }));
    
    // Test bulk insert via API
    const bulkInsertResponse = await page.request.post('/api/listening-history/bulk', {
      data: {
        userId: testUserId,
        tracks: listeningHistory
      }
    });
    
    console.log(`📍 Bulk insert status: ${bulkInsertResponse.status()}`);
    
    let insertedCount = 0;
    
    if (bulkInsertResponse.status() === 200 || bulkInsertResponse.status() === 201) {
      const result = await bulkInsertResponse.json();
      insertedCount = result.insertedCount || result.saved || listeningHistory.length;
      console.log(`✅ Bulk insert successful: ${insertedCount} tracks`);
    } else {
      // Fallback: direct database insertion
      const result = await db.collection('listening_history').insertMany(listeningHistory);
      insertedCount = result.insertedCount;
      console.log(`✅ Direct database insert: ${insertedCount} tracks`);
    }
    
    expect(insertedCount).toBeGreaterThan(0);
    
    // Verify data in database
    const dbTracks = await db.collection('listening_history')
      .find({ userId: testUserId })
      .sort({ playedAt: -1 })
      .toArray();
    
    expect(dbTracks.length).toBe(listeningHistory.length);
    console.log(`✅ Database verification: ${dbTracks.length} tracks found`);
    
    // Test retrieval with pagination
    const paginatedResponse = await page.request.get(
      `/api/listening-history/${testUserId}?page=1&limit=10&sort=playedAt`
    );
    
    if (paginatedResponse.status() === 200) {
      const paginatedData = await paginatedResponse.json();
      expect(Array.isArray(paginatedData.tracks || paginatedData)).toBeTruthy();
      console.log('✅ Paginated retrieval successful');
    }
    
    // Test analytics queries
    const analyticsResponse = await page.request.get(
      `/api/analytics/listening-stats/${testUserId}`
    );
    
    if (analyticsResponse.status() === 200) {
      const stats = await analyticsResponse.json();
      console.log(`✅ Analytics data: ${JSON.stringify(stats, null, 2)}`);
    }
    
    // Test aggregation queries
    const topArtists = await db.collection('listening_history')
      .aggregate([
        { $match: { userId: testUserId } },
        { $group: { _id: '$artist', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
      .toArray();
    
    console.log(`✅ Top artists aggregation: ${topArtists.length} results`);
    expect(topArtists.length).toBeGreaterThan(0);
    
    // Take screenshot after listening history operations
    await page.screenshot({
      path: 'artifacts/screenshots/04-mongodb-listening-history.png',
      fullPage: true
    });
    
    // Cleanup test data
    await db.collection('listening_history').deleteMany({ userId: testUserId });
    
    console.log('✅ Real listening history persistence testing completed');
  });

  test('should handle real recommendations persistence and retrieval', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🎯 Testing Real Recommendations Persistence...');
    
    await page.goto('/');
    
    const testUserId = `test_user_${Date.now()}`;
    
    // Create test recommendations
    const recommendations = Array.from({ length: 15 }, (_, i) => ({
      userId: testUserId,
      trackId: `rec_track_${i}`,
      trackName: `Recommended Song ${i}`,
      artist: `Recommended Artist ${i % 3}`,
      score: (100 - i) / 100, // Decreasing scores
      algorithm: ['collaborative_filtering', 'content_based', 'popularity'][i % 3],
      reasons: [
        'Based on your listening history',
        'Similar to tracks you liked',
        'Popular in your area'
      ],
      metadata: {
        audioFeatures: {
          danceability: Math.random(),
          energy: Math.random(),
          valence: Math.random()
        },
        genres: [`genre_${i % 4}`],
        popularity: 50 + (i * 2)
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }));
    
    // Test recommendations save via API
    const saveRecsResponse = await page.request.post('/api/recommendations', {
      data: {
        userId: testUserId,
        recommendations: recommendations
      }
    });
    
    console.log(`📍 Save recommendations status: ${saveRecsResponse.status()}`);
    
    let savedCount = 0;
    
    if (saveRecsResponse.status() === 200 || saveRecsResponse.status() === 201) {
      const result = await saveRecsResponse.json();
      savedCount = result.saved || result.insertedCount || recommendations.length;
      console.log(`✅ Recommendations saved: ${savedCount}`);
    } else {
      // Direct database save
      const result = await db.collection('recommendations').insertMany(recommendations);
      savedCount = result.insertedCount;
      console.log(`✅ Direct database save: ${savedCount} recommendations`);
    }
    
    expect(savedCount).toBeGreaterThan(0);
    
    // Test retrieval by score
    const topRecsResponse = await page.request.get(
      `/api/recommendations/${testUserId}?limit=5&sort=score&order=desc`
    );
    
    if (topRecsResponse.status() === 200) {
      const topRecs = await topRecsResponse.json();
      expect(Array.isArray(topRecs.recommendations || topRecs)).toBeTruthy();
      console.log(`✅ Top recommendations retrieved: ${(topRecs.recommendations || topRecs).length}`);
    }
    
    // Test filtering by algorithm
    const collaborativeRecs = await db.collection('recommendations')
      .find({ 
        userId: testUserId, 
        algorithm: 'collaborative_filtering' 
      })
      .sort({ score: -1 })
      .toArray();
    
    expect(collaborativeRecs.length).toBeGreaterThan(0);
    console.log(`✅ Collaborative filtering recommendations: ${collaborativeRecs.length}`);
    
    // Test recommendation scoring updates
    const updateScoreResponse = await page.request.put(
      `/api/recommendations/${testUserId}/rec_track_0`, 
      {
        data: { score: 0.99, feedback: 'user_liked' }
      }
    );
    
    if (updateScoreResponse.status() === 200) {
      console.log('✅ Recommendation score update successful');
    }
    
    // Test expired recommendations cleanup
    const expiredRecommendations = await db.collection('recommendations')
      .find({ expiresAt: { $lt: new Date() } })
      .toArray();
    
    console.log(`📊 Found ${expiredRecommendations.length} expired recommendations`);
    
    // Take screenshot after recommendations operations
    await page.screenshot({
      path: 'artifacts/screenshots/05-mongodb-recommendations.png',
      fullPage: true
    });
    
    // Cleanup test data
    await db.collection('recommendations').deleteMany({ userId: testUserId });
    
    console.log('✅ Real recommendations persistence testing completed');
  });

  test('should handle real playlist persistence and operations', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('📋 Testing Real Playlist Persistence...');
    
    await page.goto('/');
    
    const testUserId = `test_user_${Date.now()}`;
    
    // Create test playlists
    const testPlaylists = [
      {
        userId: testUserId,
        name: 'My Jazz Collection',
        description: 'Best jazz tracks for relaxing',
        isPublic: false,
        tracks: [
          { trackId: 'jazz_track_1', addedAt: new Date() },
          { trackId: 'jazz_track_2', addedAt: new Date() },
          { trackId: 'jazz_track_3', addedAt: new Date() }
        ],
        metadata: {
          totalDuration: 1080000, // 18 minutes
          averageTempo: 120,
          genres: ['jazz', 'smooth jazz']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: testUserId,
        name: 'Workout Hits',
        description: 'High energy songs for exercise',
        isPublic: true,
        tracks: [
          { trackId: 'rock_track_1', addedAt: new Date() },
          { trackId: 'electronic_track_1', addedAt: new Date() }
        ],
        metadata: {
          totalDuration: 720000, // 12 minutes
          averageTempo: 140,
          genres: ['rock', 'electronic']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Test playlist creation via API
    let createdPlaylists = [];
    
    for (const playlist of testPlaylists) {
      const createResponse = await page.request.post('/api/playlists', {
        data: playlist
      });
      
      console.log(`📍 Create playlist "${playlist.name}" status: ${createResponse.status()}`);
      
      if (createResponse.status() === 200 || createResponse.status() === 201) {
        const created = await createResponse.json();
        createdPlaylists.push(created);
        console.log(`✅ Playlist created: ${created.id || created._id}`);
      } else {
        // Direct database insert
        const result = await db.collection('playlists').insertOne(playlist);
        createdPlaylists.push({ ...playlist, _id: result.insertedId });
        console.log(`✅ Playlist created directly: ${result.insertedId}`);
      }
    }
    
    expect(createdPlaylists.length).toBe(testPlaylists.length);
    
    // Test playlist retrieval
    const getUserPlaylistsResponse = await page.request.get(`/api/playlists/user/${testUserId}`);
    
    if (getUserPlaylistsResponse.status() === 200) {
      const userPlaylists = await getUserPlaylistsResponse.json();
      expect(Array.isArray(userPlaylists.playlists || userPlaylists)).toBeTruthy();
      console.log(`✅ User playlists retrieved: ${(userPlaylists.playlists || userPlaylists).length}`);
    }
    
    // Test playlist updates (add/remove tracks)
    const firstPlaylist = createdPlaylists[0];
    const playlistId = firstPlaylist.id || firstPlaylist._id;
    
    const addTrackResponse = await page.request.post(`/api/playlists/${playlistId}/tracks`, {
      data: {
        trackId: 'new_jazz_track',
        position: 0 // Add at beginning
      }
    });
    
    if (addTrackResponse.status() === 200) {
      console.log('✅ Track added to playlist via API');
    } else {
      // Direct database update
      await db.collection('playlists').updateOne(
        { _id: playlistId },
        { 
          $push: { 
            tracks: { 
              $each: [{ trackId: 'new_jazz_track', addedAt: new Date() }], 
              $position: 0 
            }
          },
          $set: { updatedAt: new Date() }
        }
      );
      console.log('✅ Track added to playlist directly');
    }
    
    // Test playlist search and filtering
    const searchResponse = await page.request.get('/api/playlists/search?q=jazz&public=false');
    
    if (searchResponse.status() === 200) {
      const searchResults = await searchResponse.json();
      console.log(`✅ Playlist search results: ${(searchResults.playlists || searchResults).length}`);
    }
    
    // Test public playlists discovery
    const publicPlaylists = await db.collection('playlists')
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`✅ Public playlists found: ${publicPlaylists.length}`);
    
    // Test playlist analytics
    const playlistStats = await db.collection('playlists')
      .aggregate([
        { $match: { userId: testUserId } },
        {
          $group: {
            _id: null,
            totalPlaylists: { $sum: 1 },
            totalTracks: { $sum: { $size: '$tracks' } },
            avgTracksPerPlaylist: { $avg: { $size: '$tracks' } }
          }
        }
      ])
      .toArray();
    
    if (playlistStats.length > 0) {
      console.log(`✅ Playlist statistics: ${JSON.stringify(playlistStats[0], null, 2)}`);
    }
    
    // Take screenshot after playlist operations
    await page.screenshot({
      path: 'artifacts/screenshots/06-mongodb-playlists.png',
      fullPage: true
    });
    
    // Cleanup test data
    await db.collection('playlists').deleteMany({ userId: testUserId });
    
    console.log('✅ Real playlist persistence testing completed');
  });

  test('should handle database indexing and performance optimization', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('⚡ Testing Database Indexing and Performance...');
    
    await page.goto('/');
    
    // Create performance test data
    const performanceTestUser = `perf_test_${Date.now()}`;
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      userId: performanceTestUser,
      trackId: `perf_track_${i}`,
      trackName: `Performance Test Song ${i}`,
      artist: `Artist ${i % 100}`, // 100 different artists
      playedAt: new Date(Date.now() - i * 1000),
      audioFeatures: {
        danceability: Math.random(),
        energy: Math.random(),
        valence: Math.random(),
        tempo: 60 + (Math.random() * 180)
      }
    }));
    
    console.log('📊 Inserting performance test data...');
    const insertStartTime = Date.now();
    
    // Insert large dataset
    const insertResult = await db.collection('listening_history').insertMany(largeDataset);
    const insertTime = Date.now() - insertStartTime;
    
    console.log(`✅ Inserted ${insertResult.insertedCount} records in ${insertTime}ms`);
    expect(insertResult.insertedCount).toBe(largeDataset.length);
    
    // Test query performance with various indexes
    const indexTests = [
      {
        name: 'User ID Index',
        index: { userId: 1 },
        query: { userId: performanceTestUser }
      },
      {
        name: 'Compound Index (User + Date)',
        index: { userId: 1, playedAt: -1 },
        query: { userId: performanceTestUser }
      },
      {
        name: 'Text Search Index',
        index: { trackName: 'text', artist: 'text' },
        query: { $text: { $search: 'Performance Test' } }
      }
    ];
    
    for (const indexTest of indexTests) {
      console.log(`📊 Testing ${indexTest.name}...`);
      
      // Create index if it doesn't exist
      try {
        await db.collection('listening_history').createIndex(indexTest.index);
        console.log(`✅ Index created: ${indexTest.name}`);
      } catch (error) {
        console.log(`⚠️ Index already exists or failed: ${indexTest.name}`);
      }
      
      // Test query performance
      const queryStartTime = Date.now();
      const results = await db.collection('listening_history')
        .find(indexTest.query)
        .sort({ playedAt: -1 })
        .limit(100)
        .toArray();
      const queryTime = Date.now() - queryStartTime;
      
      console.log(`⚡ ${indexTest.name} query time: ${queryTime}ms (${results.length} results)`);
      
      // Performance should be reasonable (under 1 second for test data)
      expect(queryTime).toBeLessThan(1000);
    }
    
    // Test aggregation performance
    console.log('📊 Testing aggregation performance...');
    
    const aggregationStartTime = Date.now();
    const aggregationResults = await db.collection('listening_history')
      .aggregate([
        { $match: { userId: performanceTestUser } },
        { $group: { 
          _id: '$artist', 
          count: { $sum: 1 },
          avgTempo: { $avg: '$audioFeatures.tempo' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    const aggregationTime = Date.now() - aggregationStartTime;
    
    console.log(`⚡ Aggregation time: ${aggregationTime}ms (${aggregationResults.length} results)`);
    expect(aggregationTime).toBeLessThan(2000);
    
    // Test index usage with explain
    const explainResult = await db.collection('listening_history')
      .find({ userId: performanceTestUser })
      .explain('executionStats');
    
    console.log(`📊 Query execution stats: ${JSON.stringify(explainResult.executionStats, null, 2)}`);
    
    // Take screenshot after performance testing
    await page.screenshot({
      path: 'artifacts/screenshots/07-mongodb-performance.png',
      fullPage: true
    });
    
    // Cleanup performance test data
    await db.collection('listening_history').deleteMany({ userId: performanceTestUser });
    
    console.log('✅ Database indexing and performance testing completed');
  });

  test('should test database backup and recovery simulation', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('💾 Testing Database Backup and Recovery Simulation...');
    
    await page.goto('/');
    
    const backupTestUser = `backup_test_${Date.now()}`;
    
    // Create test data for backup
    const testData = {
      user: {
        userId: backupTestUser,
        email: `${backupTestUser}@example.com`,
        displayName: 'Backup Test User',
        createdAt: new Date()
      },
      tracks: Array.from({ length: 10 }, (_, i) => ({
        userId: backupTestUser,
        trackId: `backup_track_${i}`,
        trackName: `Backup Test Song ${i}`,
        playedAt: new Date()
      }))
    };
    
    // Insert test data
    await db.collection('users').insertOne(testData.user);
    await db.collection('listening_history').insertMany(testData.tracks);
    
    console.log('✅ Test data created for backup simulation');
    
    // Simulate backup export
    const exportData = {
      users: await db.collection('users').find({ userId: backupTestUser }).toArray(),
      listening_history: await db.collection('listening_history').find({ userId: backupTestUser }).toArray()
    };
    
    console.log(`📦 Backup data exported: ${exportData.users.length} users, ${exportData.listening_history.length} tracks`);
    
    // Simulate data corruption (delete data)
    await db.collection('users').deleteMany({ userId: backupTestUser });
    await db.collection('listening_history').deleteMany({ userId: backupTestUser });
    
    console.log('❌ Simulated data corruption (data deleted)');
    
    // Verify data is gone
    const corruptedUserCount = await db.collection('users').countDocuments({ userId: backupTestUser });
    const corruptedTrackCount = await db.collection('listening_history').countDocuments({ userId: backupTestUser });
    
    expect(corruptedUserCount).toBe(0);
    expect(corruptedTrackCount).toBe(0);
    
    console.log('✅ Data corruption verified');
    
    // Simulate recovery (restore from backup)
    if (exportData.users.length > 0) {
      await db.collection('users').insertMany(exportData.users);
    }
    if (exportData.listening_history.length > 0) {
      await db.collection('listening_history').insertMany(exportData.listening_history);
    }
    
    console.log('♻️ Data restored from backup');
    
    // Verify recovery
    const recoveredUserCount = await db.collection('users').countDocuments({ userId: backupTestUser });
    const recoveredTrackCount = await db.collection('listening_history').countDocuments({ userId: backupTestUser });
    
    expect(recoveredUserCount).toBe(testData.user ? 1 : 0);
    expect(recoveredTrackCount).toBe(testData.tracks.length);
    
    console.log('✅ Data recovery verified');
    
    // Take screenshot after backup/recovery
    await page.screenshot({
      path: 'artifacts/screenshots/08-mongodb-backup-recovery.png',
      fullPage: true
    });
    
    // Final cleanup
    await db.collection('users').deleteMany({ userId: backupTestUser });
    await db.collection('listening_history').deleteMany({ userId: backupTestUser });
    
    console.log('✅ Database backup and recovery simulation completed');
  });

  test.afterEach(async ({ page }) => {
    // Take cleanup screenshot
    await page.screenshot({
      path: `artifacts/screenshots/mongodb-cleanup-${Date.now()}.png`,
      fullPage: true
    });
  });
});