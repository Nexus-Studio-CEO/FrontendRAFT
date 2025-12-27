/**
 * FrontendRAFT - Smart Caching Layer
 * 
 * Multi-level intelligent caching with TTL, tags, and LRU eviction.
 * RAFT Feature #2: Smart Caching
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { CacheOptions, CacheEntry, RAFTConfig } from '../types';
import type { StorageLayer } from './StorageLayer';

export class CacheLayer {
  private storage: StorageLayer;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: Required<NonNullable<RAFTConfig['cache']>>;
  private stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };

  constructor(storage: StorageLayer, config?: RAFTConfig['cache']) {
    this.storage = storage;
    this.config = {
      enabled: config?.enabled ?? true,
      defaultTTL: config?.defaultTTL ?? 5 * 60 * 1000,
      maxSize: config?.maxSize ?? 50 * 1024 * 1024
    };
    this.startCleanupTimer();
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      this.stats.hits++;
      return memEntry.value as T;
    }

    try {
      const entry = await this.storage.get<CacheEntry>(`cache:${key}`);
      if (entry && !this.isExpired(entry)) {
        this.memoryCache.set(key, entry);
        this.stats.hits++;
        return entry.value as T;
      }
      if (entry) await this.delete(key);
    } catch (error) {}

    this.stats.misses++;
    return null;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (!this.config.enabled) return;

    const ttl = options?.ttl ?? this.config.defaultTTL;
    const tags = options?.tags ?? [];
    const size = this.estimateSize(value);

    if (size > this.config.maxSize) {
      console.warn(`Cache entry too large: ${size} bytes`);
      return;
    }

    const entry: CacheEntry = { key, value, timestamp: Date.now(), ttl, tags, size };

    await this.evictIfNeeded(size);
    this.memoryCache.set(key, entry);

    try {
      await this.storage.save(`cache:${key}`, entry);
    } catch (error) {
      console.error('Failed to cache in storage:', error);
    }

    this.stats.sets++;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await this.storage.delete(`cache:${key}`);
    } catch (error) {}
  }

  async invalidateTag(tag: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) toDelete.push(key);
    }
    for (const key of toDelete) await this.delete(key);
    console.log(`Invalidated ${toDelete.length} entries with tag: ${tag}`);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await this.storage.list('cache:');
      for (const key of keys) await this.storage.delete(key);
    } catch (error) {
      console.error('Failed to clear cache storage:', error);
    }
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      memoryEntries: this.memoryCache.size,
      memorySize: this.getCurrentSize()
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private estimateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1000;
    }
  }

  private getCurrentSize(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) total += entry.size;
    return total;
  }

  private async evictIfNeeded(incomingSize: number): Promise<void> {
    const currentSize = this.getCurrentSize();
    if (currentSize + incomingSize <= this.config.maxSize) return;

    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      await this.delete(key);
      freedSize += entry.size;
      this.stats.evictions++;
      if (currentSize - freedSize + incomingSize <= this.config.maxSize) break;
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const toDelete: string[] = [];
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) toDelete.push(key);
      }
      for (const key of toDelete) this.delete(key);
    }, 60000);
  }

  memoize<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CacheOptions): T {
    return (async (...args: any[]) => {
      const key = `memoized:${fn.name}:${JSON.stringify(args)}`;
      const cached = await this.get(key);
      if (cached !== null) return cached;
      const result = await fn(...args);
      await this.set(key, result, options);
      return result;
    }) as T;
  }
}