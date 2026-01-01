/**
 * FrontendRAFT - Optimistic Engine
 * 
 * Handles optimistic updates with automatic rollback on failure
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

class OptimisticEngine {
    constructor() {
        this.pendingUpdates = new Map();
        this.updateId = 0;
        this.rollbackHistory = [];
        this.stats = {
            total: 0,
            successful: 0,
            rolledBack: 0
        };
    }

    /**
     * Execute optimistic update
     * @param {function} optimisticFn - Function to execute immediately (UI update)
     * @param {function} serverFn - Function to execute on server
     * @param {function} rollbackFn - Function to rollback if server fails
     * @returns {Promise} Resolves with server result or rolls back
     */
    async execute(optimisticFn, serverFn, rollbackFn) {
        const id = ++this.updateId;
        this.stats.total++;
        
        // Store rollback info
        const update = {
            id,
            rollbackFn,
            timestamp: Date.now()
        };
        this.pendingUpdates.set(id, update);
        
        Logger.info(`OptimisticEngine: Starting optimistic update #${id}`);
        
        try {
            // Execute optimistic update immediately
            const optimisticResult = await optimisticFn();
            Logger.info(`OptimisticEngine: Optimistic update #${id} applied`);
            
            // Execute server update
            const serverResult = await serverFn();
            Logger.info(`OptimisticEngine: Server confirmed update #${id}`);
            
            this.pendingUpdates.delete(id);
            this.stats.successful++;
            
            return serverResult;
            
        } catch (error) {
            Logger.error(`OptimisticEngine: Update #${id} failed: ${error.message}`);
            
            // Rollback
            await this._rollback(id);
            this.stats.rolledBack++;
            
            throw error;
        }
    }

    /**
     * Rollback optimistic update
     */
    async _rollback(id) {
        const update = this.pendingUpdates.get(id);
        if (!update) {
            Logger.warn(`OptimisticEngine: No rollback found for update #${id}`);
            return;
        }
        
        try {
            await update.rollbackFn();
            Logger.info(`OptimisticEngine: Rolled back update #${id}`);
            
            this.rollbackHistory.push({
                id,
                timestamp: Date.now(),
                duration: Date.now() - update.timestamp
            });
            
        } catch (rollbackError) {
            Logger.error(`OptimisticEngine: Rollback failed for #${id}: ${rollbackError.message}`);
        } finally {
            this.pendingUpdates.delete(id);
        }
    }

    /**
     * Create optimistic state manager
     * @param {object} initialState - Initial state object
     */
    createStateManager(initialState) {
        let state = { ...initialState };
        const listeners = new Set();
        
        return {
            getState: () => ({ ...state }),
            
            setState: (newState) => {
                state = { ...state, ...newState };
                listeners.forEach(listener => listener(state));
            },
            
            subscribe: (listener) => {
                listeners.add(listener);
                return () => listeners.delete(listener);
            },
            
            optimisticUpdate: async (updates, serverFn) => {
                const previousState = { ...state };
                
                return this.execute(
                    // Optimistic
                    async () => {
                        state = { ...state, ...updates };
                        listeners.forEach(listener => listener(state));
                    },
                    // Server
                    serverFn,
                    // Rollback
                    async () => {
                        state = previousState;
                        listeners.forEach(listener => listener(state));
                    }
                );
            }
        };
    }

    /**
     * Batch optimistic updates
     * @param {Array} updates - Array of {optimistic, server, rollback}
     */
    async executeBatch(updates) {
        Logger.info(`OptimisticEngine: Executing batch of ${updates.length} updates`);
        
        const results = [];
        const successful = [];
        
        // Execute all optimistic updates immediately
        for (let i = 0; i < updates.length; i++) {
            const id = ++this.updateId;
            this.pendingUpdates.set(id, {
                id,
                rollbackFn: updates[i].rollback,
                timestamp: Date.now()
            });
            
            try {
                await updates[i].optimistic();
                successful.push(i);
            } catch (error) {
                Logger.error(`OptimisticEngine: Optimistic update ${i} failed: ${error.message}`);
            }
        }
        
        // Execute server updates
        for (const index of successful) {
            try {
                const result = await updates[index].server();
                results.push({ index, success: true, result });
            } catch (error) {
                await updates[index].rollback();
                results.push({ index, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Get optimistic update statistics
     */
    getStats() {
        const successRate = this.stats.total > 0
            ? ((this.stats.successful / this.stats.total) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            successRate: `${successRate}%`,
            pending: this.pendingUpdates.size,
            avgRollbackTime: this._calculateAvgRollbackTime()
        };
    }

    /**
     * Calculate average rollback time
     */
    _calculateAvgRollbackTime() {
        if (this.rollbackHistory.length === 0) return 0;
        
        const total = this.rollbackHistory.reduce((sum, r) => sum + r.duration, 0);
        return Math.round(total / this.rollbackHistory.length);
    }

    /**
     * Clear rollback history
     */
    clearHistory() {
        this.rollbackHistory = [];
        Logger.info('OptimisticEngine: Rollback history cleared');
    }

    /**
     * Retry failed update
     */
    async retry(updateFn) {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                const result = await updateFn();
                Logger.info(`OptimisticEngine: Retry successful on attempt ${attempt + 1}`);
                return result;
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    Logger.error(`OptimisticEngine: All retries failed`);
                    throw error;
                }
                
                const delay = Math.pow(2, attempt) * 100; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// Global instance
window.OptimisticEngine = new OptimisticEngine();