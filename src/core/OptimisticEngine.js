/**
 * FrontendRAFT - Optimistic Updates Engine
 * 
 * Instant UI updates with automatic rollback on failure - Feature #4
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class OptimisticEngine {
  constructor() {
    this.updates = new Map();
    this.rollbacks = new Map();
    this.updateCount = 0;
  }

  async apply(entity, optimisticData, actualRequest, options = {}) {
    const updateId = `update_${++this.updateCount}_${Date.now()}`;

    const update = {
      id: updateId,
      entity,
      optimisticData,
      originalData: options.originalData || null,
      status: 'pending',
      createdAt: Date.now(),
      timeout: options.timeout || 5000
    };

    this.updates.set(updateId, update);

    if (options.onOptimistic) {
      options.onOptimistic(optimisticData);
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), update.timeout)
      );

      const result = await Promise.race([actualRequest(), timeoutPromise]);

      update.status = 'confirmed';
      update.actualData = result;
      update.completedAt = Date.now();

      if (options.onConfirm) {
        options.onConfirm(result);
      }

      this.updates.delete(updateId);

      return { success: true, data: result };
    } catch (error) {
      update.status = 'failed';
      update.error = error.message;
      update.failedAt = Date.now();

      if (options.onRollback) {
        options.onRollback(update.originalData);
      }

      this.rollbacks.set(updateId, {
        ...update,
        rollbackReason: error.message
      });

      this.updates.delete(updateId);

      return { success: false, error: error.message, rolled_back: true };
    }
  }

  async applyMultiple(updates) {
    const results = await Promise.allSettled(
      updates.map(u => this.apply(u.entity, u.optimisticData, u.actualRequest, u.options))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        entity: updates[i].entity,
        success: r.status === 'fulfilled' && r.value.success,
        data: r.status === 'fulfilled' ? r.value.data : null,
        error: r.status === 'rejected' ? r.reason.message : (r.value && r.value.error)
      }))
    };
  }

  getPendingUpdates() {
    return Array.from(this.updates.values()).map(u => ({
      id: u.id,
      entity: u.entity,
      status: u.status,
      age: Date.now() - u.createdAt
    }));
  }

  getRollbackHistory() {
    return Array.from(this.rollbacks.values()).map(r => ({
      id: r.id,
      entity: r.entity,
      reason: r.rollbackReason,
      failedAt: r.failedAt
    }));
  }

  clearHistory() {
    this.rollbacks.clear();
  }

  async retry(updateId) {
    const rollback = this.rollbacks.get(updateId);
    
    if (!rollback) {
      throw new Error(`No rollback found for update: ${updateId}`);
    }

    this.rollbacks.delete(updateId);

    return this.apply(
      rollback.entity,
      rollback.optimisticData,
      async () => {
        throw new Error('Original request not available for retry');
      }
    );
  }

  getStats() {
    return {
      pending: this.updates.size,
      rolledBack: this.rollbacks.size,
      totalUpdates: this.updateCount,
      updates: this.getPendingUpdates(),
      rollbacks: this.getRollbackHistory()
    };
  }

  createSnapshot(entity) {
    return {
      entity,
      data: JSON.parse(JSON.stringify(entity)),
      timestamp: Date.now()
    };
  }

  restoreSnapshot(snapshot) {
    return JSON.parse(JSON.stringify(snapshot.data));
  }
}