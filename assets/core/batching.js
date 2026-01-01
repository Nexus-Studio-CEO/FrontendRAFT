/**
 * FrontendRAFT - Batch Manager
 * 
 * Automatically batches multiple requests for optimized performance
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class BatchManager {
    constructor() {
        this.pendingBatches = new Map();
        this.batchDelay = 50; // ms
        this.maxBatchSize = 50;
        this.stats = {
            totalRequests: 0,
            batchedRequests: 0,
            savedRoundtrips: 0
        };
    }

    /**
     * Add request to batch queue
     * @param {string} endpoint - API endpoint
     * @param {object} request - Request data
     * @returns {Promise} Resolves when batch completes
     */
    async addToBatch(endpoint, request) {
        this.stats.totalRequests++;
        
        if (!this.pendingBatches.has(endpoint)) {
            this.pendingBatches.set(endpoint, {
                requests: [],
                timeout: null,
                resolvers: []
            });
        }
        
        const batch = this.pendingBatches.get(endpoint);
        
        return new Promise((resolve, reject) => {
            batch.requests.push(request);
            batch.resolvers.push({ resolve, reject });
            
            // Clear existing timeout
            if (batch.timeout) {
                clearTimeout(batch.timeout);
            }
            
            // Execute batch if max size reached
            if (batch.requests.length >= this.maxBatchSize) {
                this._executeBatch(endpoint);
            } else {
                // Otherwise schedule batch execution
                batch.timeout = setTimeout(() => {
                    this._executeBatch(endpoint);
                }, this.batchDelay);
            }
        });
    }

    /**
     * Execute batched requests
     */
    async _executeBatch(endpoint) {
        const batch = this.pendingBatches.get(endpoint);
        if (!batch || batch.requests.length === 0) return;
        
        const requests = batch.requests;
        const resolvers = batch.resolvers;
        
        // Clear batch
        this.pendingBatches.delete(endpoint);
        
        const batchSize = requests.length;
        this.stats.batchedRequests += batchSize;
        this.stats.savedRoundtrips += (batchSize - 1);
        
        Logger.info(`BatchManager: Executing batch for "${endpoint}" (${batchSize} requests)`);
        
        try {
            // Execute all requests in parallel
            const results = await Promise.all(
                requests.map(req => this._executeRequest(endpoint, req))
            );
            
            // Resolve individual promises
            results.forEach((result, index) => {
                resolvers[index].resolve(result);
            });
            
        } catch (error) {
            Logger.error(`BatchManager: Batch execution failed: ${error.message}`);
            resolvers.forEach(r => r.reject(error));
        }
    }

    /**
     * Execute single request (to be overridden by Router)
     */
    async _executeRequest(endpoint, request) {
        // Placeholder - actual execution handled by Router
        return { success: true, data: request };
    }

    /**
     * Set request executor function
     */
    setExecutor(fn) {
        this._executeRequest = fn;
    }

    /**
     * Batch multiple operations of same type
     * @param {string} operation - Operation name
     * @param {Array} items - Items to process
     * @param {function} handler - Handler function for each item
     */
    async batchProcess(operation, items, handler) {
        const batchSize = 10;
        const results = [];
        
        Logger.info(`BatchManager: Processing ${items.length} items in batches of ${batchSize}`);
        
        for (let i = 0; i < items.length; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const chunkResults = await Promise.all(
                chunk.map(item => handler(item))
            );
            results.push(...chunkResults);
        }
        
        return results;
    }

    /**
     * Get batching statistics
     */
    getStats() {
        const efficiency = this.stats.totalRequests > 0
            ? ((this.stats.savedRoundtrips / this.stats.totalRequests) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            efficiency: `${efficiency}%`,
            activeBatches: this.pendingBatches.size
        };
    }

    /**
     * DataLoader-like pattern for deduplication
     */
    createLoader(loadFn, options = {}) {
        const cache = new Map();
        const pending = new Map();
        const batchDelay = options.batchDelay || 10;
        
        return async (key) => {
            // Check cache
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            // Check if already pending
            if (pending.has(key)) {
                return pending.get(key);
            }
            
            // Create new promise
            const promise = new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        const result = await loadFn(key);
                        cache.set(key, result);
                        pending.delete(key);
                        resolve(result);
                    } catch (error) {
                        pending.delete(key);
                        reject(error);
                    }
                }, batchDelay);
            });
            
            pending.set(key, promise);
            return promise;
        };
    }

    /**
     * Clear pending batches
     */
    clearPending() {
        this.pendingBatches.forEach((batch, endpoint) => {
            if (batch.timeout) {
                clearTimeout(batch.timeout);
            }
        });
        this.pendingBatches.clear();
        Logger.info('BatchManager: Cleared all pending batches');
    }
}

// Global instance
window.BatchManager = new BatchManager();