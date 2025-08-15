#!/usr/bin/env node

/**
 * Debug Redis connection with different URI formats
 */

const { createClient } = require('redis');

const testRedisFormats = [
    // User provided format
    'redis://copilot:a0a9588bce0ef7c71aba7242de502970bf94651c1fbd1ac569d0ece9a32287ef@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489',
    
    // Try with default user
    'redis://default:a0a9588bce0ef7c71aba7242de502970bf94651c1fbd1ac569d0ece9a32287ef@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489',
    
    // Try without username
    'redis://:a0a9588bce0ef7c71aba7242de502970bf94651c1fbd1ac569d0ece9a32287ef@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489'
];

async function testRedisConnection() {
    console.log('🔴 Testing Redis Connection Formats...\n');
    
    for (let i = 0; i < testRedisFormats.length; i++) {
        const uri = testRedisFormats[i];
        const username = uri.includes('://') ? uri.split('://')[1].split(':')[0] : 'N/A';
        
        console.log(`Testing format ${i + 1}: Username "${username}"`);
        
        try {
            const client = createClient({ url: uri });
            
            client.on('error', (err) => {
                console.log(`  ❌ Connection error: ${err.message}`);
            });
            
            await client.connect();
            const result = await client.ping();
            console.log(`  ✅ SUCCESS: Ping result = ${result}`);
            await client.quit();
            
            console.log(`  🎯 Working URI: ${uri}\n`);
            return uri;
            
        } catch (error) {
            console.log(`  ❌ FAILED: ${error.message}\n`);
        }
    }
    
    console.log('❌ All Redis connection formats failed');
    return null;
}

if (require.main === module) {
    testRedisConnection()
        .then(workingUri => {
            if (workingUri) {
                console.log('✅ Found working Redis URI format');
                process.exit(0);
            } else {
                console.log('❌ No working Redis URI found');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Redis test failed:', error);
            process.exit(1);
        });
}