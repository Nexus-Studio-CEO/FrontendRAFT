/**
 * FrontendRAFT - Auto-Batching Manager
 * 
 * Automatic request batching for performance - Feature #3
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class BatchManager {
  constructor(config = {}) {
    this.batchWindow = config.batchWindow || 50;
    this.maxBatchSize = config.maxBatchSize || 10;
    this.enabled = config.enabled !== false;
    
    this.pendingRequests = [];
    this.batchTimer = null;
    this.batchCount = 0;
  }

  async add(request) {
    if (!this.enabled) {
      return this._executeSingle(request);
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        request,
        resolve,
        reject,
        addedAt: Date.now()
      });

      if (this.pendingRequests.length >= this.maxBatchSize) {
        this._flush();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this._flush(), this.batchWindow);
      }
    });
  }

  async _flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.pendingRequests.length === 0) {
      return;
    }

    const batch = this.pendingRequests.splice(0, this.maxBatchSize);
    this.batchCount++;

    const batchId = `batch_${this.batchCount}_${Date.now()}`;

    try {
      const results = await this._executeBatch(batchId, batch.map(b => b.request));

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const result = results[i];

        if (result.error) {
          item.reject(new Error(result.error));
        } else {
          item.resolve(result.data);
        }
      }
    } catch (error) {
      for (const item of batch) {
        item.reject(error);
      }
    }

    if (this.pendingRequests.length > 0) {
      this.batchTimer = setTimeout(() => this._flush(), this.batchWindow);
    }
  }

  async _executeBatch(batchId, requests) {
    const results = await Promise.allSettled(
      requests.map(req => this._executeSingle(req))
    );

    return results.map(result => ({
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  async _executeSingle(request) {
    if (typeof request.handler === 'function') {
      return await request.handler(request);
    }
    throw new Error('Invalid request: handler must be a function');
  }

  flush() {
    return this._flush();
  }

  clear() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    for (const item of this.pendingRequests) {
      item.reject(new Error('Batch cleared'));
    }

    this.pendingRequests = [];
  }

  getStats() {
    return {
      enabled: this.enabled,
      batchWindow: this.batchWindow,
      maxBatchSize: this.maxBatchSize,
      pendingRequests: this.pendingRequests.length,
      totalBatches: this.batchCount,
      hasPendingBatch: this.batchTimer !== null
    };
  }

  setPriority(request, priority) {
    const index = this.pendingRequests.findIndex(
      item => item.request.id === request.id
    );

    if (index !== -1) {
      const item = this.pendingRequests.splice(index, 1)[0];
      
      if (priority === 'high') {
        this.pendingRequests.unshift(item);
      } else {
        this.pendingRequests.push(item);
      }
    }
  }

  async executeDeduplicated(requests) {
    const uniqueKeys = new Map();
    
    for (const req of requests) {
      const key = this._getRequestKey(req);
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, req);
      }
    }

    const uniqueRequests = Array.from(uniqueKeys.values());
    const results = await this._executeBatch(`dedup_${Date.now()}`, uniqueRequests);

    return results;
  }

  _getRequestKey(request) {
    return `${request.method}:${request.path}:${JSON.stringify(request.body || {})}`;
  }
}