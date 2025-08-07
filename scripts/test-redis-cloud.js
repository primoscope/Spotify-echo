#!/usr/bin/env node

/**
 * Redis Cloud Test Script
 * Tests connection to Redis Cloud with provided credentials
 */

const { createClient } = require('redis');

async function testRedisCloud() {
    console.log('🔗 Testing Redis Cloud Connection...\n');
    
    let client;
    try {
        // Redis Cloud configuration from user
        client = createClient({
            username: 'default',
            password: 'AQf4uK2hFoEH4qHAZg3v4Qy7GCWf6J7K',
            socket: {
                host: 'redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com',
                port: 15489
            }
        });

        client.on('error', err => console.log('Redis Client Error', err));
        client.on('connect', () => console.log('✅ Connected to Redis Cloud'));
        client.on('ready', () => console.log('🚀 Redis Cloud ready'));

        console.log('🔌 Connecting to Redis Cloud...');
        await client.connect();

        console.log('🧪 Testing basic operations...');

        // Test basic set/get
        await client.set('test:connection', 'Hello EchoTune AI!');
        const result = await client.get('test:connection');
        console.log('✅ Basic test result:', result);

        // Test music-specific operations
        console.log('🎵 Testing music-specific caching...');
        
        const audioFeatures = {
            danceability: 0.735,
            energy: 0.578,
            key: 0,
            loudness: -11.840,
            mode: 1,
            speechiness: 0.0461,
            acousticness: 0.514,
            instrumentalness: 0.0902,
            liveness: 0.159,
            valence: 0.636,
            tempo: 98.002,
            duration_ms: 207000
        };

        await client.setEx('echotune:audio_features:test_track_123', 3600, JSON.stringify(audioFeatures));
        const cachedFeatures = await client.get('echotune:audio_features:test_track_123');
        const parsedFeatures = JSON.parse(cachedFeatures);
        
        console.log('✅ Audio features cached successfully');
        console.log('   Danceability:', parsedFeatures.danceability);
        console.log('   Energy:', parsedFeatures.energy);
        console.log('   Tempo:', parsedFeatures.tempo);

        // Test recommendations
        const recommendations = [
            { track_id: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC', score: 0.95, artist: 'Never Gonna Give You Up' },
            { track_id: 'spotify:track:7GhIk7Il098yCjg4BQjzvb', score: 0.88, artist: 'Bohemian Rhapsody' },
            { track_id: 'spotify:track:4VqPOruhp5EdPBeR92t6lQ', score: 0.82, artist: 'Uptown Funk' }
        ];

        await client.setEx('echotune:recommendations:test_user_456', 1800, JSON.stringify(recommendations));
        const cachedRecs = await client.get('echotune:recommendations:test_user_456');
        const parsedRecs = JSON.parse(cachedRecs);
        
        console.log('✅ Recommendations cached successfully');
        console.log(`   Found ${parsedRecs.length} recommendations`);
        console.log(`   Top recommendation: ${parsedRecs[0].artist} (score: ${parsedRecs[0].score})`);

        // Test user session
        const sessionData = {
            userId: 'user_12345',
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresAt: Date.now() + 3600000,
            preferences: {
                genres: ['pop', 'rock', 'electronic'],
                mood: 'energetic'
            }
        };

        await client.setEx('echotune:session:sess_789', 86400, JSON.stringify(sessionData));
        const cachedSession = await client.get('echotune:session:sess_789');
        const parsedSession = JSON.parse(cachedSession);
        
        console.log('✅ Session cached successfully');
        console.log(`   User: ${parsedSession.userId}`);
        console.log(`   Preferences: ${parsedSession.preferences.genres.join(', ')}`);

        // Performance test
        console.log('⚡ Running performance test...');
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
            await client.set(`perf_test:${i}`, `value_${i}`);
        }
        const writeTime = Date.now() - start;

        const readStart = Date.now();
        for (let i = 0; i < 100; i++) {
            await client.get(`perf_test:${i}`);
        }
        const readTime = Date.now() - readStart;

        console.log(`✅ Performance test completed`);
        console.log(`   100 writes: ${writeTime}ms (${(writeTime/100).toFixed(1)}ms avg)`);
        console.log(`   100 reads: ${readTime}ms (${(readTime/100).toFixed(1)}ms avg)`);

        // Cleanup test data
        console.log('🧹 Cleaning up test data...');
        const keys = await client.keys('test:*');
        const keys2 = await client.keys('echotune:*test*');
        const keys3 = await client.keys('perf_test:*');
        
        const allKeys = [...keys, ...keys2, ...keys3];
        if (allKeys.length > 0) {
            await client.del(allKeys);
            console.log(`✅ Cleaned up ${allKeys.length} test keys`);
        }

        // Final ping test
        const pong = await client.ping();
        console.log('✅ Final ping test:', pong);

        console.log('\n🎉 Redis Cloud connection test completed successfully!');
        console.log('✅ Redis Cloud is ready for production use with EchoTune AI\n');

    } catch (error) {
        console.error('❌ Redis Cloud test failed:', error.message);
        if (error.code) {
            console.error('   Error code:', error.code);
        }
        process.exit(1);
    } finally {
        if (client) {
            await client.quit();
            console.log('🔌 Disconnected from Redis Cloud');
        }
    }
}

// Run the test
if (require.main === module) {
    testRedisCloud();
}

module.exports = testRedisCloud;