#!/usr/bin/env node

/**
 * Browserbase API Debug Test
 * Detailed testing of Browserbase API with enhanced error handling
 */

const API_KEY = 'bb_live_P4BWp-i1Atz_NMBWXr521kxcrXw';
const PROJECT_ID = 'df31bafd-8541-40f2-80a8-2f6ea30df60e';

async function debugBrowserbaseAPI() {
    console.log('🔍 Debugging Browserbase API...');
    console.log(`API Key: ${API_KEY.substring(0, 15)}...${API_KEY.substring(API_KEY.length - 10)}`);
    console.log(`Project ID: ${PROJECT_ID}`);
    console.log();

    try {
        // Test 1: Check API root/health
        console.log('1. Testing API root endpoint...');
        const rootResponse = await fetch('https://api.browserbase.com/', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`   Status: ${rootResponse.status} ${rootResponse.statusText}`);
        
        // Test 2: Check account/user endpoint
        console.log('\n2. Testing account endpoint...');
        const accountResponse = await fetch('https://api.browserbase.com/v1/account', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`   Status: ${accountResponse.status} ${accountResponse.statusText}`);
        
        if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            console.log(`   Account data:`, JSON.stringify(accountData, null, 2));
        } else {
            const errorText = await accountResponse.text();
            console.log(`   Error: ${errorText}`);
        }

        // Test 3: Check projects endpoint
        console.log('\n3. Testing projects endpoint...');
        const projectsResponse = await fetch('https://api.browserbase.com/v1/projects', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`   Status: ${projectsResponse.status} ${projectsResponse.statusText}`);
        
        if (projectsResponse.ok) {
            const projects = await projectsResponse.json();
            console.log(`   Projects found: ${Array.isArray(projects) ? projects.length : 'N/A'}`);
            if (Array.isArray(projects)) {
                projects.forEach((project, index) => {
                    console.log(`   Project ${index + 1}: ${project.id} - ${project.name || 'Unnamed'}`);
                    if (project.id === PROJECT_ID) {
                        console.log(`   ✅ Target project ID found!`);
                    }
                });
                
                if (!projects.some(p => p.id === PROJECT_ID)) {
                    console.log(`   ⚠️ Target project ID ${PROJECT_ID} not found in projects`);
                }
            }
        } else {
            const errorText = await projectsResponse.text();
            console.log(`   Error: ${errorText}`);
        }

        // Test 4: Try session creation with minimal config
        console.log('\n4. Testing minimal session creation...');
        const sessionResponse = await fetch('https://api.browserbase.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectId: PROJECT_ID
            })
        });
        console.log(`   Status: ${sessionResponse.status} ${sessionResponse.statusText}`);
        
        if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log(`   Session created: ${sessionData.id}`);
            
            // Clean up session
            if (sessionData.id) {
                const deleteResponse = await fetch(`https://api.browserbase.com/v1/sessions/${sessionData.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`
                    }
                });
                console.log(`   Session cleanup: ${deleteResponse.status} ${deleteResponse.statusText}`);
            }
        } else {
            const errorText = await sessionResponse.text();
            console.log(`   Error: ${errorText}`);
            
            // Check for specific error types
            if (errorText.includes('quota') || errorText.includes('limit') || sessionResponse.status === 402) {
                console.log('   📝 Note: This appears to be a quota/billing limitation (free plan)');
            }
            if (errorText.includes('project') || errorText.includes('not found')) {
                console.log('   📝 Note: This appears to be a project ID issue');
            }
        }

        // Test 5: Check authentication method variations
        console.log('\n5. Testing alternative auth header format...');
        const altAuthResponse = await fetch('https://api.browserbase.com/v1/projects', {
            headers: {
                'x-bb-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log(`   Alt auth status: ${altAuthResponse.status} ${altAuthResponse.statusText}`);

    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
    }

    console.log('\n✅ Browserbase debug test completed');
}

// Run if called directly
if (require.main === module) {
    debugBrowserbaseAPI();
}

module.exports = { debugBrowserbaseAPI };