/**
 * FrontendRAFT - Batch Manager
 * 
 * Automatic request batching to reduce network overhead.
 * RAFT Feature #3: Auto-Batching
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { BatchRequest, BatchResponse, BatchOptions, HTTPMethod } from '../types';
import type { Router } from './Router';

export class BatchManager {
  private router: Router;
  private pendingBatch: Map<string, {
    request: BatchRequest;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = new Map();
  private batchTimer: any = null;
  private config: Required<BatchOptions>;
  private stats = { totalRequests: 0, batchedRequests: 0, batches: 0, averageBatchSize: 0 };

  constructor(router: Router, options?: BatchOptions) {
    this.router = router;
    this.config = {
      maxBatchSize: options?.maxBatchSize ?? 50,
      batchWindowMs: options?.batchWindowMs ?? 10
    };
  }

  async fetch(method: HTTPMethod, path: string, body?: any): Promise<any> {
    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      this.pendingBatch.set(requestId, {
        request: { id: requestId, method, path, body },
        resolve,
        reject
      });

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.executeBatch(), this.config.batchWindowMs);
      }

      if (this.pendingBatch.size >= this.config.maxBatchSize) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
          this.batchTimer = null;
        }
        this.executeBatch();
      }
    });
  }

  private async executeBatch(): Promise<void> {
    if (this.pendingBatch.size === 0) return;

    const batch = Array.from(this.pendingBatch.entries());
    this.pendingBatch.clear();
    this.batchTimer = null;

    this.stats.batches++;
    this.stats.batchedRequests += batch.length;
    this.stats.averageBatchSize = this.stats.batchedRequests / this.stats.batches;

    const results = await Promise.allSettled(
      batch.map(([id, item]) => 
        this.router.handle({
          method: item.request.method,
          path: item.request.path,
          headers: {},
          body: item.request.body
        })
      )
    );

    results.forEach((result, index) => {
      const [id, item] = batch[index];
      if (result.status === 'fulfilled') {
        item.resolve(result.value.data);
      } else {
        item.reject(result.reason);
      }
    });
  }

  getStats() {
    return {
      ...this.stats,
      efficiency: ((1 - (this.stats.batches / this.stats.totalRequests)) * 100).toFixed(2) + '%'
    };
  }

  async executeBatchManual(requests: BatchRequest[]): Promise<BatchResponse[]> {
    const results = await Promise.allSettled(
      requests.map(req => 
        this.router.handle({
          method: req.method,
          path: req.path,
          headers: {},
          body: req.body
        })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          id: requests[index].id,
          status: result.value.status,
          data: result.value.data
        };
      } else {
        return {
          id: requests[index].id,
          status: 500,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }
}