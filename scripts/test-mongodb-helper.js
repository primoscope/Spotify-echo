#!/usr/bin/env node

/**
 * Simple MongoDB Connection Test Script
 * This is a helper for the validate-api-keys.js script
 */

const { MongoClient } = require('mongodb');

async function testMongoDB() {
    const mongoUri = process.argv[2];
    const requiredDatabase = process.argv[3] || 'echotune';
    
    if (!mongoUri) {
        console.log('ERROR: MongoDB URI not provided');
        process.exit(1);
    }

    const client = new MongoClient(mongoUri, { 
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        maxPoolSize: 10
    });
    
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        
        // Check if required database exists
        const db = client.db(requiredDatabase);
        const collections = await db.listCollections().toArray();
        
        // Look for spotify_analytics collection
        const spotifyAnalytics = collections.find(col => col.name === 'spotify_analytics');
        let documentCount = 0;
        if (spotifyAnalytics) {
            documentCount = await db.collection('spotify_analytics').countDocuments();
        }
        
        const result = {
            connection: 'SUCCESS',
            database: requiredDatabase,
            collections: collections.map(c => c.name),
            spotify_analytics_exists: !!spotifyAnalytics,
            spotify_analytics_count: documentCount,
            total_collections: collections.length
        };
        
        console.log('RESULT:' + JSON.stringify(result));
        await client.close();
        
    } catch (error) {
        console.log('ERROR: ' + error.message);
        await client.close();
        process.exit(1);
    }
}

testMongoDB();