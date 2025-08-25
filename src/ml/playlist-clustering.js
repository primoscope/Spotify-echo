/**
 * Playlist Clustering for Music Analysis
 * Implements K-means and HDBSCAN clustering for playlist and track grouping
 */

const mongoManager = require('../database/mongodb');

class PlaylistClusterer {
  constructor() {
    this.audioFeatures = [
      'danceability', 'energy', 'valence', 'acousticness',
      'instrumentalness', 'speechiness', 'liveness', 'tempo'
    ];
    this.clusters = new Map();
    this.clusterLabels = new Map();
  }

  /**
   * Cluster tracks using K-means algorithm
   */
  async clusterTracks(trackIds, options = {}) {
    const {
      k = 5,
      algorithm = 'kmeans',
      maxIterations = 100,
      tolerance = 0.0001,
      generateLabels = true,
    } = options;

    console.log(`🎯 Clustering ${trackIds.length} tracks using ${algorithm}...`);

    try {
      // Get audio features for tracks
      const features = await this.getAudioFeatures(trackIds);
      if (features.length === 0) {
        throw new Error('No audio features found for provided tracks');
      }

      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);

      // Apply clustering algorithm
      let clusterResults;
      if (algorithm === 'kmeans') {
        clusterResults = await this.kMeansClustering(normalizedFeatures, k, maxIterations, tolerance);
      } else if (algorithm === 'hdbscan') {
        clusterResults = await this.hdbscanClustering(normalizedFeatures, options);
      } else {
        throw new Error(`Unsupported clustering algorithm: ${algorithm}`);
      }

      // Generate cluster labels if requested
      if (generateLabels) {
        await this.generateClusterLabels(clusterResults);
      }

      // Store results
      const clusterId = this.generateClusterId();
      this.clusters.set(clusterId, clusterResults);

      console.log(`✅ Clustering complete! Generated ${clusterResults.centroids.length} clusters`);
      
      return {
        clusterId,
        clusters: clusterResults.clusters,
        centroids: clusterResults.centroids,
        labels: clusterResults.labels || [],
        metrics: this.calculateClusteringMetrics(clusterResults),
      };
    } catch (error) {
      console.error('❌ Clustering failed:', error);
      throw error;
    }
  }

  /**
   * Get audio features for tracks from database
   */
  async getAudioFeatures(trackIds) {
    const db = mongoManager.getDb();
    const audioFeaturesCollection = db.collection('audio_features');

    const features = await audioFeaturesCollection.find({
      track_id: { $in: trackIds },
    }).toArray();

    return features.map(feature => ({
      track_id: feature.track_id,
      features: this.audioFeatures.map(f => feature[f] || 0),
    }));
  }

  /**
   * Normalize features using min-max normalization
   */
  normalizeFeatures(trackFeatures) {
    const featureCount = this.audioFeatures.length;
    const mins = new Array(featureCount).fill(Infinity);
    const maxs = new Array(featureCount).fill(-Infinity);

    // Find min and max for each feature
    trackFeatures.forEach(track => {
      track.features.forEach((value, index) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    });

    // Normalize features
    return trackFeatures.map(track => ({
      track_id: track.track_id,
      features: track.features.map((value, index) => {
        const range = maxs[index] - mins[index];
        return range > 0 ? (value - mins[index]) / range : 0;
      }),
    }));
  }

  /**
   * K-means clustering implementation
   */
  async kMeansClustering(normalizedFeatures, k, maxIterations, tolerance) {
    const points = normalizedFeatures.map(track => track.features);
    const featureCount = points[0].length;

    // Initialize centroids randomly
    let centroids = this.initializeRandomCentroids(k, featureCount);
    let assignments = new Array(points.length);
    let converged = false;

    for (let iteration = 0; iteration < maxIterations && !converged; iteration++) {
      // Assign points to nearest centroids
      const newAssignments = points.map(point => 
        this.findNearestCentroid(point, centroids)
      );

      // Update centroids
      const newCentroids = this.updateCentroids(points, newAssignments, k);

      // Check convergence
      converged = this.checkConvergence(centroids, newCentroids, tolerance);

      assignments = newAssignments;
      centroids = newCentroids;

      if (iteration % 10 === 0) {
        console.log(`K-means iteration ${iteration}, converged: ${converged}`);
      }
    }

    // Group tracks by cluster
    const clusters = this.groupTracksByClusters(normalizedFeatures, assignments, k);

    return {
      clusters,
      centroids,
      assignments,
      algorithm: 'kmeans',
      iterations: maxIterations,
    };
  }

  /**
   * HDBSCAN clustering implementation (simplified version)
   */
  async hdbscanClustering(normalizedFeatures, options = {}) {
    const { minClusterSize = 5, minSamples = 3 } = options;
    
    // For this implementation, we'll use a simplified density-based approach
    // In production, you would use a proper HDBSCAN library
    
    const points = normalizedFeatures.map(track => track.features);
    const distances = this.calculateDistanceMatrix(points);
    
    // Find dense regions using density estimation
    const clusters = this.findDenseClusters(normalizedFeatures, distances, minClusterSize, minSamples);
    
    return {
      clusters,
      centroids: this.calculateClusterCentroids(clusters),
      algorithm: 'hdbscan',
      minClusterSize,
      minSamples,
    };
  }

  /**
   * Initialize random centroids
   */
  initializeRandomCentroids(k, featureCount) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const centroid = [];
      for (let j = 0; j < featureCount; j++) {
        centroid.push(Math.random());
      }
      centroids.push(centroid);
    }
    return centroids;
  }

  /**
   * Find nearest centroid for a point
   */
  findNearestCentroid(point, centroids) {
    let minDistance = Infinity;
    let nearestIndex = 0;

    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * Update centroids based on assigned points
   */
  updateCentroids(points, assignments, k) {
    const centroids = [];
    
    for (let cluster = 0; cluster < k; cluster++) {
      const clusterPoints = points.filter((_, index) => assignments[index] === cluster);
      
      if (clusterPoints.length === 0) {
        // Keep the old centroid if no points assigned
        centroids.push(new Array(points[0].length).fill(0));
        continue;
      }

      const centroid = new Array(points[0].length).fill(0);
      clusterPoints.forEach(point => {
        point.forEach((value, index) => {
          centroid[index] += value;
        });
      });

      // Average the coordinates
      centroid.forEach((_, index) => {
        centroid[index] /= clusterPoints.length;
      });

      centroids.push(centroid);
    }

    return centroids;
  }

  /**
   * Check if centroids have converged
   */
  checkConvergence(oldCentroids, newCentroids, tolerance) {
    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = this.euclideanDistance(oldCentroids[i], newCentroids[i]);
      if (distance > tolerance) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Group tracks by their cluster assignments
   */
  groupTracksByClusters(tracks, assignments, k) {
    const clusters = [];
    
    for (let cluster = 0; cluster < k; cluster++) {
      const clusterTracks = [];
      assignments.forEach((assignment, index) => {
        if (assignment === cluster) {
          clusterTracks.push(tracks[index]);
        }
      });
      clusters.push(clusterTracks);
    }

    return clusters;
  }

  /**
   * Calculate distance matrix for all points
   */
  calculateDistanceMatrix(points) {
    const n = points.length;
    const distances = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.euclideanDistance(points[i], points[j]);
        distances[i][j] = distance;
        distances[j][i] = distance;
      }
    }
    
    return distances;
  }

  /**
   * Find dense clusters using simplified density-based approach
   */
  findDenseClusters(tracks, distances, minClusterSize, minSamples) {
    const n = tracks.length;
    const visited = new Array(n).fill(false);
    const clusters = [];
    
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      
      const cluster = this.expandCluster(i, tracks, distances, visited, minClusterSize, minSamples);
      if (cluster.length >= minClusterSize) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  /**
   * Expand cluster from a seed point
   */
  expandCluster(seedIndex, tracks, distances, visited, minClusterSize, minSamples) {
    const cluster = [tracks[seedIndex]];
    visited[seedIndex] = true;
    
    const neighbors = this.getNeighbors(seedIndex, distances, 0.2); // 0.2 is the epsilon distance
    
    for (const neighborIndex of neighbors) {
      if (!visited[neighborIndex]) {
        visited[neighborIndex] = true;
        cluster.push(tracks[neighborIndex]);
        
        const neighborNeighbors = this.getNeighbors(neighborIndex, distances, 0.2);
        if (neighborNeighbors.length >= minSamples) {
          neighbors.push(...neighborNeighbors.filter(n => !visited[n]));
        }
      }
    }
    
    return cluster;
  }

  /**
   * Get neighbors within epsilon distance
   */
  getNeighbors(pointIndex, distances, epsilon) {
    const neighbors = [];
    for (let i = 0; i < distances[pointIndex].length; i++) {
      if (i !== pointIndex && distances[pointIndex][i] <= epsilon) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  /**
   * Calculate centroids for clusters
   */
  calculateClusterCentroids(clusters) {
    return clusters.map(cluster => {
      if (cluster.length === 0) return [];
      
      const featureCount = cluster[0].features.length;
      const centroid = new Array(featureCount).fill(0);
      
      cluster.forEach(track => {
        track.features.forEach((value, index) => {
          centroid[index] += value;
        });
      });
      
      return centroid.map(sum => sum / cluster.length);
    });
  }

  /**
   * Generate cluster labels using LLM
   */
  async generateClusterLabels(clusterResults) {
    const { AgentRouter } = require('../ai/agent/router');
    const router = new AgentRouter();
    
    const labels = [];
    
    for (let i = 0; i < clusterResults.clusters.length; i++) {
      const cluster = clusterResults.clusters[i];
      if (cluster.length === 0) {
        labels.push(`Empty Cluster ${i}`);
        continue;
      }

      try {
        // Calculate cluster characteristics
        const characteristics = this.analyzeClusterCharacteristics(cluster, clusterResults.centroids[i]);
        
        // Generate label using AI
        const prompt = `Based on these music characteristics, generate a short, descriptive label for this cluster:
        
Cluster characteristics:
${characteristics}

Generate a 2-3 word label that describes the musical style or mood of this cluster (e.g., "Energetic Dance", "Mellow Acoustic", "Upbeat Pop"):`;

        const response = await router.route(prompt, { strategy: 'low-cost' });
        const label = response.content?.trim() || `Cluster ${i}`;
        labels.push(label);
        
        console.log(`🏷️ Generated label for cluster ${i}: "${label}"`);
      } catch (error) {
        console.warn(`⚠️ Failed to generate label for cluster ${i}:`, error.message);
        labels.push(`Music Cluster ${i}`);
      }
    }
    
    clusterResults.labels = labels;
    return labels;
  }

  /**
   * Analyze cluster characteristics for label generation
   */
  analyzeClusterCharacteristics(cluster, centroid) {
    const characteristics = [];
    
    // Analyze centroid values
    this.audioFeatures.forEach((feature, index) => {
      const value = centroid[index];
      let description = '';
      
      switch (feature) {
        case 'danceability':
          description = value > 0.7 ? 'Very Danceable' : value > 0.5 ? 'Danceable' : 'Less Danceable';
          break;
        case 'energy':
          description = value > 0.7 ? 'High Energy' : value > 0.5 ? 'Medium Energy' : 'Low Energy';
          break;
        case 'valence':
          description = value > 0.7 ? 'Very Positive' : value > 0.5 ? 'Positive' : value > 0.3 ? 'Neutral' : 'Melancholic';
          break;
        case 'acousticness':
          description = value > 0.7 ? 'Very Acoustic' : value > 0.5 ? 'Acoustic' : 'Electric';
          break;
        case 'instrumentalness':
          description = value > 0.5 ? 'Instrumental' : 'Vocal';
          break;
        case 'tempo':
          description = value > 0.8 ? 'Very Fast' : value > 0.6 ? 'Fast' : value > 0.4 ? 'Medium' : 'Slow';
          break;
      }
      
      if (description) {
        characteristics.push(`${feature}: ${description} (${value.toFixed(2)})`);
      }
    });
    
    return characteristics.join('\n');
  }

  /**
   * Calculate clustering quality metrics
   */
  calculateClusteringMetrics(clusterResults) {
    const metrics = {
      silhouetteScore: this.calculateSilhouetteScore(clusterResults),
      intraClusterVariance: this.calculateIntraClusterVariance(clusterResults),
      interClusterDistance: this.calculateInterClusterDistance(clusterResults),
      clusterSizes: clusterResults.clusters.map(cluster => cluster.length),
    };

    return metrics;
  }

  /**
   * Calculate silhouette score (simplified)
   */
  calculateSilhouetteScore(clusterResults) {
    // Simplified silhouette score calculation
    // In production, you would implement the full silhouette analysis
    const { clusters } = clusterResults;
    
    if (clusters.length <= 1) return 0;
    
    let totalScore = 0;
    let totalPoints = 0;
    
    clusters.forEach((cluster, clusterIndex) => {
      cluster.forEach(point => {
        const a = this.averageIntraClusterDistance(point, cluster);
        const b = this.averageNearestClusterDistance(point, clusters, clusterIndex);
        
        const silhouette = b > a ? (b - a) / Math.max(a, b) : 0;
        totalScore += silhouette;
        totalPoints++;
      });
    });
    
    return totalPoints > 0 ? totalScore / totalPoints : 0;
  }

  /**
   * Calculate average intra-cluster distance
   */
  averageIntraClusterDistance(point, cluster) {
    if (cluster.length <= 1) return 0;
    
    let totalDistance = 0;
    let count = 0;
    
    cluster.forEach(otherPoint => {
      if (point !== otherPoint) {
        totalDistance += this.euclideanDistance(point.features, otherPoint.features);
        count++;
      }
    });
    
    return count > 0 ? totalDistance / count : 0;
  }

  /**
   * Calculate average distance to nearest cluster
   */
  averageNearestClusterDistance(point, clusters, excludeClusterIndex) {
    let minDistance = Infinity;
    
    clusters.forEach((cluster, clusterIndex) => {
      if (clusterIndex === excludeClusterIndex) return;
      
      let totalDistance = 0;
      cluster.forEach(otherPoint => {
        totalDistance += this.euclideanDistance(point.features, otherPoint.features);
      });
      
      const avgDistance = cluster.length > 0 ? totalDistance / cluster.length : Infinity;
      minDistance = Math.min(minDistance, avgDistance);
    });
    
    return minDistance === Infinity ? 0 : minDistance;
  }

  /**
   * Calculate intra-cluster variance
   */
  calculateIntraClusterVariance(clusterResults) {
    const { clusters, centroids } = clusterResults;
    
    let totalVariance = 0;
    
    clusters.forEach((cluster, index) => {
      const centroid = centroids[index];
      
      cluster.forEach(point => {
        const distance = this.euclideanDistance(point.features, centroid);
        totalVariance += distance * distance;
      });
    });
    
    return totalVariance;
  }

  /**
   * Calculate inter-cluster distance
   */
  calculateInterClusterDistance(clusterResults) {
    const { centroids } = clusterResults;
    
    if (centroids.length <= 1) return 0;
    
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      for (let j = i + 1; j < centroids.length; j++) {
        totalDistance += this.euclideanDistance(centroids[i], centroids[j]);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Generate unique cluster ID
   */
  generateClusterId() {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get cluster results by ID
   */
  getClusterResults(clusterId) {
    return this.clusters.get(clusterId);
  }

  /**
   * Save clustering results to database
   */
  async saveClusteringResults(clusterId, results, metadata = {}) {
    const db = mongoManager.getDb();
    const clusteringCollection = db.collection('clustering_results');

    const document = {
      cluster_id: clusterId,
      timestamp: new Date(),
      results,
      metadata,
      version: process.env.npm_package_version || '1.0.0',
    };

    await clusteringCollection.insertOne(document);
    console.log(`💾 Clustering results saved with ID: ${clusterId}`);
  }
}

module.exports = PlaylistClusterer;