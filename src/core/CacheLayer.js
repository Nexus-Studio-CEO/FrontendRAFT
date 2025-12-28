/**
 * FrontendRAFT - Smart Caching Layer
 * 
 * RAFT Feature #2: Multi-level caching with automatic TTL.
 * Provides memory cache, IndexedDB cache, and intelligent invalidation.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Smart Caching Strategies:
 * 
 * 1. Memory Cache (L1) - Fastest, limited size
 * 2. IndexedDB Cache (L2) - Slower, larger capacity via CSOP
 * 3. TTL-based invalidation
 * 4. LRU eviction policy
 * 5. Tag-based invalidation
 */
export class CacheLayer {
  /**
   * @param {StorageLayer} storage CSOP storage layer
   */
  constructor(storage) {
    this.storage = storage;
    
    // L1 Cache (Memory) - Fast but limited
    this.memoryCache = new Map();
    this.maxMemorySize = 100; // Max 100 items in memory
    
    // Access tracking for LRU
    this.accessOrder = [];
    
    // Cache stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      storageHits: 0
    };

    console.log('✅ CacheLayer initialized (RAFT Feature #2)');
  }

  /**
   * Get cached value
   * 
   * @param {string} key Cache key
   * @returns {Promise<any|null>} Cached value or null
   * 
   * @example
   * const data = await cache.get('/api/users');
   * if (data) console.log('Cache hit!');
   */
  async get(key) {
    // 1. Try L1 (Memory) first
    const memoryEntry = this.memoryCache.get(key);
    
    if (memoryEntry) {
      // Check if expired
      if (this._isExpired(memoryEntry)) {
        this.memoryCache.delete(key);
      } else {
        this._trackAccess(key);
        this.stats.hits++;
        this.stats.memoryHits++;
        return memoryEntry.data;
      }
    }

    // 2. Try L2 (IndexedDB via CSOP)
    try {
      const storageKey = this._storageKey(key);
      const result = await this.storage.get(storageKey);
      
      if (result) {
        const entry = result;
        
        // Check if expired
        if (this._isExpired(entry)) {
          await this.storage.delete(storageKey);
          this.stats.misses++;
          return null;
        }

        // Promote to L1
        this._setMemory(key, entry);
        this.stats.hits++;
        this.stats.storageHits++;
        return entry.data;
      }
    } catch (error) {
      // Storage error, continue as cache miss
      console.warn('Cache storage error:', error);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached value
   * 
   * @param {string} key Cache key
   * @param {any} data Data to cache
   * @param {Object} options Cache options
   * @param {number} options.ttl Time to live (ms), default 60000 (1 min)
   * @param {string[]} options.tags Tags for invalidation
   * 
   * @example
   * await cache.set('/api/users', users, { ttl: 300000, tags: ['users'] });
   */
  async set(key, data, options = {}) {
    const {
      ttl = 60000, // 1 minute default
      tags = []
    } = options;

    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      expiresAt: Date.now() + ttl
    };

    // Set in L1 (Memory)
    this._setMemory(key, entry);

    // Set in L2 (IndexedDB via CSOP)
    try {
      const storageKey = this._storageKey(key);
      await this.storage.save(storageKey, entry);
    } catch (error) {
      console.warn('Failed to cache in storage:', error);
      // Continue anyway, memory cache still works
    }
  }

  /**
   * Invalidate cache by key
   * 
   * @param {string} key Cache key
   * 
   * @example
   * await cache.invalidate('/api/users/123');
   */
  async invalidate(key) {
    // Remove from L1
    this.memoryCache.delete(key);
    
    // Remove from L2
    try {
      const storageKey = this._storageKey(key);
      await this.storage.delete(storageKey);
    } catch (error) {
      console.warn('Failed to invalidate from storage:', error);
    }
  }

  /**
   * Invalidate cache by tag
   * 
   * @param {string} tag Tag name
   * 
   * @example
   * await cache.invalidateByTag('users'); // Invalidates all 'users' tagged cache
   */
  async invalidateByTag(tag) {
    // Invalidate from L1
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate from L2
    try {
      const keys = await this.storage.list('cache:');
      
      for (const storageKey of keys) {
        const entry = await this.storage.get(storageKey);
        if (entry && entry.tags && entry.tags.includes(tag)) {
          await this.storage.delete(storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to invalidate by tag from storage:', error);
    }
  }

  /**
   * Clear all cache
   * 
   * @example
   * await cache.clear();
   */
  async clear() {
    // Clear L1
    this.memoryCache.clear();
    this.accessOrder = [];

    // Clear L2
    try {
      const keys = await this.storage.list('cache:');
      for (const key of keys) {
        await this.storage.delete(key);
      }
    } catch (error) {
      console.warn('Failed to clear storage cache:', error);
    }

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      storageHits: 0
    };
  }

  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache stats
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2) 
      : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size
    };
  }

  /**
   * Set memory cache with LRU eviction
   * @private
   */
  _setMemory(key, entry) {
    // LRU eviction if full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const lruKey = this.accessOrder.shift();
      this.memoryCache.delete(lruKey);
    }

    this.memoryCache.set(key, entry);
    this._trackAccess(key);
  }

  /**
   * Track access for LRU
   * @private
   */
  _trackAccess(key) {
    // Remove existing
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recent)
    this.accessOrder.push(key);
  }

  /**
   * Check if cache entry is expired
   * @private
   */
  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Generate storage key
   * @private
   */
  _storageKey(key) {
    return `cache:${key}`;
  }
}

export default CacheLayer;