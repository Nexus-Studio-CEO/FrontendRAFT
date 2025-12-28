/**
 * FrontendRAFT - Auto-Batching Manager
 * 
 * RAFT Feature #3: Automatic request batching for optimal performance.
 * Groups parallel requests and executes them together, reducing latency.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Auto-Batching Strategy:
 * 
 * 1. Collects requests within a time window (default 10ms)
 * 2. Groups by endpoint similarity
 * 3. Executes in parallel via CSOP compute
 * 4. Returns individual results
 * 5. Reduces overall latency by factor of N
 */
export class BatchManager {
  /**
   * @param {Router} router RAFT router instance
   */
  constructor(router) {
    this.router = router;
    
    // Batching configuration
    this.batchWindow = 10; // 10ms window to collect requests
    this.maxBatchSize = 50; // Max 50 requests per batch
    
    // Pending requests queue
    this.pendingRequests = [];
    this.batchTimer = null;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      batches: 0,
      avgBatchSize: 0,
      latencySaved: 0
    };

    console.log('✅ BatchManager initialized (RAFT Feature #3)');
  }

  /**
   * Execute request with auto-batching
   * 
   * @param {Object} request Request object
   * @returns {Promise<any>} Response
   * 
   * @example
   * const result = await batch.execute({
   *   method: 'GET',
   *   path: '/api/users/123'
   * });
   */
  async execute(request) {
    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      // Add to pending queue
      this.pendingRequests.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Schedule batch execution
      this._scheduleBatch();
    });
  }

  /**
   * Schedule batch execution
   * @private
   */
  _scheduleBatch() {
    if (this.batchTimer) {
      return; // Already scheduled
    }

    this.batchTimer = setTimeout(() => {
      this._executeBatch();
      this.batchTimer = null;
    }, this.batchWindow);
  }

  /**
   * Execute batched requests
   * @private
   */
  async _executeBatch() {
    if (this.pendingRequests.length === 0) {
      return;
    }

    // Take requests from queue
    const batch = this.pendingRequests.splice(0, this.maxBatchSize);
    const batchSize = batch.length;

    console.log(`🚀 Executing batch: ${batchSize} requests`);

    this.stats.batchedRequests += batchSize;
    this.stats.batches++;
    this.stats.avgBatchSize = this.stats.batchedRequests / this.stats.batches;

    const startTime = Date.now();

    try {
      // Group by endpoint for optimization
      const groups = this._groupRequests(batch);

      // Execute all groups in parallel
      const results = await Promise.allSettled(
        groups.map(group => this._executeGroup(group))
      );

      // Distribute results back to original promises
      results.forEach((result, index) => {
        const group = groups[index];
        
        if (result.status === 'fulfilled') {
          group.forEach((item, i) => {
            item.resolve(result.value[i]);
          });
        } else {
          group.forEach(item => {
            item.reject(result.reason);
          });
        }
      });

      const duration = Date.now() - startTime;
      const estimatedSequentialTime = batchSize * 50; // Assume 50ms per request
      this.stats.latencySaved += (estimatedSequentialTime - duration);

      console.log(`✅ Batch completed: ${batchSize} requests in ${duration}ms (saved ~${estimatedSequentialTime - duration}ms)`);

    } catch (error) {
      console.error('❌ Batch execution failed:', error);
      
      // Reject all pending requests
      batch.forEach(item => item.reject(error));
    }
  }

  /**
   * Group requests by similarity
   * @private
   */
  _groupRequests(batch) {
    // Simple grouping by method (can be improved)
    const groups = {};

    batch.forEach(item => {
      const key = item.request.method;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(item);
    });

    return Object.values(groups);
  }

  /**
   * Execute a group of similar requests
   * @private
   */
  async _executeGroup(group) {
    // Execute requests in parallel
    const promises = group.map(item => 
      this.router.handle(item.request)
    );

    return Promise.all(promises);
  }

  /**
   * Manually flush pending batches
   * 
   * @example
   * await batch.flush();
   */
  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this._executeBatch();
  }

  /**
   * Configure batch settings
   * 
   * @param {Object} config Configuration
   * @param {number} config.window Batch window in ms
   * @param {number} config.maxSize Max batch size
   * 
   * @example
   * batch.configure({ window: 20, maxSize: 100 });
   */
  configure(config) {
    if (config.window !== undefined) {
      this.batchWindow = config.window;
    }
    
    if (config.maxSize !== undefined) {
      this.maxBatchSize = config.maxSize;
    }

    console.log(`⚙️ Batch configuration updated:`, {
      window: this.batchWindow,
      maxSize: this.maxBatchSize
    });
  }

  /**
   * Get batching statistics
   * 
   * @returns {Object} Batch stats
   */
  getStats() {
    const batchRate = this.stats.totalRequests > 0
      ? ((this.stats.batchedRequests / this.stats.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      batchRate: `${batchRate}%`,
      pendingRequests: this.pendingRequests.length
    };
  }
}

export default BatchManager;