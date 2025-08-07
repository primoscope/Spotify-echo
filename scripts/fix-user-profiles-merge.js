#!/usr/bin/env node

/**
 * Fix User Profiles Merge Issue and Complete Final Merge
 * 
 * This script addresses the duplicate key error in user_profiles merge
 * and completes the remaining merge operations
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

class UserProfileMergeFix {
    constructor() {
        this.connectionString = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        this.client = null;
        
        this.results = {
            timestamp: new Date().toISOString(),
            operations: [],
            user_profiles_merged: 0,
            errors_fixed: 0
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '✅',
            warn: '⚠️',
            error: '❌',
            success: '🎉'
        };
        console.log(`${prefix[level]} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
    }

    async connect() {
        try {
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 15000,
                maxPoolSize: 10
            });
            await this.client.connect();
            this.log('Connected to MongoDB Atlas', 'success');
            return true;
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async fixUserProfilesMerge() {
        try {
            this.log('Fixing user profiles merge issue...', 'info');
            
            const sourceCollection = this.client.db('spotify_analytics').collection('user_profiles');
            const targetCollection = this.client.db('echotune').collection('echotune_user_preferences');
            
            // Get all source documents
            const userProfiles = await sourceCollection.find({}).toArray();
            this.log(`Found ${userProfiles.length} user profiles to merge`, 'info');
            
            let mergedCount = 0;
            let skippedCount = 0;
            
            for (const profile of userProfiles) {
                try {
                    // Transform the document to avoid null userId issues
                    const transformedProfile = {
                        ...profile,
                        user_id: profile.userId || profile._id.toString(),
                        source_db: 'spotify_analytics',
                        source_collection: 'user_profiles',
                        merged_at: new Date()
                    };
                    
                    // Remove the problematic userId field if it's null
                    if (!transformedProfile.userId) {
                        delete transformedProfile.userId;
                    }
                    
                    // Check if user already exists
                    const existing = await targetCollection.findOne({ 
                        user_id: transformedProfile.user_id 
                    });
                    
                    if (existing) {
                        this.log(`  Skipping duplicate user_id: ${transformedProfile.user_id}`, 'warn');
                        skippedCount++;
                        continue;
                    }
                    
                    // Insert the transformed document
                    await targetCollection.insertOne(transformedProfile);
                    mergedCount++;
                    this.log(`  Merged user profile: ${transformedProfile.user_id}`, 'info');
                    
                } catch (error) {
                    this.log(`  Error merging profile ${profile._id}: ${error.message}`, 'warn');
                }
            }
            
            this.results.user_profiles_merged = mergedCount;
            this.results.operations.push({
                operation: 'user_profiles_merge_fix',
                merged: mergedCount,
                skipped: skippedCount,
                status: 'success'
            });
            
            this.log(`User profiles merge complete: ${mergedCount} merged, ${skippedCount} skipped`, 'success');
            
            return { merged: mergedCount, skipped: skippedCount };
            
        } catch (error) {
            this.log(`User profiles merge failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateFinalSummary() {
        try {
            this.log('Generating final merge summary...', 'info');
            
            // Get current state of echotune collections
            const collections = [
                'echotune_listening_history',
                'echotune_chat_sessions', 
                'echotune_user_preferences',
                'spotify_analytics'
            ];
            
            const summary = {
                timestamp: new Date().toISOString(),
                database: 'echotune',
                collections: {}
            };
            
            for (const collectionName of collections) {
                const collection = this.client.db('echotune').collection(collectionName);
                const count = await collection.countDocuments();
                
                // Get sample document to analyze structure
                const sample = await collection.findOne({});
                
                summary.collections[collectionName] = {
                    document_count: count,
                    has_data: count > 0,
                    sample_structure: sample ? Object.keys(sample).length : 0
                };
                
                this.log(`  ${collectionName}: ${count.toLocaleString()} documents`, 'info');
            }
            
            // Calculate total comprehensive dataset size
            const totalDocuments = Object.values(summary.collections)
                .reduce((sum, coll) => sum + coll.document_count, 0);
            
            summary.total_documents = totalDocuments;
            summary.comprehensive_dataset_ready = totalDocuments > 200000;
            
            // Save summary report
            fs.writeFileSync(
                '/home/runner/work/Spotify-echo/Spotify-echo/FINAL_MERGE_SUMMARY.json',
                JSON.stringify(summary, null, 2)
            );
            
            this.log(`Final summary: ${totalDocuments.toLocaleString()} total documents in echotune database`, 'success');
            this.log(`Comprehensive dataset status: ${summary.comprehensive_dataset_ready ? 'READY' : 'NEEDS MORE DATA'}`, 
                summary.comprehensive_dataset_ready ? 'success' : 'warn');
            
            return summary;
            
        } catch (error) {
            this.log(`Summary generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.log('Database connection closed', 'info');
        }
    }

    async performFix() {
        try {
            this.log('Starting user profiles merge fix...', 'success');
            
            const connected = await this.connect();
            if (!connected) throw new Error('Connection failed');
            
            await this.fixUserProfilesMerge();
            const summary = await this.generateFinalSummary();
            
            this.log('User profiles merge fix completed successfully!', 'success');
            this.log('='.repeat(60), 'info');
            this.log(`🎉 User Profiles Merged: ${this.results.user_profiles_merged}`, 'success');
            this.log(`📊 Total Documents in echotune: ${summary.total_documents.toLocaleString()}`, 'success');
            this.log(`🚀 Dataset Status: ${summary.comprehensive_dataset_ready ? 'READY FOR PRODUCTION' : 'NEEDS ENHANCEMENT'}`, 'success');
            
            return this.results;
            
        } catch (error) {
            this.log(`Fix operation failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

if (require.main === module) {
    const fixer = new UserProfileMergeFix();
    fixer.performFix()
        .then(() => {
            console.log('\nUser profiles merge fix completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fix failed:', error);
            process.exit(1);
        });
}

module.exports = UserProfileMergeFix;