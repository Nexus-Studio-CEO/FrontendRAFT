/**
 * FrontendRAFT - Smart Caching Layer
 * 
 * Multi-strategy caching (LRU, LFU, FIFO) with TTL - Feature #2
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

export class CacheLayer {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.ttl = config.ttl || 5 * 60 * 1000;
    this.maxSize = config.maxSize || 50;
    this.strategy = config.strategy || 'lru';
    
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, customTTL) {
    if (!this.enabled) return;

    if (this.cache.size >= this.maxSize) {
      this._evict();
    }

    const entry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: customTTL || this.ttl,
      hits: 0,
      lastAccess: Date.now()
    };

    this.cache.set(key, entry);
  }

  get(key) {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    entry.lastAccess = Date.now();
    this.hits++;

    return entry.value;
  }

  has(key) {
    if (!this.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  _evict() {
    if (this.cache.size === 0) return;

    let keyToEvict;

    switch (this.strategy) {
      case 'lru':
        keyToEvict = this._evictLRU();
        break;
      case 'lfu':
        keyToEvict = this._evictLFU();
        break;
      case 'fifo':
        keyToEvict = this._evictFIFO();
        break;
      default:
        keyToEvict = this._evictLRU();
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  _evictLFU() {
    let leastUsedKey = null;
    let minHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  _evictFIFO() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;

    return {
      enabled: this.enabled,
      strategy: this.strategy,
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      entries: Array.from(this.cache.values()).map(e => ({
        key: e.key,
        age: Date.now() - e.timestamp,
        hits: e.hits,
        ttl: e.ttl
      }))
    };
  }

  warmup(entries) {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value);
    }
  }
}