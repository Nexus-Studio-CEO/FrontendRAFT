/**
 * FrontendRAFT - Optimistic Update Engine
 * 
 * RAFT Feature #4: Instant UI updates with automatic rollback on errors.
 * Applies changes immediately, confirms with server, rolls back if failed.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Optimistic Update Pattern:
 * 
 * 1. Apply change to UI immediately (optimistic state)
 * 2. Store original state for rollback
 * 3. Send request to server
 * 4. On success: Commit optimistic state
 * 5. On failure: Rollback to original state
 */
export class OptimisticEngine {
  /**
   * @param {StorageLayer} storage CSOP storage layer
   */
  constructor(storage) {
    this.storage = storage;
    
    // Track optimistic updates
    this.optimisticUpdates = new Map();
    
    // Rollback history
    this.rollbackStack = [];
    
    // Statistics
    this.stats = {
      applied: 0,
      committed: 0,
      rolledBack: 0,
      pending: 0
    };

    console.log('✅ OptimisticEngine initialized (RAFT Feature #4)');
  }

  /**
   * Apply optimistic update
   * 
   * @param {string} key Update key (e.g., resource path)
   * @param {any} newData New data to apply
   * @returns {string} Update ID for tracking
   * 
   * @example
   * const updateId = optimistic.apply('/api/users/123', { name: 'Alice' });
   */
  apply(key, newData) {
    const updateId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`⚡ Applying optimistic update: ${key}`);

    // Store current state for rollback
    const currentState = this._getCurrentState(key);

    const update = {
      id: updateId,
      key,
      originalData: currentState,
      newData,
      appliedAt: Date.now(),
      status: 'pending'
    };

    this.optimisticUpdates.set(updateId, update);
    this.stats.applied++;
    this.stats.pending++;

    // Apply new data immediately (in-memory)
    this._applyUpdate(key, newData);

    return updateId;
  }

  /**
   * Commit optimistic update (on success)
   * 
   * @param {string} updateId Update ID
   * 
   * @example
   * optimistic.commit(updateId);
   */
  async commit(updateId) {
    const update = this.optimisticUpdates.get(updateId);

    if (!update) {
      console.warn(`⚠️ Update not found: ${updateId}`);
      return;
    }

    console.log(`✅ Committing optimistic update: ${update.key}`);

    update.status = 'committed';
    update.committedAt = Date.now();

    // Persist to storage via CSOP
    try {
      await this.storage.save(update.key, update.newData);
    } catch (error) {
      console.error('Failed to persist committed update:', error);
    }

    this.stats.committed++;
    this.stats.pending--;

    // Cleanup after a delay
    setTimeout(() => {
      this.optimisticUpdates.delete(updateId);
    }, 5000);
  }

  /**
   * Rollback optimistic update (on error)
   * 
   * @param {string} updateId Update ID
   * 
   * @example
   * optimistic.rollback(updateId);
   */
  rollback(updateId) {
    const update = this.optimisticUpdates.get(updateId);

    if (!update) {
      console.warn(`⚠️ Update not found: ${updateId}`);
      return;
    }

    console.log(`🔄 Rolling back optimistic update: ${update.key}`);

    update.status = 'rolled_back';
    update.rolledBackAt = Date.now();

    // Restore original data
    this._applyUpdate(update.key, update.originalData);

    // Track in rollback history
    this.rollbackStack.push({
      updateId,
      key: update.key,
      rolledBackAt: Date.now()
    });

    this.stats.rolledBack++;
    this.stats.pending--;

    // Cleanup
    this.optimisticUpdates.delete(updateId);
  }

  /**
   * Rollback all pending updates for a key
   * 
   * @param {string} key Resource key
   * 
   * @example
   * optimistic.rollbackAll('/api/users/123');
   */
  rollbackAll(key) {
    const updates = Array.from(this.optimisticUpdates.values())
      .filter(u => u.key === key && u.status === 'pending');

    updates.forEach(update => {
      this.rollback(update.id);
    });

    console.log(`🔄 Rolled back ${updates.length} updates for: ${key}`);
  }

  /**
   * Get current optimistic state for a key
   * 
   * @param {string} key Resource key
   * @returns {any} Current state (with pending optimistic updates applied)
   */
  getOptimisticState(key) {
    const pendingUpdates = Array.from(this.optimisticUpdates.values())
      .filter(u => u.key === key && u.status === 'pending')
      .sort((a, b) => a.appliedAt - b.appliedAt);

    if (pendingUpdates.length === 0) {
      return this._getCurrentState(key);
    }

    // Return the most recent optimistic state
    return pendingUpdates[pendingUpdates.length - 1].newData;
  }

  /**
   * Check if key has pending updates
   * 
   * @param {string} key Resource key
   * @returns {boolean} True if pending
   */
  hasPendingUpdates(key) {
    return Array.from(this.optimisticUpdates.values())
      .some(u => u.key === key && u.status === 'pending');
  }

  /**
   * Get all pending updates
   * 
   * @returns {Array} List of pending updates
   */
  getPendingUpdates() {
    return Array.from(this.optimisticUpdates.values())
      .filter(u => u.status === 'pending')
      .map(u => ({
        id: u.id,
        key: u.key,
        appliedAt: u.appliedAt,
        age: Date.now() - u.appliedAt
      }));
  }

  /**
   * Get rollback history
   * 
   * @param {number} limit Max entries
   * @returns {Array} Recent rollbacks
   */
  getRollbackHistory(limit = 10) {
    return this.rollbackStack.slice(-limit);
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Engine stats
   */
  getStats() {
    const successRate = this.stats.applied > 0
      ? ((this.stats.committed / this.stats.applied) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`
    };
  }

  /**
   * Clear all optimistic updates
   */
  clear() {
    this.optimisticUpdates.clear();
    this.rollbackStack = [];
    console.log('🧹 Cleared all optimistic updates');
  }

  /**
   * Get current state from storage
   * @private
   */
  _getCurrentState(key) {
    // In real implementation, would fetch from storage
    // For now, return null (no previous state)
    return null;
  }

  /**
   * Apply update (in-memory)
   * @private
   */
  _applyUpdate(key, data) {
    // In real implementation, would update UI state
    // This is handled by framework integration (React/Vue)
    console.log(`📝 Update applied to ${key}`);
  }
}

export default OptimisticEngine;