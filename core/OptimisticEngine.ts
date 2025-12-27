/**
 * FrontendRAFT - Optimistic Engine
 * 
 * Optimistic updates for instant UI feedback with automatic rollback.
 * RAFT Feature #4: Optimistic Updates
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { OptimisticUpdate, OptimisticOptions } from '../types';
import type { StorageLayer } from './StorageLayer';
import type { CacheLayer } from './CacheLayer';

export class OptimisticEngine {
  private storage: StorageLayer;
  private cache: CacheLayer;
  private pendingUpdates: Map<string, OptimisticUpdate> = new Map();
  private stats = { total: 0, succeeded: 0, rolledBack: 0 };

  constructor(storage: StorageLayer, cache: CacheLayer) {
    this.storage = storage;
    this.cache = cache;
  }

  async create<T>(
    resourceType: string,
    optimisticData: T,
    actualRequest: () => Promise<T>,
    options?: OptimisticOptions
  ): Promise<T> {
    const updateId = crypto.randomUUID();
    const resourceId = (optimisticData as any).id || updateId;

    const update: OptimisticUpdate = {
      id: updateId,
      operation: 'create',
      resourceType,
      resourceId,
      optimisticData,
      actualRequest,
      rollback: async () => {
        await this.storage.delete(`${resourceType}:${resourceId}`);
        await this.cache.delete(`${resourceType}:${resourceId}`);
      },
      timestamp: Date.now()
    };

    this.pendingUpdates.set(updateId, update);
    this.stats.total++;

    await this.storage.save(`${resourceType}:${resourceId}`, optimisticData);
    await this.cache.set(`${resourceType}:${resourceId}`, optimisticData, { ttl: 60000 });

    this.executeActualRequest(update, options);

    return optimisticData;
  }

  async update<T>(
    resourceType: string,
    resourceId: string,
    optimisticData: Partial<T>,
    actualRequest: () => Promise<T>,
    options?: OptimisticOptions
  ): Promise<T> {
    const updateId = crypto.randomUUID();

    const currentData = await this.storage.get<T>(`${resourceType}:${resourceId}`);
    const mergedData = { ...currentData, ...optimisticData };

    const update: OptimisticUpdate = {
      id: updateId,
      operation: 'update',
      resourceType,
      resourceId,
      optimisticData: mergedData,
      actualRequest,
      rollback: async () => {
        await this.storage.save(`${resourceType}:${resourceId}`, currentData);
        await this.cache.set(`${resourceType}:${resourceId}`, currentData);
      },
      timestamp: Date.now()
    };

    this.pendingUpdates.set(updateId, update);
    this.stats.total++;

    await this.storage.save(`${resourceType}:${resourceId}`, mergedData);
    await this.cache.set(`${resourceType}:${resourceId}`, mergedData, { ttl: 60000 });

    this.executeActualRequest(update, options);

    return mergedData as T;
  }

  async delete(
    resourceType: string,
    resourceId: string,
    actualRequest: () => Promise<void>,
    options?: OptimisticOptions
  ): Promise<void> {
    const updateId = crypto.randomUUID();

    const currentData = await this.storage.get(`${resourceType}:${resourceId}`);

    const update: OptimisticUpdate = {
      id: updateId,
      operation: 'delete',
      resourceType,
      resourceId,
      optimisticData: null,
      actualRequest,
      rollback: async () => {
        await this.storage.save(`${resourceType}:${resourceId}`, currentData);
        await this.cache.set(`${resourceType}:${resourceId}`, currentData);
      },
      timestamp: Date.now()
    };

    this.pendingUpdates.set(updateId, update);
    this.stats.total++;

    await this.storage.delete(`${resourceType}:${resourceId}`);
    await this.cache.delete(`${resourceType}:${resourceId}`);

    this.executeActualRequest(update, options);
  }

  private async executeActualRequest(update: OptimisticUpdate, options?: OptimisticOptions): Promise<void> {
    try {
      const result = await update.actualRequest();
      
      this.pendingUpdates.delete(update.id);
      this.stats.succeeded++;

      if (update.operation !== 'delete') {
        await this.storage.save(`${update.resourceType}:${update.resourceId}`, result);
        await this.cache.set(`${update.resourceType}:${update.resourceId}`, result, { ttl: 60000 });
      }

      if (options?.onSuccess) {
        options.onSuccess(result);
      }
    } catch (error) {
      console.error('Optimistic update failed:', error);

      if (options?.rollbackOnError !== false) {
        await update.rollback();
        this.stats.rolledBack++;
      }

      this.pendingUpdates.delete(update.id);

      if (options?.onError) {
        options.onError(error);
      }
    }
  }

  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values());
  }

  getStats() {
    return {
      ...this.stats,
      successRate: ((this.stats.succeeded / this.stats.total) * 100).toFixed(2) + '%',
      rollbackRate: ((this.stats.rolledBack / this.stats.total) * 100).toFixed(2) + '%'
    };
  }
}